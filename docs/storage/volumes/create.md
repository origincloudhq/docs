---
id: volumes-create
title: Create a volume
description: Create an empty volume or a volume from a protected snapshot with the origin CLI or the GraphQL API, and check that it becomes AVAILABLE.
page_type: task
parent: volumes
nav_order: 30
tags: [storage, volumes, cli, api]
last_reviewed: 2026-11-03
---

# Create a volume

Create a standalone volume when you need a disk that isn't tied to one instance's lifetime. You can create an empty volume of a given size, or a volume that starts with the data of a snapshot.

## Before you begin

- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region). The volume is created in the default zone; add `--zone` for another one.
- Permission `pvs.volume.create` on the project. See [Roles](../../iam/roles.md).
- An active organization. See [Review your organization's status](../../platform/organizations/review-status.md).
- A billing account that can pay. For card-managed billing, that means a verified payment method. See [Add a payment method](../../platform/billing/payment-method.md).
- Enough volume storage quota for the full size of the new volume. See [Limits](../../platform/reference/limits.md#storage).
- To create from a snapshot: a snapshot in the same project and zone that reports `state: COMPLETED` and `protectionState: PROTECTED`. See [Create and protect a snapshot](../snapshots/create-and-protect.md).

## Create an empty volume

1. Optional: list the storage classes and pick one whose `available` is `true`. Omit the class to get the default, `gp1`. See [Storage classes](storage-classes.md).

   ```sh
   origin pvs list-storage-classes
   ```

2. Create the volume. `--size-gib` is required.

   ```sh
   origin pvs create-volume --size-gib 100 --storage-class gp1 \
     --tag origin:name=db-data
   ```

   `--tag` is optional and repeatable; `origin:name` names the volume. See [Tags](../../platform/tags.md).

   The command waits until the volume is `AVAILABLE` and prints it. Note its `name`; the last segment is the volume's id. To return at once instead, add `--no-wait` and wait for the operation later. See [Wait for long-running operations](../../platform/access/cli.md#wait-for-long-running-operations).

   With the API, use the `createVolume` mutation:

   ```graphql
   mutation {
     pvs {
       createVolume(input: {
         projectUrn: "<project-urn>"
         sizeInGib: 100
         storageClass: "gp1"
       }) {
         urn
         status
       }
     }
   }
   ```

   The mutation returns at once with the volume in `CREATING`. Read the volume until it reports `AVAILABLE`.

3. Optional: verify the volume.

   ```sh
   origin pvs get-volume --volume <volume-id>
   ```

## Create a volume from a snapshot

A volume created from a snapshot starts with the data the snapshot captured. The snapshot must belong to the project and zone you create the volume in. A snapshot in another project is refused as not found, even within the same organization.

The platform checks three more rules before it creates anything:

- The snapshot reports `state: COMPLETED`.
- The snapshot reports `protectionState: PROTECTED`.
- The size you ask for is at least the size of the volume the snapshot was taken from, shown as the snapshot's `sourceSizeGib`. A larger size gives you the extra space.

If a rule doesn't hold, the request is refused with an error that names the rule. Nothing is created.

1. Check the snapshot's `state`, `protectionState`, and `sourceSizeGib`.

   ```sh
   origin pvs get-snapshot --snapshot <snapshot-id>
   ```

2. Create the volume, passing a size of at least `sourceSizeGib`.

   ```sh
   origin pvs create-volume --source-snapshot <snapshot-id> --size-gib 100
   ```

   The command waits until the volume is `AVAILABLE` and prints it.

   With the API, add `snapshotUrn` to the `createVolume` input.

## If this fails

If the volume ends in `ERROR` instead of `AVAILABLE`, its creation failed: the command fails, and the volume's `stateReason` says why. Delete it and create a new one. For refused requests, such as `PRODUCT_UNAVAILABLE` or a quota error, see [Troubleshoot storage](../troubleshooting/index.md).

## Next steps

- [Attach and detach volumes](../../compute/instance-storage/attach-detach.md) – connect the volume to an instance, running or stopped.
- [Create and protect a snapshot](../snapshots/create-and-protect.md)

## Related

- [Volume states](volume-states.md)
- [`create-volume` command](../reference/cli.md#create-volume)
