---
id: snapshots-delete
title: Delete a snapshot
description: Unprotect a snapshot if needed, delete it, and confirm that it reports DELETED so it no longer blocks deleting its volume.
page_type: task
parent: snapshots
nav_order: 30
tags: [storage, snapshots, cli, api]
last_reviewed: 2026-11-03
---

# Delete a snapshot

Delete a snapshot when you no longer need it, or to clear the way for deleting the volume it was taken from. A protected snapshot must be unprotected first.

## Before you begin

- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- The snapshot's id. See [Name resources](../../platform/access/cli.md#name-resources).
- Permission `pvs.snapshot.delete` on the snapshot, and `pvs.snapshot.unprotect` if it's protected. See [Roles](../../iam/roles.md).
- A snapshot that reports `COMPLETED` or `ERROR`. A `PENDING` snapshot can't be deleted yet; wait until the copy finishes.
- No image built from the snapshot. While an image is built from it, unprotecting and deleting the snapshot are refused with a `CONFLICT` naming the image. Delete the image first. See [Create an image](../../compute/images/create.md#update-or-delete-an-image).
- No volume created from the snapshot. While one exists, unprotecting the snapshot is refused with a `CONFLICT` naming the volume. Delete the volume and wait until it reports `DELETED`. See [Delete a volume](../volumes/delete.md).

> **Note:** An unprotected snapshot can no longer be the source of a new volume or image.

## Unprotect the snapshot

Skip this section if the snapshot reports `protectionState: UNPROTECTED`.

1. Unprotect the snapshot. This works on a `COMPLETED` snapshot and on an `ERROR` snapshot, and also settles a snapshot whose `protectionState` is `PROTECTION_FAILED`.

   ```sh
   origin pvs unprotect-snapshot --snapshot <snapshot-id>
   ```

   The command waits until the snapshot reports `protectionState: UNPROTECTED`.

   With the API, use the `unprotectSnapshot` mutation, and read the snapshot until it reports `protectionStatus: UNPROTECTED`:

   ```graphql
   mutation {
     pvs {
       unprotectSnapshot(input: { snapshotUrn: "<snapshot-urn>" }) {
         accepted
         message
       }
     }
   }
   ```

## Delete the snapshot

1. Delete the snapshot. The CLI refuses to delete without `--yes`.

   ```sh
   origin pvs delete-snapshot --snapshot <snapshot-id> --yes
   ```

   The command waits until the snapshot reports `DELETED`. To return at once instead, add `--no-wait`. See [Wait for long-running operations](../../platform/access/cli.md#wait-for-long-running-operations).

   With the API, use the `deleteSnapshot` mutation, and read the snapshot until it reports `status: DELETED`:

   ```graphql
   mutation {
     pvs {
       deleteSnapshot(input: { snapshotUrn: "<snapshot-urn>" }) {
         accepted
         message
       }
     }
   }
   ```

   A delete request for a snapshot that isn't `UNPROTECTED` is refused with the message `snapshot must be unprotected before it can be deleted`. A delete request for a snapshot an image is built from is refused with a `CONFLICT` naming the image.

2. Optional: verify the snapshot. A deleted snapshot drops out of `origin pvs list-snapshots` at once. You can still look it up by name for 24 hours after it reports `DELETED`; after that the lookup finds nothing.

   ```sh
   origin pvs get-snapshot --snapshot <snapshot-id>
   ```

## If this fails

If the deletion is accepted but fails, the command fails, and the snapshot stays in your list as `ERROR` with a `stateReason`. Its copy may still exist, and it still blocks deleting its volume. Delete it again. If it's still protected, unprotect it first.

## Next steps

- [Delete a volume](../volumes/delete.md)

## Related

- [Snapshot states](snapshot-states.md)
- [`unprotect-snapshot` command](../reference/cli.md#unprotect-snapshot)
- [`delete-snapshot` command](../reference/cli.md#delete-snapshot)
