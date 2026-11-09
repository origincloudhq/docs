---
id: reference-errors
title: DNS errors
description: The errors the DNS API and the origin dns commands answer with - bad requests, conflicts, missing resources, missing billing and retryable unavailability.
page_type: reference
parent: reference
nav_order: 40
tags: [dns, errors, reference]
last_reviewed: 2026-11-08
---

# DNS errors

The DNS API answers with the platform's error codes, and an `origin dns` command that fails prints the code with the API's message and exits with `1`, such as `error: CONFLICT: zone hz-Oqu2Vgc2nt6 still holds 4 record set(s); delete them first`. With `-o json`, it prints the failure envelope, whose `reason` is the code. This page lists what causes each code in DNS. For how errors are returned and what every code means, see [Error codes](../../platform/reference/errors.md).

| Code | Retry? | Caused by |
|---|---|---|
| [`BAD_REQUEST`](#bad_request) | No | A value the API doesn't take, or a used-up quota |
| [`CONFLICT`](#conflict) | No | Something already there, or still there |
| [`NOT_FOUND`](#not_found) | No | A zone, record set or attachment that doesn't exist |
| [`PAYMENT_METHOD_REQUIRED`](#payment_method_required) | No | A project without valid billing |
| [`SERVICE_UNAVAILABLE`](#service_unavailable) | Yes | A dependency that didn't answer in time |

## BAD_REQUEST

- **Creating a hosted zone:** a domain the platform keeps for itself, a private zone named `internal` or below it, a public domain with one label or longer than 235 characters, or a used-up hosted zone quota of the project or organization.
- **Verifying a hosted zone:** the zone is private; it has no challenge.
- **Creating or changing a record set:** a name outside the zone, a `*` that isn't the whole leftmost label, a value its type doesn't take, a TTL outside 30 seconds to 7 days, an `AAAA` alias, an alias to a Floating IP outside the zone's project, or a used-up record set quota.
- **Attaching a zone:** the zone is public, or the VPC isn't in the zone's project. The message is the same whichever project the VPC is in.

## CONFLICT

- **Creating a record set:** the zone already holds a record set of that name and type, or a `CNAME` would share its name with another record set.
- **Attaching a zone:** the VPC already carries an attached zone of the same domain.
- **Deleting a hosted zone:** it still holds record sets or, for a private zone, VPC attachments. Delete them first; see [Delete a hosted zone](../hosted-zones/delete.md).

In a batch change, a change is refused as its own call would refuse it, but the zone is checked as the whole batch leaves it.

## NOT_FOUND

- The zone, record set or attachment doesn't exist, or isn't in the project you named.
- **Verifying a hosted zone:** the pending zone's verification window ended, and it was deleted.

A delete repeated with the same request id (`--request-id`, `requestId`) within a day succeeds as the first did, instead of answering `NOT_FOUND`.

## PAYMENT_METHOD_REQUIRED

**Creating a hosted zone** while the project has no valid billing. See [Add a payment method](../../platform/billing/payment-method.md).

## SERVICE_UNAVAILABLE

Send the request again after a short wait, with increasing waits between attempts.

- **Verifying a hosted zone:** the domain's DNS didn't answer in time.
- **Creating an alias record set:** the Floating IP was allocated moments ago.
- **Attaching a zone:** the VPC was created moments ago.

## Related

- [Error codes](../../platform/reference/errors.md)
- [Troubleshoot DNS](../troubleshooting/index.md)
