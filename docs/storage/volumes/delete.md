---
id: volumes-delete
title: Delete a volume
description: Delete a volume you no longer need, after detaching it and deleting its snapshots, and confirm that it reports DELETED and frees its quota.
page_type: task
parent: volumes
nav_order: 60
tags: [storage, volumes, cli, api]
last_reviewed: 2026-11-03
---

# Delete a volume

Delete a volume to remove its data and stop paying for it. Deleting frees the volume's share of your storage quota once the deletion completes. You can't undo a delete.

## Before you begin

- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- The volume's id. See [Name resources](../../platform/access/cli.md#name-resources).
- Permission `pvs.volume.delete` on the volume. See [Roles](../../iam/roles.md).
- The volume isn't attached to an instance. A volume that reports `IN_USE` must be detached first. See [Attach and detach volumes](../../compute/instance-storage/attach-detach.md).
- The volume has no snapshots left. Every snapshot that doesn't report `DELETED` blocks the delete, including one in `ERROR`, because a failed snapshot may still hold a copy of the data.

## Clear what blocks the delete

1. Check the volume's `state`. If it's `IN_USE`, find the instance and detach the volume. See [Find the instance a volume is attached to](find-instance.md).

   ```sh
   origin pvs get-volume --volume <volume-id>
   ```

2. Find the volume's snapshots. Every snapshot names the volume it was taken from as `sourceVolume`. List the snapshots in the volume's zone and look for the volume's `name`:

   ```sh
   origin pvs list-snapshots --zone eu-central1-az1
   ```

3. Delete each of those snapshots, unprotecting it first if needed. See [Delete a snapshot](../snapshots/delete.md).

## Delete the volume

1. Delete the volume. The CLI refuses to delete without `--yes`.

   ```sh
   origin pvs delete-volume --volume <volume-id> --yes
   ```

   The command waits until the volume reports `DELETED`. A deletion usually completes within seconds. If the storage layer doesn't confirm it, the platform requests it again every 30 minutes until it completes, so a volume doesn't stay in `DELETING`. You don't need to delete it again, and you can't while it's `DELETING`. To return at once instead, add `--no-wait`. See [Wait for long-running operations](../../platform/access/cli.md#wait-for-long-running-operations).

   With the API, use the `deleteVolume` mutation, and read the volume until it reports `DELETED`:

   ```graphql
   mutation {
     pvs {
       deleteVolume(input: { volumeUrn: "<volume-urn>" }) {
         accepted
         message
       }
     }
   }
   ```

2. Optional: verify the volume. A deleted volume drops out of `origin pvs list-volumes` at once. You can still look it up by name for 24 hours after it reports `DELETED`; after that the lookup finds nothing.

   ```sh
   origin pvs get-volume --volume <volume-id>
   ```

## What the platform refuses

These requests are refused immediately with an error, and nothing about the volume changes:

**The volume is attached**  
The error names the attachment that holds the volume. Detach the volume, or terminate the instance, and try again.

**The volume has snapshots**  
The error names each snapshot that blocks the delete. Delete those snapshots first, then try again.

**The volume is already being deleted**  
A volume in `DELETING` or `DELETED` can't be deleted again.

You can delete a volume in `ERROR`. That's how you clean up a volume whose creation or deletion failed.

## If this fails

If the deletion is accepted but fails, the command fails, and the volume stays in your list as `ERROR` with a `stateReason`, and its disk may still exist. It still counts against your quota. Delete it again. See [Troubleshoot storage](../troubleshooting/index.md).

## Related

- [Volume states](volume-states.md)
- [`delete-volume` command](../reference/cli.md#delete-volume)
