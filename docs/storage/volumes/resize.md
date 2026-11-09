---
id: volumes-resize
title: Resize a volume
description: Grow a volume, including one attached to a running instance, then extend the partition and filesystem inside the guest to use the new space.
page_type: task
parent: volumes
nav_order: 50
tags: [storage, volumes, cli, api]
last_reviewed: 2026-11-03
---

# Resize a volume

Grow a volume when it runs out of space. You can grow a volume while it's attached to a running instance, without a restart. Volumes only grow: there's no way to make a volume smaller.

## Before you begin

- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- The volume's id. See [Name resources](../../platform/access/cli.md#name-resources).
- Permission `pvs.volume.update` on the volume. See [Roles](../../iam/roles.md).
- A volume that reports `AVAILABLE` or `IN_USE`. A volume in `CREATING` can't be resized yet; wait for `AVAILABLE`. A volume in `DELETING`, `DELETED`, or `ERROR` can't be resized.
- No other resize in progress: `resizeState` is `RESIZE_COMPLETED` or `RESIZE_FAILED`.
- An active organization and a billing account that can pay. For card-managed billing, that means a verified payment method. See [Add a payment method](../../platform/billing/payment-method.md).
- Quota headroom for the growth. Only the growth counts: taking a 100 GiB volume to 120 GiB needs 20 GiB of headroom. See [Limits](../../platform/reference/limits.md#storage).

## Resize the volume

> **Important:** A volume can't be made smaller again, and you're billed for the larger size. The CLI refuses to grow a volume without `--yes`.

1. Check the volume's current `sizeGib`, `state`, and `resizeState`.

   ```sh
   origin pvs get-volume --volume <volume-id>
   ```

2. Request a size larger than the current `sizeGib`.

   ```sh
   origin pvs update-volume --volume <volume-id> --size-gib 120 --yes
   ```

   The command waits until the volume reports the new size, then prints it: `sizeGib` shows the new size and `resizeState` is `RESIZE_COMPLETED`. While the resize runs, the volume reports `resizeState: RESIZING`, and `pendingSizeGib` shows the target size. To return at once instead, add `--no-wait`. See [Wait for long-running operations](../../platform/access/cli.md#wait-for-long-running-operations).

   A size equal to the current `sizeGib` changes nothing.

   With the API, use the `resizeVolume` mutation:

   ```graphql
   mutation {
     pvs {
       resizeVolume(input: {
         volumeUrn: "<volume-urn>"
         sizeInGib: 120
       }) {
         accepted
         message
       }
     }
   }
   ```

   The mutation only reports that the request was accepted. Read the volume until `modificationStatus` reports `COMPLETED` and `sizeInGib` shows the new size.

## Use the new space inside the guest

The platform grows the block device. It doesn't change the partition table or the filesystem on it.

- **On a running instance**, the guest sees the larger disk without a restart. Grow the partition and then the filesystem, for example with `growpart` and the filesystem's own grow command. Many images do this at boot, so a restart also makes the space appear.
- **On a stopped instance or a detached volume**, nothing is needed now. The instance sees the new size the next time it starts.

## What the platform refuses

These requests are refused immediately with an error, and nothing about the volume changes, not even `resizeState`:

- A size smaller than the current `sizeGib`. Shrinking would truncate the filesystem on the disk. To use less storage, create a smaller volume, copy your data across at file level, and delete the old volume. A volume created from a snapshot can't be smaller than the snapshot's source volume, so a snapshot doesn't help here.
- A volume in a state other than `AVAILABLE` or `IN_USE`.
- A resize while another one is in progress.
- A resize that would exceed your volume storage quota, from an inactive organization, or from a project whose billing account can't pay.

If your usage is already over a limit, for example because the limit was lowered, no resize brings you back under it. Deleting volumes you no longer need frees quota, and a delete is never held to a quota.

## If this fails

If the platform accepts the resize but can't apply it, the command fails, and the volume reports `resizeState: RESIZE_FAILED` with a `resizeReason`. The volume's data is intact and `sizeGib` still reports its real size. Request the resize again.

## Related

- [Volume states](volume-states.md#resize-state)
- [`update-volume` command](../reference/cli.md#update-volume)
- [Troubleshoot storage](../troubleshooting/index.md)
