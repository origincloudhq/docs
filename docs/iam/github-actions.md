---
id: github-actions
title: Authenticate from GitHub Actions without a secret
nav_title: GitHub Actions
description: Let a GitHub Actions workflow act as a service account by exchanging the job's OIDC token for an access token, with no secret stored in GitHub.
page_type: task
parent: home
nav_order: 55
tags: [iam, service-accounts, security, api]
last_reviewed: 2026-11-11
---

# Authenticate from GitHub Actions without a secret

GitHub gives every Actions job that asks for it a short-lived OIDC token, signed by GitHub, which says which repository, workflow, branch and environment the job runs for. A federated credential on a `WORKLOAD` service account trusts such tokens when they carry the claims you name. The job exchanges its token at the security token service, `https://sts.origincloudapis.eu`, for the service account's access token, and calls the API with it. No secret is stored in GitHub, and nothing is left to rotate. [Workload identity federation](workload-identity-federation.md) explains what the exchange checks, how a deleted credential stops a running job, and what the audit log records.

## Prerequisites

- A `WORKLOAD` service account with the roles the workflow needs. See [Use service accounts](service-accounts.md) and [Assign and revoke roles](assign-roles.md).
- `iam.service_account.create` and `iam.service_account.act_as` on the organization, to create its federated credential. `roles/owner` holds both.
- The repository's numeric id. With the GitHub CLI: `gh api repos/<owner>/<repository> --jq .id`.

## Trust the repository's jobs

Create a federated credential on the service account that names GitHub's issuer, the repository's id, and whatever else must hold for the job, such as its branch or its GitHub environment:

```sh
curl -s -X POST \
  "https://iam.origincloudapis.eu/v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/federatedCredentials" \
  -H "Authorization: Bearer $(origin id token --raw)" \
  -H "Content-Type: application/json" \
  -d '{
    "displayName": "deploy from main",
    "issuer": "https://token.actions.githubusercontent.com",
    "conditions": {
      "repository_id": "<repository-id>",
      "ref": "refs/heads/main",
      "environment": "production"
    }
  }'
```

Conditions are compared with the token's claims exactly, so choose them as narrowly as the job allows. A repository's name can change and be reused by another repository; its id can't, which is why `repository_id` or `repository_owner_id` is required. GitHub lists every claim of its tokens in [OpenID Connect in GitHub Actions](https://docs.github.com/en/actions/concepts/security/openid-connect).

A job's token may match only one federated credential. Two credentials that both match the same job, for example one on `repository_id` alone and one on `repository_id` and `ref`, refuse the exchange as ambiguous.

## Run the job as the service account

The workflow needs the `id-token: write` permission to ask GitHub for a token. The [`origin` CLI](../platform/access/cli.md), from 1.16.0, and the Go, Rust and TypeScript SDKs find the job's token themselves. They exchange it, and renew the access token before it expires, with nothing else to configure. This job lists the organization's projects:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      id-token: write
      contents: read
    steps:
      - name: Install the origin CLI
        run: |
          curl -fsSL https://packages.origincloud.eu/install.sh | sh
          echo "$HOME/.local/bin" >> "$GITHUB_PATH"
      - name: List the organization's projects
        run: origin resourcemanager list-projects --organization <org-id>
```

The job's token comes after `ORIGINCLOUD_ACCESS_TOKEN` and a service account's `ORIGINCLOUD_CLIENT_ID` and `ORIGINCLOUD_CLIENT_SECRET`, and before a login session. A refused exchange fails the command with the reason to check, as described in [When the exchange is refused](#when-the-exchange-is-refused). These variables change how the token is found:

| Variable | Effect |
|---|---|
| `ORIGINCLOUD_OIDC_TOKEN_FILE` | Exchange the token in this file instead, read again at every exchange: another CI provider's OIDC token, or a Kubernetes projected service account token. |
| `ORIGINCLOUD_OIDC_AUDIENCE` | Ask GitHub for a token for this audience instead of `https://sts.origincloudapis.eu`. It must match the federated credential's audience. |
| `ORIGINCLOUD_OIDC_DISABLED` | `true`: don't look for a CI job's token, for example on a self-hosted runner that should use its instance's service account. |

`origin id token` prints the access token, for a later step that calls the API with a tool not built on an SDK.

### Exchange the token yourself

A tool that isn't built on the CLI or an SDK exchanges the job's token at the STS directly:

```yaml
      - name: Exchange the job's token for an Origin Cloud access token
        run: |
          id_token=$(curl -sSf \
            -H "Authorization: bearer $ACTIONS_ID_TOKEN_REQUEST_TOKEN" \
            "$ACTIONS_ID_TOKEN_REQUEST_URL&audience=https://sts.origincloudapis.eu" | jq -r .value)
          access_token=$(curl -sSf https://sts.origincloudapis.eu/v1/token \
            -d grant_type=urn:ietf:params:oauth:grant-type:token-exchange \
            -d subject_token_type=urn:ietf:params:oauth:token-type:jwt \
            --data-urlencode "subject_token=$id_token" | jq -r .access_token)
          echo "::add-mask::$access_token"
          echo "ORIGINCLOUD_ACCESS_TOKEN=$access_token" >> "$GITHUB_ENV"
```

The exchange is RFC 8693's token exchange. Its form fields are:

| Field | Value |
|---|---|
| `grant_type` | `urn:ietf:params:oauth:grant-type:token-exchange` |
| `subject_token` | The job's OIDC token |
| `subject_token_type` | `urn:ietf:params:oauth:token-type:jwt` or `urn:ietf:params:oauth:token-type:id_token` |
| `requested_token_lifetime` | Optional: the access token's lifetime in seconds, from 60 to 3600. Defaults to 900. |

The answer is a JSON object with `access_token`, `issued_token_type`, `token_type` (`Bearer`) and `expires_in` in seconds. An access token set this way isn't renewed: a job that runs longer than its lifetime exchanges a fresh job token again.

## When the exchange is refused

A refusal is a JSON object with an `error`, and its HTTP status:

| `error` | Status | Meaning |
|---|---|---|
| `invalid_grant` | 400 | The token isn't accepted: not signed by GitHub, expired, issued for another audience, matched by no federated credential or by more than one, or the service account isn't an active `WORKLOAD` account. For security, the answer doesn't say which. |
| `invalid_request` | 400 | A field is missing or malformed. `error_description` says which. |
| `temporarily_unavailable` | 503 | The STS can't check the token right now. Retry with backoff. |

If `invalid_grant` persists, compare the job's claims with the federated credential's conditions. A job can print its own token's claims with `cut -d. -f2 <<<"$id_token" | base64 -d 2>/dev/null`; the claims aren't secret, but the token is, so never print the whole token.

## Audit

Every exchange is recorded in the organization's [audit log](audit-log.md) as `iam.federated_credential.exchange`, with the service account as the actor and the federated credential as the target. Its `details` hold the job token's issuer and subject, the run's repository, workflow, ref, commit and run id, and the access token's id and expiry.

## Related

- [Workload identity federation](workload-identity-federation.md)
- [Authenticate from GitLab CI and other CI providers](other-ci-providers.md)
- [Use service accounts](service-accounts.md)
- [Assign and revoke roles](assign-roles.md)
- [Audit log](audit-log.md)
- [IAM reference](reference/index.md#rest-api)
