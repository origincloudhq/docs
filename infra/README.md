# What the deploy needs

docs.origincloud.eu is a Helm release of the image `.github/workflows/cd.yml`
builds, on Origin Cloud's own Kubernetes cluster. There is no other
infrastructure in this repository: `cd.yml` and
`_build/helm/values.controlplane.yaml` are the whole deployment.

| | |
|---|---|
| Image | `ghcr.io/origincloudhq/docs:sha-<gitsha>`, built on every push to main |
| Release | `origincloud-docs`, namespace `origincloud-docs` (override with `NAMESPACE`) |
| Certificate | the cluster's `letsencrypt` ClusterIssuer, HTTP-01 |
| Version | `/version.json` names the source commit of the last export that changed a published page, and this repository's commit |

## The `release` environment

The deploy job runs in the GitHub environment `release`. Restrict its
deployment branches to `main` and don't add required reviewers: a merge to main
is the approval, and export pull requests merge themselves.

| Kind | Name | Where | Required | Notes |
|---|---|---|---|---|
| secret | `KUBECONFIG` | `release` environment | yes | base64-encoded kubeconfig for a credential that may manage the release's namespace; the job writes it to its temp directory and deletes it at the end |
| secret | `GHCR_DOCKERCONFIGJSON` | `release` environment | only for a private image | omit it when the GHCR package is public: the chart then renders no pull secret |
| variable | `DEPLOY_RUNNER` | repository | yes | the label of the self-hosted runner that can reach the cluster's API; GitHub-hosted runners can't |
| variable | `INGRESS_HOST` | repository | no | defaults to `docs.origincloud.eu` |
| variable | `NAMESPACE` | repository | no | defaults to `origincloud-docs` |

## Runners

- **build** (`cd.yml`) and every job of `ci.yml` and `export-watch.yml` run on
  GitHub-hosted runners: they need the internet and nothing else.
- **deploy** runs on the runner `DEPLOY_RUNNER` names. It belongs to a runner
  group of its own in the origincloudhq organization that:
  - allows public repositories, and only this one;
  - is limited to the workflow `origincloudhq/docs/.github/workflows/cd.yml@refs/heads/main`;
  - shares no runner with other repositories' CI.

  Only pushes to main and manual dispatches reach it, never a pull request.
  Keep "Require approval for all outside collaborators" on for fork pull
  requests all the same.

## The scans' private list

`scripts/scan.py` reads the internal technology names, and the private
repository, host and user names no file here may contain, from the Actions
secret `INTERNAL_NAMES_JSON` (a repository secret). It is produced from Origin
Cloud's source repository and set there; its shape is in `scripts/scan.py`.
Pull requests from forks get no secrets and skip only that part, with a notice;
anywhere else a missing secret fails the scan.

## Merging export pull requests

The export arrives as a pull request from `export/docs-user`, opened by the
GitHub App the source repository's export uses (installed on this repository
only, with Contents and Pull requests read and write). For it to merge itself:

- the repository allows auto-merge and squash merging;
- main is protected: a pull request is required, with the status checks
  `build` and `scan` (from `ci.yml`) and a review from a code owner, but no
  count of approvals. `.github/CODEOWNERS` owns everything except `docs/`, so
  a change to the site needs a maintainer's review and an export, which
  changes only `docs/` and was reviewed at the source, needs none.

`export-watch.yml` reports an export pull request that is red or open for more
than 24 hours in one issue, labelled `export-watch`, and its own failures in
one labelled `export-watch-failing`; it creates both labels on first use.

## Rendering the release locally

```bash
helm template origincloud-docs _build/helm/charts/basic-webservice \
  --values _build/helm/values.controlplane.yaml \
  --set image.tag=sha-abc1234
```
