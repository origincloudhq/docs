<!--
Changing a page in docs/? It's written in Origin Cloud's source repository and
exported here, so this pull request won't be merged: we make the change at the
source and credit you (CONTRIBUTING.md). It's still the clearest way to show
what you mean.
-->

## What and why

## How it was checked

- [ ] `npm run build` in `site/` (the site, with every link checked)
- [ ] `SCAN_WITHOUT_PRIVATE_LIST=fork python3 scripts/scan.py repo`, and the same with `site site/dist`
