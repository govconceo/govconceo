# GovConCEO

Executive intelligence briefing for U.S. government contractors, published at [https://govconceo.org](https://govconceo.org).

This repository is the static site served by GitHub Pages from the `main` branch root: homepage, five section pages, and five reports dated November 10, 2026. Nothing here is legal advice.

## Rebuild CSS

Styles are compiled with the Tailwind CSS v4 CLI into `assets/site.css`. After changing `src/input.css` or adding utility classes in the HTML, from the repository root:

```bash
npm install
npx @tailwindcss/cli -i ./src/input.css -o ./assets/site.css --minify
```

Do not commit `node_modules`.
