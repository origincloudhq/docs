---
id: service-accounts
title: Use service accounts
nav_title: Service accounts
description: Create a service account for CI and scripts, exchange its client ID and secret for an access token, rotate the secret before it expires, and delete the account to revoke it.
page_type: task
parent: home
nav_order: 50
tags: [iam, service-accounts, cli, api]
last_reviewed: 2026-11-11
---

# Use service accounts

A service account is a non-interactive credential for automation such as CI pipelines, scripts and infrastructure-as-code tools. It belongs to one organization and acts as its own principal: the member `serviceAccount:<service-account-id>` in the `origin iam` commands and the REST API, `service_account:<service-account-id>` in the GraphQL API. Its access is checked exactly like a user's: it can do what its role bindings allow, and nothing else.

A service account authenticates with an OAuth 2.0 client ID and client secret, using the client credentials grant against the platform's identity provider. The resulting access token is sent to the API like a user's.

A client secret expires: 90 days after it is issued unless you ask for a shorter or longer lifetime, and never more than 365 days. From its expiry on, the identity provider refuses it, and you [rotate the secret](#rotate-the-client-secret) to get a new one. For a CI pipeline, prefer a `WORKLOAD` service account that [trusts the CI provider's tokens](#trust-a-ci-providers-tokens): no secret is stored in the pipeline, so none can leak or expire.

Every service account has a type, set when it's created. It never changes.

| Type | Credential |
| --- | --- |
| `EXTERNAL` | An OAuth 2.0 client ID and client secret, for software outside Origin Cloud. The type a create uses when none is given, and the one this page describes. |
| `WORKLOAD` | None. It has no client ID or secret and can't be given one, so no copied credential ever authenticates as it. An instance runs as one: software on it gets a short-lived credential from the instance's metadata service. Launching it needs `iam.service_account.act_as` on the organization, which [`roles/iam/service-account-user`](roles.md#rolesiamservice-account-user) grants. See [Run an instance as a service account](../compute/instances/service-account.md). |

## Before you begin

- To create or delete a service account: an org-wide `roles/owner` assignment.
- To list service accounts: an org-wide `roles/owner` or `roles/viewer` assignment.
- Your organization ID (`<org-id>`).

## Create a service account

1. Create the service account with a display name that tells you what uses it.

   ```sh
   origin iam create-service-account --organization <org-id> --display-name ci-deploy
   ```

   The output contains the service account's resource name, `organizations/<org-id>/serviceAccounts/<service-account-id>`, its `member`, and the credential: `clientId` and `clientSecret`.

   > **Important:** The client secret is shown only once. Store it in your secret manager now. No API returns it again; if you lose it, [rotate the secret](#rotate-the-client-secret) to get a new one.

   The secret expires after 90 days. To ask for another lifetime, more than zero and at most 365 days, create the service account with the REST API's `CreateServiceAccount` and set `secretLifetime`, such as `"2592000s"` for 30 days. Its `secretExpireTime` says when the secret expires.

2. Grant the service account the roles it needs. A new service account holds no roles and can't do anything until you bind one. Use the `member` from the previous step.

   ```sh
   origin iam create-role-binding --organization <org-id> \
     --member serviceAccount:<service-account-id> \
     --role roles/viewer \
     --project projects/<project-id>
   ```

   Grant the smallest role and scope that does the job. See [Assign and revoke roles](assign-roles.md).

3. Verify that the service account is listed with the state `ACTIVE`.

   ```sh
   origin iam list-service-accounts --organization <org-id>
   ```

## Get an access token

Every `origin` command that calls a service runs as a service account when its credential is in the environment; the CLI requests and renews the access token itself:

```sh
export ORIGINCLOUD_CLIENT_ID=<client-id>
export ORIGINCLOUD_CLIENT_SECRET=<client-secret>
origin pvs list-volumes --project <project-id>
```

See [Run commands as a service account](../platform/access/cli.md#run-commands-as-a-service-account).

To call the [GraphQL API](../platform/access/api.md) as the service account, get an access token yourself:

1. Request an access token from the token endpoint with the client credentials grant.

   ```sh
   curl -s \
     https://auth.origincloud.eu/realms/origincloud/protocol/openid-connect/token \
     -d grant_type=client_credentials \
     -d client_id=<client-id> \
     -d client_secret=<client-secret>
   ```

   The response is JSON with an `access_token` and its lifetime in seconds, `expires_in`. A service account's token lives five minutes. Request a new token when it expires.

2. Send the token as a bearer token with each API request.

   ```sh
   curl -s https://graph.origincloudapis.eu/graphql \
     -H "Authorization: Bearer <access-token>" \
     -H "Content-Type: application/json" \
     -d '{"query":"{ iam { permissions { key } } }"}'
   ```

3. Verify that the token is accepted: the response contains a `data` object rather than an authentication error.

## Rotate the client secret

Rotating issues a new client secret for an `EXTERNAL` service account and refuses the old one from that moment on. The new secret is accepted at once, also when the old one had already expired, and expires after its own lifetime: 90 days unless you ask for another, at most 365 days. An access token issued with the old secret stays valid until it expires, within five minutes. The service account keeps its ID, client ID and role bindings.

There is no overlap: anything still using the old secret fails once you rotate. Rotate when you can update every place that holds the secret right away.

Rotating needs `iam.service_account.create` on the organization, which `roles/owner` holds. The CLI has no command for it yet; call the REST API.

1. Rotate the secret. The body may set `secretLifetime`; leave it out for 90 days.

   ```sh
   curl -s -X POST \
     "https://iam.origincloudapis.eu/v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>:rotateSecret" \
     -H "Authorization: Bearer $(origin id token --raw)" \
     -H "Content-Type: application/json" \
     -d '{"secretLifetime": "7776000s", "requestId": "<uuid>"}'
   ```

   The response is the service account with the new secret in `clientSecret` and its expiry in `secretExpireTime`. As at creation, the secret is in this response only.

2. Store the new secret where the old one was, such as in your CI system's secret store.

3. Verify that the new secret works: request an access token with it, as in [Get an access token](#get-an-access-token).

A repeat of the request with the same `requestId` within 24 hours issues no secret and is refused with `CONFLICT`, because the new secret went to the first response only. Rotate again with a new `requestId` to get a working secret.

### Secret expiry

Each `EXTERNAL` service account shows when its secret expires in `secretExpireTime`, in `GetServiceAccount` and `ListServiceAccounts`. Within about a minute of that time, the secret stops being accepted: a request for an access token with it is refused. The service account itself is still `ACTIVE` and keeps its role bindings, and rotating the secret gives it a working one again. An access token issued before the expiry stays valid until it runs out, within five minutes.

A secret issued before secrets expired got an expiry 90 days from when expiry was introduced, as if it was issued then. Check `secretExpireTime` and rotate before it.

A `WORKLOAD` service account has no secret, so it has no `secretExpireTime` and can't be rotated.

## Revoke a service account

Deleting a service account revokes it: it disables its credential and removes every role binding it holds, in every organization and at every scope. From that moment, every request for a new access token is refused, and an access token issued before is refused on its next request.

Deleting is permanent. A deleted service account can't be reactivated or bound to a role again; create a new service account instead. It stays readable, with the state `DELETED`.

An organization can't be deleted while it has a service account that isn't deleted; delete its service accounts first. See [Delete an organization](../platform/organizations/projects.md#delete-an-organization).

1. Find the service account's ID with `list-service-accounts`.

2. Delete it. Deleting can't be undone, so the command needs `--yes`.

   ```sh
   origin iam delete-service-account --organization <org-id> \
     --service-account <service-account-id> --yes
   ```

   This needs only `roles/owner`. The account's role bindings are removed even when they include a role you don't hold yourself, such as a billing role.

3. Check that the service account has the state `DELETED` and a `deleteTime`. Deleted service accounts are listed only with `--show-deleted true`.

   ```sh
   origin iam get-service-account --organization <org-id> --service-account <service-account-id>
   ```

4. Run `list-role-bindings --member serviceAccount:<service-account-id>` and check that it lists no binding.

## Trust a CI provider's tokens

A `WORKLOAD` service account can trust the OIDC tokens of an identity provider outside Origin Cloud, such as the token GitHub Actions gives every job. That trust is a federated credential on the account. It names exactly:

- the token's issuer;
- the audience it must be issued for, `https://sts.origincloudapis.eu` unless you name another;
- the claims it must carry, each with exactly one value.

Software holding a matching token exchanges it for the service account's access token at the security token service, `https://sts.origincloudapis.eu`, so no secret is stored where it runs. [Workload identity federation](workload-identity-federation.md) explains how, and [Authenticate from GitHub Actions](github-actions.md) walks through it.

A federated credential is refused unless:

- **At least one condition names an identity that never changes.** For GitHub Actions' issuer, `https://token.actions.githubusercontent.com`, that is `repository_id` or `repository_owner_id`. For GitLab.com's, `https://gitlab.com`, it is `project_id` or `namespace_id`. For any other issuer, it is `sub`. A repository's or project's name alone isn't enough: a renamed one, or a new one created under an old name, would inherit the trust.
- **No value contains `*`.** Values are matched exactly, never as patterns.
- **The service account is an active `WORKLOAD` one.** An `EXTERNAL` account authenticates with its own secret.

Whoever matches a federated credential acts as the service account. So creating one needs `iam.service_account.create` and `iam.service_account.act_as` on the organization: the right to act as the account yourself. `roles/owner` holds both.

To change a federated credential, create the new one and delete the old; it is never updated. Deleting the service account deletes its federated credentials. Deleting a federated credential also stops the access tokens already exchanged through it, at their next API call.

```sh
origin iam create-federated-credential \
  --organization <org-id> \
  --service-account <service-account-id> \
  --display-name "deploy from main" \
  --issuer https://token.actions.githubusercontent.com \
  --condition repository_id=<repository-id> \
  --condition ref=refs/heads/main \
  --condition environment=production
```

`origin iam list-federated-credentials --organization <org-id> --service-account <service-account-id>` lists them; add `--show-deleted true` to include deleted ones. `origin iam delete-federated-credential --federated-credential <name>` deletes one.

## Using the API

In the REST API, these are `CreateServiceAccount`, `ListServiceAccounts`, `GetServiceAccount`, `RotateServiceAccountSecret` and `DeleteServiceAccount`, and for federated credentials `CreateFederatedCredential`, `ListFederatedCredentials`, `GetFederatedCredential` and `DeleteFederatedCredential`; see the [IAM reference](reference/index.md#rest-api). The GraphQL mutations are `createServiceAccount` and `revokeServiceAccount`; the query is `serviceAccounts`, all in the `iam` namespace. Neither API returns a client secret after the create, except the REST API's `RotateServiceAccountSecret`, which returns the new one. The secret's expiry, `secretExpireTime`, and the create's `secretLifetime` are in the REST API only.

The type is the service account's `type` field in both APIs: set it in the create to make a `WORKLOAD` service account, whose `clientId` and `clientSecret` are then empty in the REST API and null in GraphQL.

```graphql
mutation {
  iam {
    createServiceAccount(input: { orgId: "<org-id>", name: "ci-deploy" }) {
      id
      principal
      clientId
      clientSecret
    }
  }
}
```

## Related

- [Access model](access-model.md)
- [Built-in roles](roles.md)
- [API access](../platform/access/api.md)
- [`create-service-account`](reference/cli.md#create-service-account) and [`delete-service-account`](reference/cli.md#delete-service-account) commands
- [Authenticate from GitHub Actions](github-actions.md)
- [Audit log](audit-log.md) – creation, secret rotation, a secret's expiry and revocation are recorded, and so is the removal of a revoked account's role assignments; so are the creation and deletion of federated credentials, and every exchange through one
