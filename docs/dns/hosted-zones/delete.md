---
id: hosted-zones-delete
title: Delete a hosted zone
description: Delete a public or private hosted zone once it's empty, after removing its record sets and, for a private zone, its VPC attachments.
page_type: task
parent: hosted-zones
nav_order: 30
tags: [dns, cli]
last_reviewed: 2026-11-08
---

# Delete a hosted zone

A hosted zone can only be deleted when it's empty. Deleting a zone that still holds record sets or, for a private zone, VPC attachments is refused with [`CONFLICT`](../../platform/reference/errors.md#conflict), naming what's left:

```text
error: CONFLICT: zone hz-Oqu2Vgc2nt6 still holds 4 record set(s); delete them first (request <request-id>)
```

## Before you begin

- The `origin` CLI, logged in. See [Use the CLI](../../platform/access/cli.md).
- The zone's id. `origin dns list-hosted-zones` lists your project's zones.
- For a public zone that answers for a live domain: delegate the domain elsewhere first, or it stops resolving when the zone goes.

## Delete the zone

1. For a private zone, list its VPC attachments, then delete each one. An attachment's id is its VPC's id:

   ```sh
   origin dns list-vpc-attachments --hosted-zone <zone-id>
   origin dns delete-vpc-attachment --hosted-zone <zone-id> \
     --vpc-attachment <vpc-id> --yes
   ```

2. If the zone holds record sets, delete them. One batch change deletes them all together; this one names every record set the zone holds:

   ```sh
   deletions=()
   for name in $(origin dns list-record-sets --hosted-zone <zone-id> -o name); do
     deletions+=(--deletion "$name")
   done
   origin dns batch-change-record-sets --hosted-zone <zone-id> "${deletions[@]}"
   ```

   A batch makes at most 1,000 changes; for a larger zone, run it again until the list is empty. To delete record sets one at a time instead, see [Delete a record set](../record-sets/manage.md#delete-a-record-set).

3. Delete the zone:

   ```sh
   origin dns delete-hosted-zone --hosted-zone <zone-id> --yes
   ```

   Without `--yes`, the command says what it would delete and sends nothing.

Deleting a public zone frees its domain for another zone to verify. A pending public zone you don't need doesn't have to be deleted by hand: it's deleted when its verification window ends.

## Related

- [Hosted zones](index.md)
- [Private zones and VPC attachments](../private-zones/index.md)
- [`delete-hosted-zone` reference](../reference/cli.md#delete-hosted-zone)
