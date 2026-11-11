/* Progressive enhancement: close the mobile <details> nav when a menu link
   is activated so the sticky menu does not cover the destination. No
   third-party code. Without this script the native details/summary still works. */
(function () {
  "use strict";

  function normalizePath(path) {
    if (!path) return "/";
    if (path.length > 1 && path.endsWith("/")) path = path.slice(0, -1);
    if (path.endsWith("/index.html")) path = path.slice(0, -10) || "/";
    if (path === "/index.html") path = "/";
    if (!path) path = "/";
    return path;
  }

  function resolvedUrl(href) {
    try {
      return new URL(href, window.location.href);
    } catch (e) {
      return null;
    }
  }

  function isSameDocument(url) {
    return url.origin === window.location.origin &&
      normalizePath(url.pathname) === normalizePath(window.location.pathname);
  }

  function stickyOffset() {
    var header = document.querySelector(".sticky.top-0, .sticky");
    return header ? Math.ceil(header.getBoundingClientRect().height) : 0;
  }

  function desiredGap() {
    return stickyOffset() + 8;
  }

  function syncScrollPadding() {
    document.documentElement.style.scrollPaddingTop = desiredGap() + "px";
  }

  function focusTarget(el) {
    if (!el) return;
    if (!el.hasAttribute("tabindex")) el.setAttribute("tabindex", "-1");
    try {
      el.focus({ preventScroll: true });
    } catch (e) {
      try { el.focus(); } catch (e2) {}
    }
  }

  function hashId(url) {
    if (!url || !url.hash || url.hash === "#") return "";
    try {
      return decodeURIComponent(url.hash.slice(1));
    } catch (e) {
      return url.hash.slice(1);
    }
  }

  function scrollToId(id, opts) {
    opts = opts || {};
    if (!id) return null;
    var el = document.getElementById(id);
    if (!el) return null;

    var tries = 0;
    var maxTries = 24;

    function apply() {
      syncScrollPadding();
      var gap = desiredGap();
      el.style.scrollMarginTop = gap + "px";
      var top = window.scrollY + el.getBoundingClientRect().top - gap;
      if (top < 0) top = 0;
      window.scrollTo(0, top);
      tries += 1;
      var remaining = el.getBoundingClientRect().top - gap;
      if (Math.abs(remaining) > 2 && tries < maxTries && window.requestAnimationFrame) {
        window.requestAnimationFrame(apply);
        return;
      }
      if (opts.focus) focusTarget(el);
    }

    apply();
    return el;
  }

  function onMenuLinkClick(details, event) {
    if (event.defaultPrevented) return;
    if (event.button !== 0) return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

    var url = resolvedUrl(event.currentTarget.getAttribute("href"));
    details.open = false;
    void document.body.offsetHeight;
    syncScrollPadding();

    if (!url || !isSameDocument(url)) return;

    var id = hashId(url);
    event.preventDefault();

    if (!id) {
      var fallback = document.querySelector("main h1, h1") ||
        document.querySelector(".site-nav-toggle");
      focusTarget(fallback);
      return;
    }

    if (window.location.hash !== "#" + id) {
      if (history.pushState) {
        history.pushState(null, "", "#" + id);
      } else {
        window.location.hash = id;
      }
    }

    function afterCollapse() {
      scrollToId(id, { focus: true });
    }
    if (window.requestAnimationFrame) {
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(afterCollapse);
      });
    } else {
      afterCollapse();
    }
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () {
        scrollToId(id, { focus: true });
      });
    }
  }

  function enhance(details) {
    var links = details.querySelectorAll("a[href]");
    for (var i = 0; i < links.length; i++) {
      links[i].addEventListener("click", function (event) {
        onMenuLinkClick(details, event);
      });
    }
  }

  var menus = document.querySelectorAll("details.site-nav-mobile");
  for (var i = 0; i < menus.length; i++) enhance(menus[i]);

  function alignHash(focus) {
    var id = hashId(window.location);
    if (!id || !document.getElementById(id)) return;
    scrollToId(id, { focus: !!focus });
  }

  syncScrollPadding();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () {
      syncScrollPadding();
      alignHash(false);
    });
  } else {
    alignHash(false);
  }
  window.addEventListener("load", function () { alignHash(false); });
  window.addEventListener("resize", syncScrollPadding);
  window.addEventListener("hashchange", function () { alignHash(false); });
})();
