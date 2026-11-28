---
id: snapshots-create-and-protect
title: Create and protect a snapshot
description: Take a crash-consistent snapshot of an available or attached volume, wait for it to complete, and protect it so it can be used as a clone source.
page_type: task
parent: snapshots
nav_order: 20
tags: [storage, snapshots, cli, api]
last_reviewed: 2026-11-25
---

# Create and protect a snapshot

Take a snapshot to capture a volume's data at one point in time. Protect it when you want to create volumes or images from it. You don't have to detach a volume to snapshot it.

## Before you begin

- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region). The snapshot is taken in the volume's zone.
- The volume's id. See [Name resources](../../platform/access/cli.md#name-resources).
- Permission `pvs.snapshot.create` on the volume, and `pvs.snapshot.protect` on the snapshot. See [Roles](../../iam/roles.md).
- A volume that reports `AVAILABLE` or `IN_USE`. A volume in `CREATING` is refused, not queued; wait for `AVAILABLE`. A volume in `DELETING`, `DELETED`, or `ERROR` has nothing left to copy.
- An active organization and a billing account that can pay. See [Add a payment method](../../platform/billing/payment-method.md).
- Room in your snapshot quota. See [Limits](../../platform/reference/limits.md#storage).

## Create the snapshot

1. If the volume is attached to a running instance, quiesce the filesystem inside the guest when you need more than crash consistency. The snapshot is taken while the instance runs and captures the disk as a sudden power-off would.

2. Create the snapshot.

   ```sh
   origin pvs create-snapshot \
     --source-volume //pvs.origincloudapis.eu/projects/<project>/zones/<zone>/volumes/<volume-id> \
     --tag origin:name=before-upgrade
   ```

   `--source-volume` takes the volume's full name: `//pvs.origincloudapis.eu/` followed by its `name`. `--tag` is optional and repeatable; `origin:name` names the snapshot. See [Tags](../../platform/tags.md).

   The command waits until the copy is done and prints the snapshot with `state: COMPLETED`. Note its `name`; the last segment is the snapshot's id. To return at once instead, add `--no-wait`. See [Wait for long-running operations](../../platform/access/cli.md#wait-for-long-running-operations).

   If the copy fails, the command fails and the snapshot reports `ERROR`. Delete it and take a new one.

   With the REST API, send a `POST` to the zone's `snapshots` collection:

   ```sh
   curl -sS -X POST \
     https://pvs.origincloudapis.eu/v1beta1/projects/<project-id>/zones/<zone>/snapshots \
     -H "$(origin id token --as-header --raw)" \
     -H "Content-Type: application/json" \
     -d '{"sourceVolume": "//pvs.origincloudapis.eu/projects/<project-id>/zones/<zone>/volumes/<volume-id>"}'
   ```

   The request returns an operation at once, with the snapshot in `PENDING`. Read the snapshot until it reports `state: COMPLETED`. See [Use the REST APIs](../../platform/access/api.md).

## Protect the snapshot

Protect the snapshot only after it reports `COMPLETED`. A protect request for a `PENDING` snapshot is refused, not queued.

1. Protect the snapshot.

   ```sh
   origin pvs protect-snapshot --snapshot <snapshot-id>
   ```

   The command waits until the snapshot reports `protectionState: PROTECTED`. If the change can't be applied, the command fails and the snapshot reports `PROTECTION_FAILED`: its protection state is unknown. Protect it again. See [Snapshot states](snapshot-states.md#protection-state).

   With the REST API, call the snapshot's `:protect` method, and read the snapshot until it reports `protectionState: PROTECTED`:

   ```sh
   curl -sS -X POST \
     https://pvs.origincloudapis.eu/v1beta1/projects/<project-id>/zones/<zone>/snapshots/<snapshot-id>:protect \
     -H "$(origin id token --as-header --raw)" \
     -H "Content-Type: application/json" -d '{}'
   ```

2. Optional: verify the snapshot.

   ```sh
   origin pvs get-snapshot --snapshot <snapshot-id>
   ```

The snapshot is now a clone source: `state: COMPLETED` and `protectionState: PROTECTED`.

## Next steps

- [Create a volume from a snapshot](../volumes/create.md#create-a-volume-from-a-snapshot)
- [Create an image](../../compute/images/create.md)

## Related

- [Snapshot states](snapshot-states.md)
- [`create-snapshot` command](../reference/cli.md#create-snapshot)
- [`protect-snapshot` command](../reference/cli.md#protect-snapshot)
