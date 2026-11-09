---
id: service-accounts
title: Use service accounts
nav_title: Service accounts
description: Create a service account for CI and scripts, exchange its client ID and secret for an access token, grant it roles, and delete it to revoke it.
page_type: task
parent: home
nav_order: 50
tags: [iam, service-accounts, cli, api]
last_reviewed: 2026-11-07
---

# Use service accounts

A service account is a non-interactive credential for automation such as CI pipelines, scripts and infrastructure-as-code tools. It belongs to one organization and acts as its own principal: the member `serviceAccount:<service-account-id>` in the `origin iam` commands and the REST API, `service_account:<service-account-id>` in the GraphQL API. Its access is checked exactly like a user's: it can do what its role bindings allow, and nothing else.

A service account authenticates with an OAuth 2.0 client ID and client secret, using the client credentials grant against the platform's identity provider. The resulting access token is sent to the API like a user's.

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

   > **Important:** The client secret is shown only once. Store it in your secret manager now. No API returns it again; if you lose it, delete the service account and create a new one.

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

## Using the API

In the REST API, these are `CreateServiceAccount`, `ListServiceAccounts`, `GetServiceAccount` and `DeleteServiceAccount`; see the [IAM reference](reference/index.md#rest-api). The GraphQL mutations are `createServiceAccount` and `revokeServiceAccount`; the query is `serviceAccounts`, all in the `iam` namespace. Neither API returns a client secret after the create.

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
- [Audit log](audit-log.md) – creation and revocation are recorded, and so is the removal of a revoked account's role assignments
