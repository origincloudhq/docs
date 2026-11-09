# Origin Cloud documentation

The user documentation of [Origin Cloud](https://www.origincloud.eu/), published
at [docs.origincloud.eu](https://docs.origincloud.eu/): what the platform can do,
written for someone using the API, the `origin` CLI or the console.

| Path | What it is |
|---|---|
| [`docs/`](docs/) | The content: one folder per guide, plain Markdown you can read here on GitHub |
| [`site/`](site/) | The Astro site that renders it: shell, navigation, search, diagrams |
| [`scripts/`](scripts/) | The pre-publication scan and the export watch |
| [`_build/`](_build/) | The container image and its Helm values |
| [`infra/`](infra/) | What the deploy needs |

## Guides

| Guide | Covers |
|---|---|
| [Platform](docs/platform/index.md) | Getting started, organizations and projects, API and CLI access, billing, shared reference |
| [Compute](docs/compute/index.md) | Instances and their lifecycle, instance types, images, key pairs, attaching volumes |
| [Storage](docs/storage/index.md) | Volumes, storage classes, resizing, snapshots, importing a disk image |
| [Network](docs/network/index.md) | VPCs and subnets, route tables, gateways, ACLs, security groups, DNS policies |
| [DNS](docs/dns/index.md) | Public and private hosted zones, record sets |
| [IAM](docs/iam/index.md) | The access model, roles, members, service accounts, the audit log |
| [Observability](docs/observability/index.md) | Metrics for instances, volumes and network interfaces |
| [Pricing](docs/pricing/index.md) | The price list and its API |

## Where the content comes from

The pages in `docs/` are written in Origin Cloud's own source repository, next
to the code they describe and checked against it. Each change there is exported
here as a pull request from the branch `export/docs-user`, which merges itself
once the site builds and every check passes; the merge deploys the site.
`/version.json` on the site names the source commit of the last export that
changed a published page.

So the content is never edited here. A pull request that changes a page is
welcome as a proposal: we make the change at the source, credit you, and close
the pull request, and the change arrives with the next export. Changes to the
site itself (`site/`, `_build/`, the workflows) are reviewed and merged here as
usual. See [CONTRIBUTING.md](CONTRIBUTING.md).

Found something wrong on a page? Every page has a **Report an issue** link
that opens an issue here with the page's address filled in.

## Building the site

```bash
cd site
npm ci
npx playwright install chromium
npm run build    # builds into site/dist and checks every link
```

See [site/README.md](site/README.md) for how the site works.

## License

- **Content**, the documentation text and diagrams in `docs/`: [Creative Commons
  Attribution 4.0 International](LICENSE-content) (CC BY 4.0).
- **Code**, the site, scripts and workflows, and the **code samples** in the
  content: [Apache License 2.0](LICENSE).

The name Origin Cloud and the Origin Cloud logo are trademarks of Origin Cloud
GmbH. Neither licence grants any right to use them.
