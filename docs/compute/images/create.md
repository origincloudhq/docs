---
id: images-create
title: Create an image
description: Turn an instance's root disk into your own image - clear its machine-id, snapshot and protect the volume, create the image - and update or delete it later.
page_type: task
parent: images
nav_order: 20
tags: [compute, images, snapshots, cli, api]
related: [images, instances-guest-environment]
last_reviewed: 2026-11-03
---

# Create an image

Create your own image to launch more instances with the same software and configuration as one you've already set up. You snapshot the instance's root disk, protect the snapshot, and create an image from it.

## Before you begin

- An instance whose root disk holds what you want in the image.
- The `origin` CLI, logged in, with a default project and zone, the instance's. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).

## Prepare the instance

1. Log in to the instance and clear its machine-id, so every instance launched from the image generates its own:

   ```sh
   sudo truncate -s 0 /etc/machine-id
   sudo rm -f /var/lib/dbus/machine-id
   ```

   If you skip this, every instance from the image shares one machine-id, which breaks VXLAN networking between them. See [Guest environment](../instances/guest-environment.md#machine-identity).

2. Stop the instance, so the snapshot captures a cleanly shut-down file system. See [Stop and start an instance](../instances/stop-start.md).

## Snapshot the root disk

1. Find the root disk's volume. It's the first attachment listed, the one with `boot` set to `true`; note its `volume`:

   ```sh
   origin compute list-volume-attachments --instance <instance-id>
   ```

2. Create a snapshot of that volume, and note the snapshot's `name` and `sourceSizeGib`:

   ```sh
   origin pvs create-snapshot --source-volume <volume-id>
   ```

   The command waits until the snapshot reads `COMPLETED`, then prints it.

3. Protect the snapshot. Only a protected snapshot can back an image:

   ```sh
   origin pvs protect-snapshot --snapshot <snapshot-id>
   ```

   The command waits until the snapshot's `protectionState` reads `PROTECTED`.

For more about snapshot states, see [Create and protect a snapshot](../../storage/snapshots/create-and-protect.md).

## Create the image

An image lists its disks as block devices. Each has a guest device name, a size and, for a disk with content, the snapshot it's created from. The root device names the one the image boots from.

1. Create the image from the snapshot:

   ```sh
   origin compute create-image \
     --description "Web server base" \
     --root-device vda \
     --block-device device=vda,size_gib=<size-gib>,source_snapshot=<snapshot-id> \
     --tag origin:name=web-base
   ```

   `--tag` is optional; `origin:name` names the image. See [Tags](../../platform/tags.md).

   - The snapshot must be protected, and in the project and zone you create the image in.
   - `size_gib` must be at least the snapshot's `sourceSizeGib`. Instances launched from the image get a root disk of at least this size.
   - `device` is the guest device name of the disk, from `vda` to `vdz`, without `/dev/`; `vdc` is reserved. `--root-device` must name one of the block devices.
   - `--default-user` sets the account instances log in as. Omitted, it's `cloud`. See [Guest environment](../instances/guest-environment.md#login-user).

2. Verify the image. Note its `name`, and check that it reads `state: AVAILABLE`:

   ```sh
   origin compute get-image --image <image-id>
   ```

3. Launch an instance from it to test it, with `--image <image-id>`. See [Launch an instance](../instances/launch.md).

With the API, `createImage` takes the root device as one of a list of `blockDeviceSpecs`, each with a `deviceName`, `snapshotUrn` and `sizeInGib`. `rootDeviceName` must name one of them.

## Update or delete an image

You can change an image's description and its tags:

```sh
origin compute update-image --image <image-id> \
  --description "Web server base, hardened"
```

`--tag` replaces all of the image's tags, so give every tag to keep; `--no-tags` removes them all.

To delete an image. The command refuses to run without `--yes`:

```sh
origin compute delete-image --image <image-id> --yes
```

Deleting an image doesn't affect instances already launched from it, because each has its own copy on its root disk. The snapshot behind the image isn't deleted. Unprotect and delete it separately when you no longer need it. While the image exists, the snapshot can't be unprotected or deleted, so delete the image first. See [Delete a snapshot](../../storage/snapshots/delete.md).

You can update and delete only your own images, not platform-provided ones.

## Related

- [`create-image` reference](../reference/cli.md#create-image)
- [Images](index.md)
- [Snapshots](../../storage/snapshots/index.md)
