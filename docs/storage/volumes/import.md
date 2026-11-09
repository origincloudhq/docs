---
id: volumes-import
title: Import a disk image as a volume
nav_title: Import a disk image
description: Create a volume whose initial content is a disk image downloaded from an HTTP(S) URL, size it correctly, and check that the import succeeded.
page_type: task
parent: volumes
nav_order: 40
tags: [storage, volumes, images, cli, api]
last_reviewed: 2026-11-03
---

# Import a disk image as a volume

Import a disk image when you've built one yourself and want it as a volume's initial content. The platform downloads the image from an HTTP(S) URL, converts it to raw format, and writes it into a new volume. To launch instances from the result, snapshot and protect the volume, then create an image from the snapshot.

## Before you begin

- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- Permission `pvs.volume.create` on the project, the same permission as creating a volume. See [Roles](../../iam/roles.md).
- An active organization, a billing account that can pay, and enough volume storage quota for the full size you ask for. See [Create a volume](create.md#before-you-begin).
- A disk image at an HTTP(S) URL. The platform sends a plain `GET` request with no credentials, so the URL itself must grant access.
- The image's virtual size. This is the size of the disk the image represents, not the size of the file you download. For a compressed or sparse image the file is much smaller. For a qcow2 image, `qemu-img info` shows it as `virtual size`.

## Choose the image and size

The platform detects the image format and converts it. Common disk image formats are accepted, including qcow2 (also compressed qcow2) and raw. Host the image file itself, not an archive of it such as `.gz` or `.xz`.

`--size-gib` is the size of the volume you get. It's what the disk becomes, what counts against your quota, and what you're billed for:

- An image whose virtual size is smaller than `--size-gib` leaves you the extra space.
- An image whose virtual size is larger than `--size-gib` is refused. The import fails and the volume ends in `ERROR`, because the platform can't shrink your image without destroying part of it.

## Import the image

1. Start the import with a size of at least the image's virtual size.

   ```sh
   origin pvs import-volume --size-gib 20 \
     --source-url https://example.com/images/my-image.qcow2
   ```

   The command waits until the import is done and prints the volume. `state: AVAILABLE` means the import succeeded and the volume holds your image. An import can take many minutes; to return at once instead, add `--no-wait`, and wait for the operation later with `origin pvs wait-operation`. See [Wait for long-running operations](../../platform/access/cli.md#wait-for-long-running-operations).

   With the API, use the `importVolume` mutation:

   ```graphql
   mutation {
     pvs {
       importVolume(input: {
         projectUrn: "<project-urn>"
         sizeInGib: 20
         sourceUrl: "https://example.com/images/my-image.qcow2"
       }) {
         urn
         status
       }
     }
   }
   ```

   Add `--storage-class` or `storageClass` to choose a class other than the default, and `--tag` to tag the volume. See [Storage classes](storage-classes.md).

2. Optional: verify the volume.

   ```sh
   origin pvs get-volume --volume <volume-id>
   ```

## Time limits

An import must finish within 25 minutes, including downloading, converting, and writing the image. The import fails with `ERR_IMPORT` when:

- it takes longer than 25 minutes, for example a very large image or a slow source,
- the source answers with an HTTP error status,
- the source sends no data for 60 seconds.

## If the import fails

A failed import fails the command and leaves the volume in `ERROR`, and the volume's `stateReason` names the cause:

**`the operation failed (ERR_IMPORT_IMAGE_TOO_LARGE)`**  
The image's virtual size is larger than the volume's `sizeGib`. Delete the volume and import again with a larger size.

**`the operation failed (ERR_IMPORT)`**  
The download, conversion, or write failed, or the import ran out of time. Delete the volume and import again, from a faster source if time was the problem.

No data from a failed import is kept, but the `ERROR` volume counts against your quota until you delete it. See [Delete a volume](delete.md).

## Next steps

- [Create and protect a snapshot](../snapshots/create-and-protect.md)
- [Create an image](../../compute/images/create.md)

## Related

- [Volume states](volume-states.md)
- [`import-volume` command](../reference/cli.md#import-volume)
