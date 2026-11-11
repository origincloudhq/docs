---
id: reference-errors
title: Error codes
description: Every error code the Origin Cloud API returns, with what it means, what commonly causes it, and what to do. Branch on the code, never on the message.
page_type: reference
parent: reference
nav_order: 20
tags: [errors, reference, api]
last_reviewed: 2026-11-03
---

# Error codes

Every error the API returns carries a stable code. This page lists each code with its meaning, common causes and what to do. The codes are shared by every service, so the same code means the same thing whether it comes from compute, storage, network, IAM or administration.

## How errors are returned

In the GraphQL API, a failed operation returns an `errors` array. Each error has a human-readable `message` and, in `extensions`, three fields:

**`code`**  
The stable, machine-readable code. Branch on it. Messages can change wording; codes don't.

**`retryable`**  
Whether sending the identical request again can succeed. It's deliberately conservative: only conditions that clear by themselves are retryable.

**`correlationId`**  
An ID for your request. Quote it when you contact support: it ties your error to the platform's own record of what happened.

```json
{
  "errors": [{
    "message": "invalid input on field quota: organisation quota exceeded: vCPU usage is 38, requesting 4 more would exceed the limit of 40",
    "extensions": {
      "code": "BAD_REQUEST",
      "retryable": false,
      "correlationId": "4bf92f3577b34da6a3ce929d0e0e4736"
    }
  }]
}
```

The REST APIs, which the `origin compute`, `network`, `pvs`, `resourcemanager` and `location` commands call, answer a failed request with an `error` object. Its `status` is a canonical code, and the code this page lists travels as the `reason` of its `ErrorInfo` detail, with the correlation id as the `requestId` of its `RequestInfo` detail:

```json
{
  "error": {
    "code": 400,
    "status": "INVALID_ARGUMENT",
    "message": "invalid input on field size_gib: must be at least 1",
    "details": [
      { "@type": "type.googleapis.com/google.rpc.ErrorInfo", "reason": "BAD_REQUEST", "domain": "origincloudapis.eu" },
      { "@type": "type.googleapis.com/google.rpc.RequestInfo", "requestId": "4bf92f3577b34da6a3ce929d0e0e4736" }
    ]
  }
}
```

Branch on the `reason`. An error about a resource you can act on also names it in the `metadata` of its `ErrorInfo` detail, so you don't have to read it from the message. The `status` is the closest canonical code, for generic tools:

| Code | `status` |
|---|---|
| `UNAUTHORIZED` | `UNAUTHENTICATED` |
| `FORBIDDEN` | `PERMISSION_DENIED` |
| `BAD_REQUEST` | `INVALID_ARGUMENT` |
| `NOT_FOUND` | `NOT_FOUND` |
| `CONFLICT`, `PRODUCT_UNAVAILABLE`, `PAYMENT_METHOD_REQUIRED` | `FAILED_PRECONDITION` |
| `INSUFFICIENT_CAPACITY` | `RESOURCE_EXHAUSTED` |
| `INTERNAL_SERVER_ERROR`, `SERVER_ERROR` | `INTERNAL` |
| `SERVICE_UNAVAILABLE` | `UNAVAILABLE` |

The HTTP status is the same on every surface: a `CONFLICT` is `409` and a `PAYMENT_METHOD_REQUIRED` is `402`, although both have the `status` `FAILED_PRECONDITION`.

The `origin` CLI prints the API's message and code in its failure envelope, and exits with `1`. See [Use the CLI](../access/cli.md#read-the-output).

## Refusals and faults

Every code is one of two kinds, and the difference tells you who has to act:

- **A refusal you can act on.** The platform understood the request and declined it, for a reason the message states: invalid input, missing permission, an exhausted quota, a missing payment method, no capacity right now. Nothing was created or changed. Fix what the message names, or wait where the code says so, then send the request again.
- **A platform fault.** Something inside the platform failed. The message is deliberately generic and names no internal detail. Nothing about your request is wrong; retry if the code is retryable, and otherwise report the `correlationId`.

