---
id: instance-storage-attach-detach
title: Attach and detach volumes
description: Attach an available volume to a running or stopped instance, choose its guest device name, and detach it again to use elsewhere.
page_type: task
parent: instance-storage
nav_order: 10
tags: [compute, storage, volumes, cli, api]
related: [instance-storage]
last_reviewed: 2026-11-05
---

# Attach and detach volumes

Attach a volume to give an instance another disk. Detach it to move the disk and its data to another instance. The instance can be running or stopped.

## Before you begin

- An instance in `RUNNING` or `STOPPED`.
- A volume in `AVAILABLE` state, in the same project and zone as the instance. See [Create a volume](../../storage/volumes/create.md).
- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).

## Attach a volume

1. Attach the volume:

   ```sh
   origin compute create-volume-attachment \
     --instance <instance-id> \
     --volume <volume-id>
   ```

   To choose the guest device name, add `--device`, for example `--device vdb`. Names run from `vda` to `vdz`, and `vdc` is reserved by the platform. Omitted, the platform assigns the first free name.

   The command waits for the attachment, then prints it with its `device` and `state`:

   - On a stopped instance, the attachment reads `ATTACHED` right away and the disk appears in the guest at the next start.
   - On a running instance, the disk is added live. The attachment passes through `ATTACHING` and reads `ATTACHED` once the guest sees the device. If the device can't be added, the command fails, the attachment reads `FAILED`, and the volume is `AVAILABLE` again.

2. Verify inside the guest that the disk is there. Its serial is the volume's id, so the guest links it under `/dev/disk/by-id/virtio-<volume-id>`:

   ```sh
   ls -l /dev/disk/by-id/virtio-<volume-id>
   lsblk -o NAME,SERIAL,SIZE
   ```

   Use that path, not a device name, to pick the disk for `mkfs` or `mount`. A new volume has no file system. Create one before you mount it.

To list an instance's attachments, the boot volume's first:

```sh
origin compute list-volume-attachments --instance <instance-id>
```

## Detach a volume

1. Unmount the file system inside the guest if the instance is running.

2. Find the attachment. The volume's `attachment` names it, and `list-volume-attachments` lists it with its `volume`:

   ```sh
   origin pvs get-volume --volume <volume-id>
   ```

3. Detach the volume, passing the attachment's whole name, or its id with `--instance`. The command refuses to run without `--yes`:

   ```sh
   origin compute delete-volume-attachment \
     --volume-attachment <attachment-name> --yes
   ```

   On a running instance the device is removed live, and the attachment reads `DETACHING` until the guest releases it. If the guest doesn't release it, the command fails and the volume stays attached. Otherwise the command waits until the volume is detached.

4. Verify that the volume reads `AVAILABLE`:

   ```sh
   origin pvs get-volume --volume <volume-id>
   ```

   A detached attachment is no longer listed.

You can't detach an instance's root disk.

## Using the API

The `attachVolume` and `detachVolume` mutations return the attachment:

```graphql
mutation {
  compute {
    attachVolume(input: {
      instanceUrn: "<instance-urn>"
      volumeUrn: "<volume-urn>"
      deviceName: "vdb"
    }) {
      urn
      deviceName
      status
    }
  }
}
```

## If this fails

An attach is refused when the instance is neither running nor stopped, when the volume isn't `AVAILABLE`, or when the device name you asked for is already taken. To find which instance holds a volume that reads `IN_USE`, see [Find the instance that holds a volume](../../storage/volumes/find-instance.md).

## Related

- [`create-volume-attachment` reference](../reference/cli.md#create-volume-attachment)
- [`delete-volume-attachment` reference](../reference/cli.md#delete-volume-attachment)
- [Instance storage](index.md)
