---
id: reference-limits
title: DNS limits
description: The DNS quotas on hosted zones and record sets, and the fixed limits on domain names, record values, TTLs, tags and the verification window.
page_type: reference
parent: reference
nav_order: 30
tags: [dns, quotas, reference]
last_reviewed: 2026-11-14
---

# DNS limits

## Quotas

| Quota | Default per organization | Counts | Checked when you |
|---|---|---|---|
| Hosted zones | 20 | Hosted zones of every project, public and private, in any state | Create a hosted zone |
| Record sets | 10,000 | Record sets of every zone of every project | Create a record set, including in a batch change |

A project budget, where one is set, caps a single project below the organization quota. Both are checked, and a request beyond either is refused with [`BAD_REQUEST`](../../platform/reference/errors.md#bad_request), naming the limit; nothing is created. Deleting a zone or a record set frees its share at once. To raise an organization quota, contact Origin Cloud support. For how quotas and budgets work, see [Limits](../../platform/reference/limits.md#how-quotas-work).

## Fixed limits

| Limit | Value |
|---|---|
| Public zone domain | At least two labels, at most 235 characters; not a special-use domain (`test`, `localhost`, `invalid`, `example`, `local`, `onion`, `alt`, `internal`, `home.arpa`) or below one |
| Private zone domain | At least one label; not `internal` or a name below it |
| Domains no zone can take | The platform's own domains and names below them |
| Zones holding one public domain | One active zone, platform-wide; any number pending |
| Attached zones of one domain per VPC | One |
| VPCs a private zone attaches to | VPCs of the zone's own project |
| Verification window | 7 days after the zone is created, at `challenge.expireTime` |
| Record sets per name and type | One |
| Values per record set | 1 to 100, each once |
| Size of a record set on the wire | 16 KiB |
| `TXT` value | Printable ASCII, up to 4,000 characters |
| TTL | 30 seconds to 7 days, in whole seconds; 300 seconds by default |
| Changes in one batch | 1 to 1,000 deletions, updates and creations together |
| Tags per hosted zone | 50 |
| Request id repeats (`--request-id`, `requestId`) | Recognized for one day |

## Related

- [Record value formats](record-values.md)
- [Limits](../../platform/reference/limits.md)
