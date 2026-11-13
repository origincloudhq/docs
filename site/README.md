# The docs site

An Astro site that renders `../docs` at docs.origincloud.eu. Every template in
`src/layouts` and `src/components` is ours; there is no docs-framework theme.

## Run

```bash
cd site
npm ci
npx playwright install chromium   # Mermaid is rendered at build time
npm run dev      # http://localhost:4321/docs/
npm run build    # astro build + check-links + Pagefind index, into dist/
```

`npm run build` needs Playwright's Chromium: Mermaid diagrams are rendered to
SVG at build time, not in the browser.

## How it works

| Requirement | How |
|---|---|
| Content | `src/content.config.ts` loads `../docs/**/*.md` with the frontmatter schema the source checks; an unknown key or an unpublished `availability` fails the build. |
| Links | Pages link to each other by file path, as they read on GitHub; `src/lib/remark-doc-links.mjs` rewrites them to routes, and `scripts/check-links.mjs` fails the build on a broken link in the source or in `dist/`. |
| Brand | Brand System v2, vendored from the Origin Cloud brand kit: `src/styles/brand/` holds the kit's `tokens.css` and `components.css` (do not edit; re-copy from the kit), and header, footer, breadcrumbs, "On this page", chips and the guide grid use the kit's `oc-` markup. `src/styles/docs.css` holds only what the kit has no component for, and contains no hex codes. |
| Code examples | `astro-expressive-code`, plus a `Tabs` component. |
| Diagrams | `rehype-mermaid` with `strategy: 'inline-svg'`: build-time SVG, themed to the light palette and measured in Encode Sans (the build browser loads `public/fonts/fonts.css`). `src/lib/rehype-doc-blocks.mjs` keeps each diagram at its own width and wraps tables for sideways scrolling. No diagram JavaScript ships, and the diagram's text stays indexable. |
| Search | Pagefind: a static index, no external service. Only each page's `<main>` is indexed (`data-pagefind-body`). |
| SEO | Static HTML, canonical and Open Graph tags from frontmatter, a sitemap. |
| Version | `src/pages/version.json.ts` serves `/version.json`: the source commit of the last export that changed a published page (`docs/_export/version.json`), and this repository's commit when the build is given `SITE_COMMIT`. |
| Page actions | Every page links to "Edit this page" (CONTRIBUTING.md) and "Report an issue" (an issue form with the page's address filled in), and shows its source path; `src/lib/source.ts`. |

## Fonts

Encode Sans and JetBrains Mono, both under the SIL Open Font License, served
from `public/fonts/` (licences next to the files). No request goes to a font
service. Copied from the brand kit's `guide/fonts/`.

## Analytics and consent

Google Analytics behind the Klaro consent manager, the same setup as
origincloud.eu. Google Consent Mode v2 defaults every storage type to
*denied*; nothing is granted until a reader accepts, and declining deletes the
`_ga*` cookies. Production builds only: `npm run dev` shows no banner and never
touches the property.

The site shares origincloud.eu's Tag Manager container (`GTM-KDR6WVGD`), with
docs.origincloud.eu registered on it as an additional domain. Accepting fires
`klaro-google-analytics-accepted`, the custom event the container gates its
Analytics tag on. Override the ID with `PUBLIC_ANALYTICS_ID`, which accepts a
`GTM-` container or a `GT-`/`G-` tag; see `src/lib/analytics.ts`.

## Choices worth knowing

- **Light and dark theme.** The page follows the reader's system setting
  until they pick one with the header's switch (remembered in
  `localStorage`); without JavaScript it is light. Both are the kit's own
  themes. Diagrams are rendered once with the light values and their
  colours then tied to the theme (`src/lib/mermaid-theme.mjs`); a new
  diagram type may bring a colour that list does not know yet, so check
  it in the dark theme.
- **Dense layout**, as the brand kit's docs template
  (`guide/layout.html`): navigation 280 px, text up to 920 px, tables and
  code up to 1120 px, "On this page" 240 px, full width.
- **Copper is the main action and the active item only** (the "Open console"
  button, the current page, the selected tab). Code highlighting stays in
  Petrol and grey (`src/styles/code-theme.mjs`), and status colours appear
  only as a dot next to a label.
- **Smartypants is off**: it turned `--flag` into an em dash.
- **Tabs degrade without JavaScript.** Every panel renders visible and
  stacked; the script hides the inactive ones on load.
- **Pinned to Astro 5**, because the build runs on Node 20 (`_build/Dockerfile`
  and `.github/workflows/ci.yml`). Moving to a newer Astro means moving Node
  first.
