# Contributing

Thank you for helping improve Origin Cloud's documentation.

## Reporting a problem

Open an issue for anything that is wrong, unclear or missing: a page that
describes behaviour differently from what you see, a step that doesn't work, a
question the page should answer. The **Report an issue** link at the foot of
every page opens one with the page's address filled in. Include what you ran
and what happened where you can, with tokens and account details removed.

To report a security vulnerability, don't open an issue: see
[SECURITY.md](SECURITY.md).

## Changing a page

The pages in `docs/` are written in Origin Cloud's own source repository, next
to the code they describe, where every change is checked against the platform
before it is merged. They are exported here on every change there, as a pull
request that merges itself. A pull request in this repository that changes
`docs/` is therefore never merged: if it describes a change we want, we make
the change at the source, credit you, and close the pull request. The change
then arrives here with the next export, usually within minutes of our merge.

A pull request is still the clearest way to show exactly what you mean: use
**Edit** on the page's file in `docs/` on GitHub. For anything larger than a
correction, open an issue first, so that we can agree on the change before you
spend time on it.

Each page shows its path in the source repository (`docs/user/...`) at its
foot, for maintainers, who make the change there.

## Changing the site

The site (`site/`), the image (`_build/`), the scripts and the workflows live
only here, and pull requests to them are reviewed and merged as usual. Before
you open one:

```bash
cd site
npm ci
npx playwright install chromium
npm run build                        # the site, with every link checked
cd ..
export SCAN_WITHOUT_PRIVATE_LIST=fork    # the private list is a secret; CI checks it
python3 scripts/scan.py site site/dist  # what the built site would publish
python3 scripts/scan.py repo            # what this repository publishes
```

Pull requests from forks run the same checks without access to any secret, so
their scans skip the private list of names; main is scanned with it again
before every deploy.

## License

By contributing, you agree that your contribution is licensed like the part of
the repository it changes: content under CC BY 4.0 ([LICENSE-content](LICENSE-content)),
code and code samples under the Apache License 2.0 ([LICENSE](LICENSE)).
