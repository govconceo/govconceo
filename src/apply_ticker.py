#!/usr/bin/env python3
"""Rewrite the latest-reports ticker link text from src/ticker-headlines.json.

Does not change report H1s, cards, the RSS/JSON feeds, Open Graph tags, or the sidebar.
Run from the site root: python3 src/apply_ticker.py
"""
from __future__ import annotations

import html as H
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "src" / "ticker-headlines.json"

ITEM_RE = re.compile(
    r'<li class="site-ticker-item">\s*'
    r'<a href="(?P<href>[^"]+)"(?P<attrs>[^>]*)>'
    r"(?P<text>.*?)"
    r"</a>",
    re.S,
)


def slug_from_href(href: str) -> str:
    name = href.rsplit("/", 1)[-1]
    if name.endswith(".html"):
        name = name[:-5]
    return name


def main() -> int:
    headlines = json.loads(DATA.read_text())["headlines"]
    changed = 0
    missing: set[str] = set()
    for path in sorted(ROOT.rglob("*.html")):
        if "node_modules" in path.parts:
            continue
        text = path.read_text()
        if 'class="site-ticker"' not in text:
            continue

        def repl(m: re.Match) -> str:
            slug = slug_from_href(m.group("href"))
            headline = headlines.get(slug)
            if not headline:
                missing.add(slug)
                return m.group(0)
            full = H.unescape(re.sub(r"\s+", " ", m.group("text")).strip())
            attrs = m.group("attrs")
            title_attr = f' title="{H.escape(full, quote=True)}"'
            if re.search(r'\stitle="', attrs):
                attrs = re.sub(r'\stitle="[^"]*"', title_attr, attrs, count=1)
            else:
                attrs = title_attr + attrs
            return (
                f'<li class="site-ticker-item">\n                    '
                f'<a href="{m.group("href")}"{attrs}>{H.escape(headline)}</a>'
            )

        new, n = ITEM_RE.subn(repl, text)
        if n == 0:
            raise SystemExit(f"no ticker items in {path}")
        if new != text:
            path.write_text(new)
            changed += 1
            print(f"updated {path.relative_to(ROOT)} ({n} links)")

    if missing:
        raise SystemExit(f"missing ticker headlines for: {sorted(missing)}")
    print(f"done, {changed} HTML files updated")
    return 0


if __name__ == "__main__":
    sys.exit(main())
