---
id: access-api
title: Use the REST APIs
nav_title: REST APIs
description: Call the Origin Cloud REST APIs with a bearer token, find each service's host, read resource names, wait for operations, retry safely and handle errors.
page_type: task
parent: access
nav_order: 20
tags: [api, getting-started]
related: [access-cli, reference-errors]
last_reviewed: 2026-11-25
---

# Use the REST APIs

Every Origin Cloud service has a REST API, and the console and the `origin` CLI call them too. Call them directly for automation, integrations, and operations the CLI doesn't cover. The APIs are previews (`v1beta1`): names and fields may still change.

## Before you begin

- A user account, with the `origin` CLI installed and logged in, or a service account with a credential: a federated credential its software's OIDC token matches, or a key. See [Use the CLI](cli.md) and [Service accounts](../../iam/service-accounts.md).
- An HTTP client, such as `curl`.

## Hosts

Each service answers at its own host. A path starts with the API version, `/v1beta1`.

| Host | Covers |
|---|---|
| `https://resourcemanager.origincloudapis.eu` | Organizations, projects and their quotas |
| `https://iam.origincloudapis.eu` | Users, role bindings, roles, permissions, service accounts and their credentials, the audit log |
| `https://billing.origincloudapis.eu` | Billing accounts, payment methods, spend limits, cost and usage, legal documents, the price list |
| `https://support.origincloudapis.eu` | Support cases |
| `https://compute.origincloudapis.eu` | Instances, instance types, images, image families, key pairs, launch templates |
| `https://pvs.origincloudapis.eu` | Volumes, snapshots, storage classes |
| `https://network.origincloudapis.eu` | VPCs, subnets, network interfaces, gateways, Floating IPs, route tables, security groups, network ACLs |
| `https://dns.origincloudapis.eu` | Hosted zones, record sets, VPC attachments |
| `https://kms.origincloudapis.eu` | Keys, grants and cryptographic operations |
| `https://observability.origincloudapis.eu` | Metrics |
| `https://location.origincloudapis.eu` | Regions and zones |
| `https://sts.origincloudapis.eu` | The security token service, which exchanges a credential for an access token |

A request and a response are JSON, with `lowerCamelCase` field names. Each guide lists its service's methods with their HTTP method and path, for example [IAM reference](../../iam/reference/index.md#rest-api) and [Billing REST API](../billing/rest-api.md).

## Authenticate

Every request carries an access token as a bearer token in the `Authorization` header:

```text
Authorization: Bearer <access-token>
```

