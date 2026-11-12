---
id: other-ci-providers
title: Authenticate from GitLab CI and other CI providers without a secret
nav_title: GitLab CI and others
description: Let a GitLab CI job, or any CI job with an OIDC token, act as a service account by exchanging that token, with no secret stored in the CI provider.
page_type: task
parent: home
nav_order: 56
tags: [iam, service-accounts, security, api]
last_reviewed: 2026-11-12
---

# Authenticate from GitLab CI and other CI providers without a secret

A CI provider that gives its jobs OIDC tokens can authenticate them as a `WORKLOAD` service account, as GitHub Actions does. A federated credential on the service account trusts the provider's tokens when they carry the claims you name. The job hands its token to the `origin` CLI or an SDK in the variable `ORIGINCLOUD_OIDC_TOKEN`, and they exchange it at the security token service for the service account's access token. No secret is stored in the CI provider. [Workload identity federation](workload-identity-federation.md) explains what the exchange checks and which providers qualify.

## Prerequisites

- A `WORKLOAD` service account with the roles the job needs. See [Use service accounts](service-accounts.md) and [Assign and revoke roles](assign-roles.md).
- `iam.service_account.create` and `iam.service_account.act_as` on the organization, to create its federated credential. `roles/owner` holds both.
- For GitLab.com, the project's ID, shown on the project's overview page, or its group's ID.

## Trust the project's jobs on GitLab.com

Create a federated credential that names GitLab.com's issuer, the project's ID, and whatever else must hold for the job, such as its branch:

```sh
origin iam create-federated-credential \
  --organization <org-id> \
  --service-account <service-account-id> \
  --display-name "deploy from main" \
  --issuer https://gitlab.com \
  --condition project_id=<project-id> \
  --condition ref=main
```

GitLab.com's credential must name `project_id` or `namespace_id`, the group's ID. GitLab builds a token's `sub` from the project's path, which a rename or a project re-created under the same name takes over, so `sub` alone is refused. The claim values are strings, as GitLab writes them. GitLab lists every claim of its tokens in [OpenID Connect (OIDC) authentication using ID tokens](https://docs.gitlab.com/ci/secrets/id_token_authentication/).

## Run the job as the service account

Name the job's ID token `ORIGINCLOUD_OIDC_TOKEN` and request it for `https://sts.origincloudapis.eu`. The `origin` CLI, from 1.17.0, and the Go, Rust and TypeScript SDKs exchange it themselves, with nothing else to configure:

```yaml
deploy:
  image: debian:bookworm-slim
  id_tokens:
    ORIGINCLOUD_OIDC_TOKEN:
      aud: https://sts.origincloudapis.eu
  script:
    - apt-get update -qq && apt-get install -y -qq curl ca-certificates
    - curl -fsSL https://packages.origincloud.eu/install.sh | sh
    - export PATH="$HOME/.local/bin:$PATH"
    - origin resourcemanager list-organizations
```

A token handed over in a variable can't be renewed: every exchange sends the same one. It works until the token expires, an hour after the job starts on GitLab.com. After that, the CLI and the SDKs say the token has expired instead of trying the exchange. `origin id token --raw` prints the exchanged access token for a tool that isn't built on the CLI or an SDK.

If the job also has GitHub Actions' variables or `ORIGINCLOUD_OIDC_TOKEN_FILE` set, the file comes first, then `ORIGINCLOUD_OIDC_TOKEN`, then GitHub's token. `ORIGINCLOUD_OIDC_DISABLED=true` stops the CLI and the SDKs from looking for any of them.

## Other CI providers

Any CI provider works whose issuer meets the [requirements](workload-identity-federation.md#the-exchange): OIDC discovery over HTTPS at a public address, and RS256 signatures. Its federated credential names the provider's issuer, the audience the job's token is issued for (`https://sts.origincloudapis.eu` unless you choose another), and a `sub` condition. If the provider builds `sub` from names, add a condition on a numeric ID claim as well.

Give the job's token to the CLI or an SDK in `ORIGINCLOUD_OIDC_TOKEN`. If the token is written to a file that is replaced before it expires, as a Kubernetes projected service account token is, set `ORIGINCLOUD_OIDC_TOKEN_FILE` to the file's path instead: the file is read again at every exchange, so the access token is renewed for as long as the file is.

To name the service account to assume, or to choose the access token's lifetime, exchange the token with `origin sts assume-service-account --oidc-token-file`; see [Get an access token for another tool](identity-provider-login.md#get-an-access-token-for-another-tool).

## When the exchange is refused

A job no federated credential trusts fails with:

```text
the STS refused the CI job's token (invalid_grant): check the federated credential's issuer, audience and conditions against the token's claims
```

Compare the token's claims with the credential's conditions; the job can print them without the token itself:

```sh
python3 -c 'import sys, json, base64; p = sys.argv[1].split(".")[1]; print(json.loads(base64.urlsafe_b64decode(p + "=" * (-len(p) % 4))))' "$ORIGINCLOUD_OIDC_TOKEN"
```

See [Authenticate from GitHub Actions](github-actions.md#when-the-exchange-is-refused) for the other refusals and their HTTP statuses.

## Related

- [Workload identity federation](workload-identity-federation.md)
- [Authenticate from GitHub Actions without a secret](github-actions.md)
- [Log in as a service account with your identity provider's token](identity-provider-login.md)
- [Use service accounts](service-accounts.md)
- [Audit log](audit-log.md)
