---
id: access-api
title: Use the GraphQL API
nav_title: GraphQL API
description: Call the Origin Cloud GraphQL API with a bearer token, find operations by namespace, read resource URNs, and handle typed enums and errors.
page_type: task
parent: access
nav_order: 20
tags: [api, getting-started]
related: [access-cli, reference-errors]
last_reviewed: 2026-11-03
---

# Use the GraphQL API

The GraphQL API is the complete interface to Origin Cloud: the console and the `origin` CLI use it too. Call it directly for automation, integrations, and operations the CLI doesn't cover.

## Before you begin

- A user account, with the `origin` CLI installed and logged in, or a service account with its client ID and secret. See [Use the CLI](cli.md) and [Service accounts](../../iam/service-accounts.md).
- An HTTP client, such as `curl`, or a GraphQL client library.

## Endpoint

Every request goes to one endpoint:

```text
https://graph.origincloudapis.eu/graphql
```

Send queries and mutations as an HTTP `POST` with a JSON body that holds `query` and, optionally, `variables`. The API supports GraphQL introspection, so code generators and IDE plugins can read the schema from the endpoint with a valid token.

## Authenticate

Every request carries an access token as a bearer token in the `Authorization` header:

```text
Authorization: Bearer <access-token>
```

A request without a token, or with an expired or invalid one, fails with the error code [`UNAUTHORIZED`](../reference/errors.md#unauthorized). Get a token in one of two ways:

- **As yourself:** log in with the CLI, then print the token with `origin id token --raw`. The CLI renews it when it expires. See [Use the CLI](cli.md#use-your-access-token-outside-the-cli).
- **As a service account:** request a token with the OAuth 2.0 client credentials grant, using the service account's client ID and secret. See [Service accounts](../../iam/service-accounts.md).

Access tokens are short-lived. When a request fails with `UNAUTHORIZED`, get a new token and send the request again.

## Send a request

1. Write the query. This one lists the organizations you can access:

   ```graphql
   query {
     admin {
       organisations {
         orgId
         name
         status
       }
     }
   }
   ```

2. Send it with your token:

   ```sh
   curl -sS https://graph.origincloudapis.eu/graphql \
     -H "Authorization: Bearer <access-token>" \
     -H "Content-Type: application/json" \
     -d '{"query":"{ admin { organisations { orgId name status } } }"}'
   ```

3. Verify the response. A successful response has a `data` object and no `errors` array.

   Example output (illustrative):

   ```json
   {
     "data": {
       "admin": {
         "organisations": [
           { "orgId": "0a1b2c3d4e5f", "name": "Example GmbH", "status": "ACTIVE" }
         ]
       }
     }
   }
   ```

Pass values through `variables` rather than pasting them into the query text. That avoids quoting problems:

```json
{
  "query": "query($org: OrgId!) { admin { organisation(orgId: $org) { name status } } }",
  "variables": { "org": "0a1b2c3d4e5f" }
}
```

## Namespaces

Operations are grouped by service. Every query and mutation sits under one of these top-level fields:

| Namespace | Queries | Mutations | Covers |
|---|---|---|---|
| `admin` | yes | yes | Organizations, projects, billing accounts, quotas, usage and cost, support cases |
| `iam` | yes | yes | Members, invites, roles, permissions, service accounts, audit log |
| `compute` | yes | yes | Instances, instance types, images, image families, key pairs |
| `pvs` | yes | yes | Volumes, snapshots, storage classes |
| `network` | yes | yes | VPCs, subnets, network interfaces, gateways, Floating IPs, route tables, security groups, network ACLs, DNS |
| `observability` | yes | no | Metrics |

For example, launching an instance is `mutation { compute { launchInstance(...) { ... } } }`.

## Resource URNs

Every resource has a URN, a globally unique identifier returned in its `urn` field. Compute, storage and network operations take URNs as input, such as `projectUrn`, `instanceUrn` or `subnetUrn`. Organization and IAM operations take plain IDs, such as `orgId` and `projectId`.

A URN has eight colon-separated parts:

```text
urn:origin:cloud:<service>:<region>:<org-id>:<project-id>:<resource-id>
```

**`urn:origin:cloud`**  
A fixed prefix.

**`<service>`**  
The service that owns the resource: `admin`, `iam`, `compute`, `pvs`, `network` or `observability`.

**`<region>`**  
The region the resource lives in, such as `eu-central1`. Empty for resources that aren't bound to a region.

**`<org-id>` and `<project-id>`**  
The organization and project that own the resource. Empty where they don't apply.

**`<resource-id>`**  
The resource's own ID within the service.

Examples:

| Resource | URN |
|---|---|
| Organization | `urn:origin:cloud:admin::::0a1b2c3d4e5f` |
| Project | `urn:origin:cloud:admin::0a1b2c3d4e5f::demo-48291037561` |
| Instance | `urn:origin:cloud:compute:eu-central1:0a1b2c3d4e5f:demo-48291037561:i-WsGD79fcM9y` |
| Built-in role | `urn:origin:cloud:iam::::builtin/role/roles/viewer` |

Copy a URN from the `urn` field of a response rather than assembling it yourself. A project's URN is `urn:origin:cloud:admin::<org-id>::<project-id>`; the API returns it as the project's `urn` field, and `origin resourcemanager get-project` prints it too.

## Typed enums

Statuses and other closed sets of values are GraphQL enums, not free text. Examples are an organization's `status` (`PENDING_REVIEW`, `ACTIVE`, `REJECTED`), a billing account's `paymentMethodStatus`, and an instance's `status`.

- Generate your client types from the schema. A typed client lists every value the schema defines, and fails to compile when a value is added that your code doesn't handle.
- Compare against the enum, not against strings copied from a response.
- Handle a value your code doesn't recognize explicitly, for example by surfacing it, rather than mapping it to a default.

## Lists and pages

Most list queries return a plain list. A few queries that can return many entries, such as the audit log and support cases, return a page instead: the entries plus `total`, `hasMore`, `offset` and `limit`. Read the next page by adding `limit` to `offset`, while `hasMore` is `true`. For page size limits, see [Limits](../reference/limits.md).

## Errors

A failed operation returns an `errors` array. Each error has a `message` and, in `extensions`, a stable `code`, a `retryable` flag and a `correlationId`:

```json
{
  "errors": [{
    "message": "invalid input on field sizeInGib: must be at least 1",
    "extensions": {
      "code": "BAD_REQUEST",
      "retryable": false,
      "correlationId": "4bf92f3577b34da6a3ce929d0e0e4736"
    }
  }]
}
```

Branch on `code`, never on the message text: codes are stable, messages can change. For every code and what to do about it, see [Error codes](../reference/errors.md).

## Retry a request safely

A request can time out or lose its connection after the platform has already applied it. To retry a change to a volume, snapshot, instance, image, key pair or network resource without applying it twice, send an `Idempotency-Key` header with the request:

```sh
curl https://graph.origincloudapis.eu/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Idempotency-Key: 0f8c2a9e-6b1d-4f0a-9e3c-1d2b3c4d5e6f" \
  -H "Content-Type: application/json" \
  -d '{"query": "mutation { ... }"}'
```

- Generate a new key, such as a random UUID, for each request, and send the same key only when you send that identical request again. The key is 1 to 255 visible ASCII characters.
- A retry with the same key within 24 hours returns the result of the request that applied, and changes nothing.
- The same key with a different request is refused with `CONFLICT`.
- If the first request didn't apply, the retry applies.
- Keys are your own: another caller's identical key never matches yours.
- In a request with several mutations, each one is matched by its field name, or its alias if it has one. Keep the names and aliases unchanged when you retry.
- `generateKeyPair` returns the private key only in its first response. A retry after the key pair was generated is refused with `CONFLICT`, naming that key pair: delete it and generate a new one.

## Read what you just changed

A list or a lookup can show a volume or a snapshot as it was a few seconds before your last change to it. To read your own change, send back the `Origin-Consistency-Token` header that the change's response carried:

```sh
curl https://graph.origincloudapis.eu/graphql \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin-Consistency-Token: $TOKEN_FROM_THE_CHANGE" \
  -H "Content-Type: application/json" \
  -d '{"query": "query { pvs { volume(volumeUrn: \"...\") { status } } }"}'
```

- A response to a change carries the token. It covers that change, every other change in the same request, and every change the token you sent with the request covered.
- A read that sends the token answers once it can show those changes. If that takes more than a few seconds, it is refused with the retryable `SERVICE_UNAVAILABLE`; send it again.
- Treat the token as opaque and send it unchanged. Keep the latest one you were given and send it with every request: it holds all your changes, and it doesn't slow a read down once they are visible.
- A header that isn't a token from a response is refused with `BAD_REQUEST`.

The CLI's storage, compute and network commands send a key with every request. When the answer doesn't arrive, or the request failed with a retryable error, they send it again with the same key, up to three times in all.

## Related

- [Use the CLI](cli.md)
- [Error codes](../reference/errors.md)
- [Service accounts](../../iam/service-accounts.md)