| Code | Kind | Retryable |
|---|---|---|
| [`UNAUTHORIZED`](#unauthorized) | Refusal | No |
| [`FORBIDDEN`](#forbidden) | Refusal | No |
| [`BAD_REQUEST`](#bad_request) | Refusal | No |
| [`NOT_FOUND`](#not_found) | Refusal | No |
| [`CONFLICT`](#conflict) | Refusal | No |
| [`PAYMENT_METHOD_REQUIRED`](#payment_method_required) | Refusal | No |
| [`PRODUCT_UNAVAILABLE`](#product_unavailable) | Refusal | No |
| [`INSUFFICIENT_CAPACITY`](#insufficient_capacity) | Refusal | Yes |
| [`SERVICE_UNAVAILABLE`](#service_unavailable) | Fault | Yes |
| [`INTERNAL_SERVER_ERROR`](#internal_server_error) | Fault | No |
| [`SERVER_ERROR`](#server_error) | Fault | No |

The codes below are ordered the same way: refusals first, then faults.

## UNAUTHORIZED

**Meaning:** The request carried no usable credentials. The message is `Authorization required`.

**Common causes:**

- No `Authorization` header, or a header that doesn't start with `Bearer`.
- An access token that has expired.
- A token that wasn't issued by Origin Cloud, or was altered.

**What to do:** Get a fresh access token and send the request again. With the CLI, run `origin id login`. With a service account, request a new token with the client credentials grant. See [Use the GraphQL API](../access/api.md#authenticate).

## FORBIDDEN

**Meaning:** Your credentials are valid, but you lack the permission the operation needs. The message names the permission and the resource, for example ``This operation requires permission `compute.instance.launch` on `<project-urn>` ``.

**Common causes:**

- You have no role in the organization or project, or a role without that permission, such as `roles/viewer` for a write.
- A billing operation without a billing role. The Owner role doesn't include access to billing accounts.
- A service account without a role. A new service account has none.
- Assigning, revoking or inviting with a role that carries permissions you don't hold yourself at that scope, or removing a member who holds one. The message names the role and some of the permissions you lack. See [Who can assign a role](../../iam/access-model.md#who-can-assign-a-role).

**What to do:** Ask an Owner of the organization to grant you a role that includes the named permission, then send the request again. See [Built-in roles](../../iam/roles.md) and, for billing, [Billing access](../billing/billing-access.md).

## BAD_REQUEST

**Meaning:** The request is malformed, failed validation, or was refused by a check the request itself can't pass as it stands. The message names the field, in the form `invalid input on field <field>: <cause>`. A query the GraphQL layer can't run at all is refused with this code too, with a message describing the problem in the query.

**Common causes:**

- A query that doesn't run as written: a syntax error, a field or argument that doesn't exist, a missing required argument, or an argument value the API can't read, such as a malformed URN in a `Urn` argument or a malformed ID in an `OrgId` argument. The message names the type or argument, for example `Failed to parse "Urn": ...`.
- A value that fails validation, such as a malformed URN, an invalid email address, or a size below the minimum.
- A request the resource can't accept in its current form, such as changing the type of an instance that isn't stopped, or deleting a VPC's default security group.
- An exhausted quota. The field is `quota`, and the message names the scope, the dimension, the current usage and the limit. See [Limits](limits.md).
- An organization that isn't `ACTIVE`. The field is `org_id`. See [Organization review status](../organizations/review-status.md).
- A project or organization delete that is blocked by what it still owns. The field is `project_id` or `org_id`.
- A billing detail that isn't accepted: `invoice_email`, `country`, `vat_id` or `display_name`.
- A payment method setup that wasn't completed, isn't in progress, or isn't needed. The field is `billing_account_id`. See [Add a payment method](../billing/payment-method.md#if-the-confirmation-fails).
- A VPC without an address range, when the platform has no default range left to pick. The field is `ipv4_cidr`.

**What to do:** Read the field and cause in the message, change the request accordingly, and send it again. For a quota, free up usage, set a higher project budget, or ask for a higher organization quota. Sending the identical request again doesn't help.

## NOT_FOUND

**Meaning:** The resource doesn't exist, or you can't see it. The platform doesn't distinguish the two, so a missing resource doesn't reveal whether it exists in someone else's project.

**Common causes:**

- A typo in an ID or URN, or a URN from another project or organization.
- A resource that was deleted.
- A resource in a project you have no role in.

**What to do:** Check the ID or URN against a fresh list of your resources. Don't send the identical request again.

## CONFLICT

**Meaning:** The request conflicts with the resource's current state. The message says what's in the way.

**Common causes:**

- An action the resource's current state doesn't allow, such as resizing a volume that isn't `AVAILABLE` or `INUSE`, or starting an instance that is still initializing.
- A resource that still has a live dependent, such as a volume that is still attached to an instance, or a subnet that still has an attached network interface. The message names what to detach, delete or terminate first.
- A bounded address space that has run out, such as a subnet with no IPv4 addresses left. The message names what frees or replaces it.
- Revoking the last organization-wide Owner role.
- An `Idempotency-Key` sent before with a different request. Use a new key for a new request; see [Retry a request safely](../access/api.md#retry-a-request-safely).
- A retried `generateKeyPair`, or a retried `CreateKeyPair` in the compute REST API that generates the key, whose key pair was generated by the first attempt. The private key was in that first response only: delete the key pair and generate a new one. The message names it; in the REST API, the `metadata` of the `ErrorInfo` detail names it too, under `keyPair`.
- A retried `CreateServiceAccount` in the IAM REST API whose service account was created by the first request with that `requestId`. The client secret was in that first response only: delete the service account and create a new one. The `metadata` of the `ErrorInfo` detail names it under `serviceAccount`.
- A retried `RotateServiceAccountSecret` in the IAM REST API whose secret was rotated by the first request with that `requestId`. The new secret was in that first response only: rotate again with a new `requestId`.

**What to do:** Resolve the conflict the message describes, for example by detaching the dependent or waiting for the resource to reach a state that allows the action, then send the request again. Retrying the identical request without changing anything doesn't help.

## PAYMENT_METHOD_REQUIRED

**Meaning:** The request would create something that costs money, and the project's billing account has no verified payment method. Nothing about the request is wrong. The message is `a verified payment method is required to create billable resources - add one to this project's billing account`.

**Common causes:**

- Launching an instance, creating, importing or growing a volume, creating a snapshot, allocating a Floating IP or creating a NAT gateway in a project whose billing account has `paymentMethodStatus` `NONE`.
- A project linked to a different billing account than the one you added a payment method to.

**What to do:** Add a payment method to the project's billing account, then send the identical request again. See [Add a payment method](../billing/payment-method.md). Waiting doesn't help.

## PRODUCT_UNAVAILABLE

**Meaning:** The product you selected exists and has a price, but isn't on sale right now. Nothing about the request is malformed and nothing is broken. The message names the product you asked for and the ones you can choose instead.

**Common causes:**

- An instance type that is no longer offered, when you launch an instance, start one that runs as that type, or change an instance's type.
- A storage class that is published in the price list but not offered.

**What to do:** Pick one of the alternatives the message names. For instance types, choose one whose `available` is `true` in `origin compute list-instance-types`; for storage classes, use `origin pvs list-storage-classes`. Retrying doesn't help: a product becomes available by a decision, not over time.

## INSUFFICIENT_CAPACITY

**Meaning:** The platform has no room for the request right now: no machine can place an instance of the requested type. Nothing about the request is wrong; the platform is full, not broken. The message names the instance type and what was short, such as vCPU or memory.

**Common causes:**

- Launching or starting an instance of a type whose machines are full.
- Launching a type that no machine serves.

**What to do:** Send the identical request again later, or choose a smaller instance type. Nothing was created by the refused request.

## SERVICE_UNAVAILABLE

**Meaning:** A part of the platform the request depends on was unavailable. The message is `Service temporarily unavailable. Please retry.`

**Common causes:**

- A short interruption inside the platform.
- A metrics query that took too long to answer.
- A request to create or grow a resource while the platform can't yet confirm the organisation's standing, billing or quotas. Nothing was created.
- A change to a volume, snapshot, instance, image, key pair or network resource whose result didn't arrive in time. It may still have taken effect. Sent with an `Idempotency-Key`, the identical request with the same key is safe to send again: it returns the first result instead of applying twice. Without one, list the resources before you send a create, a launch or an allocation again.

**What to do:** Send the request again after a short wait, with increasing waits between attempts, and with the same `Idempotency-Key` if it had one. If it keeps failing, report the `correlationId`.

## INTERNAL_SERVER_ERROR

**Meaning:** The request failed inside the platform. The message is `Internal server error.` and deliberately carries no detail.

**Common causes:**

- A fault in the platform. Nothing about your request is known to be wrong.

**What to do:** Report the `correlationId` to Origin Cloud support. The identical request may succeed later, but this code doesn't say so: check whether the operation took effect before you send it again.

## SERVER_ERROR

**Meaning:** A part of the platform that Origin Cloud operates refused the platform's own credentials. It's a platform misconfiguration that an operator has to correct. The message names the affected component, for example `The platform's identity service is misconfigured.`

**Common causes:**

- A platform misconfiguration affecting operations that reach the identity service, such as creating a service account.

**What to do:** Report the `correlationId` to Origin Cloud support. Retrying doesn't help until the platform is fixed.

## Codes not listed here

New codes can be added; existing codes never change meaning. If your client receives a code it doesn't know, use the `retryable` flag to decide whether to retry, and report the `correlationId`.

## Failures after the request was accepted

Some operations return as soon as the request is accepted and finish later, such as launching an instance. If the later work fails, the reason is recorded on the resource, for example in an instance's `statusReason`. A refusal reads like the message the API would have returned. A platform fault reads as a generic sentence ending in its code, such as `(SERVICE_UNAVAILABLE)` or `(INTERNAL_SERVER_ERROR)`. See [Status reasons](../../compute/reference/status-reasons.md).

## Related

- [Use the GraphQL API](../access/api.md)
- [Limits](limits.md)