A request without a token, or with an expired or invalid one, fails with the error code [`UNAUTHORIZED`](../reference/errors.md#unauthorized). Get a token in one of two ways:

- **As yourself:** log in with the CLI, then print the token with `origin id token --raw`. The CLI renews it when it expires. See [Use the CLI](cli.md#use-your-access-token-outside-the-cli).
- **As a service account:** exchange a proof for its token at the security token service, `https://sts.origincloudapis.eu`: a CI job's OIDC token through a federated credential, or an assertion signed with one of the account's keys. See [Choose how the software authenticates](../../iam/service-accounts.md#choose-how-the-software-authenticates).

Access tokens are short-lived. When a request fails with `UNAUTHORIZED`, get a new token and send the request again.

## Send a request

1. Send the request with your token. This one lists the organizations you hold a role in:

   ```sh
   curl -sS https://resourcemanager.origincloudapis.eu/v1beta1/organizations \
     -H "Authorization: Bearer <access-token>"
   ```

2. Verify the response. A successful response has a `2xx` status and the resource or list as JSON.

   Example output (illustrative):

   ```json
   {
     "organizations": [
       {
         "name": "organizations/0a1b2c3d4e5f",
         "displayName": "Example GmbH",
         "state": "ACTIVE",
         "createTime": "2026-11-03T09:12:44Z",
         "creator": "//iam.origincloudapis.eu/users/<user-id>"
       }
     ]
   }
   ```

A method that creates or changes a resource sends the resource as the JSON body (`POST` to create, `PATCH` to update, `DELETE` to delete). An update names the fields to change in the `updateMask` query parameter, such as `?updateMask=displayName`; other fields are left as they are. A custom method is a `POST` to the resource's path with a `:verb` suffix, such as `:startPaymentMethodSetup`, with a JSON body, `{}` when it takes none.

## Resource names

A resource is identified by its name, its service's collections and ids, such as `organizations/<org-id>` or `projects/<project-id>/zones/<zone>/volumes/<volume-id>`. A request's path takes this relative name. Everywhere else, a reference to a resource, in a request body or a response, is its full resource name: the service's host and the relative name.

| Resource | Full name |
|---|---|
| Organization | `//resourcemanager.origincloudapis.eu/organizations/<org-id>` |
| Project | `//resourcemanager.origincloudapis.eu/projects/<project-id>` |
| Billing account | `//billing.origincloudapis.eu/organizations/<org-id>/billingAccounts/<billing-account-id>` |
| Volume | `//pvs.origincloudapis.eu/projects/<project-id>/zones/<zone>/volumes/<volume-id>` |
| VPC | `//network.origincloudapis.eu/projects/<project-id>/regions/<region>/vpcs/<vpc-id>` |
| Hosted zone | `//dns.origincloudapis.eu/projects/<project-id>/hostedZones/<hosted-zone-id>` |
| User | `//iam.origincloudapis.eu/users/<user-id>` |
| Service account | `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>` |
| Role | `//iam.origincloudapis.eu/roles/<role>` |

The host is the service of the resource named, which can differ from the service you call: an instance's volume is a `//pvs.origincloudapis.eu/...` name. A resource that refers to another, such as a subnet's `vpc`, a Floating IP's `networkInterface` or a record set's `aliasFloatingIp`, shows the other's full name. A principal shown by any service, such as a creator, an opener or an author, is named by its full name on IAM. Copy a full name from a response rather than assembling it yourself. A name that names a resource of another type, or a name without its host where a full name is expected, is refused with `BAD_REQUEST`, naming the field.

A VPC, security group, network ACL, route table, Internet Gateway or resolver policy is in a region; a subnet, network interface, NAT gateway or Floating IP is in a zone; a hosted zone is in no region. A resource you use with another, such as the subnet of a network interface, the route table of a subnet, the VPC a private zone is attached to or the Floating IP an alias answers with, must be in the same project, and in the same zone or region, as the resource it is used with. A project or a billing account used with an organization, such as a support case's `project` or the `billingAccount` a project is charged to, must be in that organization.

A role binding's member is a user's, a service account's or a platform service agent's full name, never an email address, except that `CreateRoleBinding` takes `user:<email>` for a person who may not have an account yet, which makes a [pending role binding](../../iam/assign-roles.md#pending-role-bindings). IAM's `LookupUser` finds a user's full name by their verified address.

## Enums

Statuses and other closed sets of values, such as an organization's `state` (`PENDING_REVIEW`, `ACTIVE`, `REJECTED`) or a billing account's `paymentMethod.state`, are strings from a fixed set, not free text.

- Compare against the documented values, not against strings copied from a response.
- Handle a value your code doesn't recognize explicitly, for example by surfacing it, rather than mapping it to a default.

## Lists and pages

A list method takes `pageSize` and `pageToken` as query parameters and answers with the entries and a `nextPageToken`. Read the next page by sending `nextPageToken` as `pageToken`, with the same other parameters, until `nextPageToken` is empty. The token is opaque: send it unchanged. The server limits the page size; `0` or no `pageSize` means its default. A list leaves out deleted resources, except that `showDeleted` includes a service account's.

## Wait for an operation

A method whose effect isn't complete when it answers, such as launching an instance or growing a volume, returns an operation instead of the resource:

```json
{
  "name": "projects/<project-id>/zones/<zone>/operations/<operation-id>",
  "done": false
}
```

The change is done when `done` is `true`. The operation then holds either the resource as its `response` (empty for a delete) or the failure as its `error`, in the same form as [an error response](#errors). Every service answers for its operations at its own host:

- `GET /v1beta1/projects/<project-id>/zones/<zone>/operations/<operation-id>` returns the operation as it is now.
- `POST /v1beta1/projects/<project-id>/zones/<zone>/operations/<operation-id>:wait` waits until the operation is done or a `timeout` in the body, such as `{"timeout": "30s"}`, has passed, and returns it as it is then. Send it again if the operation isn't done yet.

An operation can be read for a day after it is done. Wait for it before you use the result or start what depends on it. Methods that return the resource itself have no operation.

## Errors

A failed request returns an HTTP error status and an `error` object in the form of a `google.rpc.Status`:

```json
{
  "error": {
    "code": 400,
    "status": "INVALID_ARGUMENT",
    "message": "invalid input on field sizeGib: must be at least 1",
    "details": [
      { "@type": "type.googleapis.com/google.rpc.ErrorInfo", "reason": "BAD_REQUEST", "domain": "origincloudapis.eu" },
      { "@type": "type.googleapis.com/google.rpc.RequestInfo", "requestId": "4bf92f3577b34da6a3ce929d0e0e4736" }
    ]
  }
}
```

Branch on the `reason` of the `ErrorInfo` detail, never on the message text: reasons are stable, messages can change. Quote the `requestId` when you contact support. For every code and what to do about it, see [Error codes](../reference/errors.md).

## Retry a request safely

A request can time out or lose its connection after the platform has already applied it. A create, and any other method that isn't naturally idempotent, takes an optional `requestId` in its body, a UUID. To retry it without applying it twice, send the same `requestId` again:

```sh
curl -sS -X POST https://resourcemanager.origincloudapis.eu/v1beta1/organizations \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"displayName": "Example GmbH", "requestId": "0f8c2a9e-6b1d-4f0a-9e3c-1d2b3c4d5e6f"}'
```

- Generate a new `requestId`, such as a random UUID, for each request, and send the same one only when you send that identical request again.
- A retry with the same `requestId` within 24 hours returns the result of the request that applied, and changes nothing.
- The same `requestId` with a different request is refused with `CONFLICT`.
- If the first request didn't apply, the retry applies.
- A `requestId` is your own: another caller's identical one never matches yours.
- A create whose response holds a secret the platform doesn't keep, such as a key pair's or a service account key's private key, returns it in the first response only. A retry after the key was generated is refused with `CONFLICT`, naming that key: delete it and create a new one.
- A retry that arrives while the first request is still being answered is refused with the retryable `SERVICE_UNAVAILABLE`; send it again.

A `GET` and a method that only reads are safe to send again without a `requestId`.

## Read what you just changed

A list or a lookup can show a resource as it was a few seconds before your last change to it. To read your own change, send back the `Origin-Consistency-Token` header that the change's response carried, or that of the operation once it is done:

```sh
curl -sS https://pvs.origincloudapis.eu/v1beta1/projects/<project-id>/zones/<zone>/volumes/<volume-id> \
  -H "Authorization: Bearer <access-token>" \
  -H "Origin-Consistency-Token: <token-from-the-change>"
```

- A read that sends the token answers once it can show that change. If that takes more than a few seconds, it is refused with the retryable `SERVICE_UNAVAILABLE`; send it again.
- Treat the token as opaque and send it unchanged. Keep the latest one you were given and send it with every request: it holds all your changes, and it doesn't slow a read down once they are visible.
- A header that isn't a token from a response is refused with `BAD_REQUEST`.

The CLI's storage, compute and network commands send the token for you, and send a `requestId` with every change; when the answer doesn't arrive, or the request failed with a retryable error, they send it again with the same `requestId`, up to three times in all.

## Related

- [Use the CLI](cli.md)
- [Error codes](../reference/errors.md)
- [Service accounts](../../iam/service-accounts.md)
