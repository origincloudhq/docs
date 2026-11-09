---
id: troubleshooting
title: Troubleshoot storage
description: Fix common volume and snapshot problems, from volumes in ERROR and failed resizes to refused deletes, failed imports, and refused requests.
page_type: troubleshooting
parent: home
nav_order: 40
tags: [storage, troubleshooting, volumes, snapshots, errors]
last_reviewed: 2026-11-03
---

# Troubleshoot storage

Each section below describes one symptom, its cause, and how to resolve it. For the error codes the API returns, see [Error codes](../../platform/reference/errors.md).

## Volume reports ERROR after create or import

**Symptom:** `create-volume` or `import-volume` fails, and the volume reports `state: ERROR` instead of `AVAILABLE`, with a `stateReason` of the form `the operation failed (<code>)`.

**Cause:** The platform couldn't provision the volume. There's no usable disk behind it.

**Resolution:**
1. Delete the volume. Deleting an `ERROR` volume is allowed. See [Delete a volume](../volumes/delete.md).
2. Create or import the volume again.

For import failures, see [Import fails with ERR_IMPORT or ERR_IMPORT_IMAGE_TOO_LARGE](#import-fails-with-err_import-or-err_import_image_too_large).

## Volume reports ERROR after delete

**Symptom:** `delete-volume` fails, and the volume stays in your volume list with `state: ERROR` instead of disappearing.

**Cause:** The platform couldn't remove the volume's disk. The disk may still exist, so the volume still counts against your quota.

**Resolution:**
1. Delete the volume again.
2. If it returns to `ERROR` again, contact support with the volume's `name` and its `stateReason`.

## Resize reports RESIZE_FAILED

**Symptom:** `update-volume --size-gib` fails, and the volume reports `resizeState: RESIZE_FAILED` with a `resizeReason`, and `sizeGib` still shows the old size.

**Cause:** The platform accepted the resize but couldn't apply it. The volume's data is intact and it's still usable at its old size.

**Resolution:**
1. Request the resize again. See [Resize a volume](../volumes/resize.md).

## Resize is refused

**Symptom:** `update-volume --size-gib` fails immediately with an error such as `volumes can only grow` or `a volume in state <state> cannot be resized`.

**Cause:** The requested size is smaller than the current size, or the volume isn't `AVAILABLE` or `IN_USE`, or another resize is still in progress. Nothing about the volume changed.

**Resolution:**
1. Ask for a size larger than the current `sizeGib`. Volumes can't shrink.
2. Wait for a `CREATING` volume to become `AVAILABLE`, or for `resizeState` to leave `RESIZING`, then retry.

## Volume delete is refused because it's attached

**Symptom:** `delete-volume` fails with `the volume cannot be deleted while an instance attachment still claims it: <attachment-id>`.

**Cause:** The volume is attached to an instance and reports `IN_USE`.

**Resolution:**
1. Find the instance. See [Find the instance a volume is attached to](../volumes/find-instance.md).
2. Detach the volume. See [Attach and detach volumes](../../compute/instance-storage/attach-detach.md).
3. Delete the volume again.

## Volume delete is refused because of snapshots

**Symptom:** `delete-volume` fails with `the volume cannot be deleted while a snapshot of it still exists: <snapshot-id>`, or the same message naming several snapshots.

**Cause:** A snapshot depends on its volume's data. Every snapshot that isn't `DELETED` blocks the delete, including one in `ERROR`.

**Resolution:**
1. Delete each named snapshot, unprotecting it first if needed. See [Delete a snapshot](../snapshots/delete.md).
2. Wait until each reports `DELETED`.
3. Delete the volume again.

## Volume still exists after its instance was terminated

**Symptom:** After you terminate an instance, one of its volumes is still `AVAILABLE` and billed, and `retentionNote` is set.

**Cause:** The volume couldn't be deleted with the instance, most often because a snapshot of it exists. The platform keeps the volume instead of deleting your snapshot.

**Resolution:**
1. Delete the volume's snapshots, then the volume. See [Delete a volume](../volumes/delete.md).

## Snapshot can't be used as a clone source

**Symptom:** Creating a volume from a snapshot, creating an image, or launching from an image fails with `snapshot is not available` or `snapshot is not protected`.

**Cause:** A clone source must report `state: COMPLETED` and `protectionState: PROTECTED`.

**Resolution:**
1. Wait for a `PENDING` snapshot to reach `COMPLETED`.
2. Protect the snapshot, or protect it again if `protectionState` is `PROTECTION_FAILED`. See [Create and protect a snapshot](../snapshots/create-and-protect.md).

If the error says the size `must be greater or equal than used snapshot size`, ask for at least the snapshot's `sourceSizeGib`.

## Snapshot delete is refused

**Symptom:** `delete-snapshot` fails with `snapshot must be unprotected before it can be deleted`.

**Cause:** The snapshot is `PROTECTED`, in a protection change, or its `protectionState` is `PROTECTION_FAILED`.

**Resolution:**
1. Unprotect the snapshot and wait for `UNPROTECTED`. See [Delete a snapshot](../snapshots/delete.md).
2. Delete it again.

## Snapshot unprotect or delete is refused because of an image

**Symptom:** `unprotect-snapshot` or `delete-snapshot` fails with a `CONFLICT` such as `image <image-id> is built from this snapshot; delete the image first`.

**Cause:** Every launch from an image clones the snapshot it's built from, so the snapshot stays protected while the image exists.

**Resolution:**
1. Delete each named image. See [Create an image](../../compute/images/create.md#update-or-delete-an-image).
2. Unprotect the snapshot again, wait for `UNPROTECTED`, and delete it. See [Delete a snapshot](../snapshots/delete.md).

## Snapshot unprotect is refused because of a volume

**Symptom:** `unprotect-snapshot` fails with a `CONFLICT` such as `volume <volume-id> is cloned from this snapshot; delete the volume first`.

**Cause:** A volume created from a snapshot depends on it until the volume is deleted, so the snapshot stays protected while the volume exists, `DELETING` included.

**Resolution:**
1. Delete each named volume and wait until it reports `DELETED`. See [Delete a volume](../volumes/delete.md).
2. Unprotect the snapshot again, wait for `UNPROTECTED`, and delete it. See [Delete a snapshot](../snapshots/delete.md).

## Import fails with ERR_IMPORT or ERR_IMPORT_IMAGE_TOO_LARGE

**Symptom:** `import-volume` fails, and the volume reports `ERROR` with `stateReason` `the operation failed (ERR_IMPORT_IMAGE_TOO_LARGE)` or `the operation failed (ERR_IMPORT)`.

**Cause:** `ERR_IMPORT_IMAGE_TOO_LARGE` means the image's virtual size is larger than the volume's `sizeGib`. `ERR_IMPORT` means the download, conversion, or write failed: the source returned an HTTP error, sent nothing for 60 seconds, or the import took longer than 25 minutes.

**Resolution:**
1. Delete the failed volume.
2. Import again with `--size-gib` at least the image's virtual size, or from a faster or reachable source. See [Import a disk image as a volume](../volumes/import.md).

## Request refused with PRODUCT_UNAVAILABLE

**Symptom:** `create-volume` or `import-volume` fails with [`PRODUCT_UNAVAILABLE`](../../platform/reference/errors.md#product_unavailable) and a message such as `storage class 'st1' is not available - use one of: gp1`.

**Cause:** The storage class is published but can't be selected.

**Resolution:**
1. Use a class whose `available` is `true`, or omit the class to get `gp1`. See [Storage classes](../volumes/storage-classes.md).

## Request refused with PAYMENT_METHOD_REQUIRED

**Symptom:** Creating, importing, or resizing a volume, or creating a snapshot, fails with [`PAYMENT_METHOD_REQUIRED`](../../platform/reference/errors.md#payment_method_required).

**Cause:** The project's billing account can't pay. For card-managed billing, no verified payment method is on file. Nothing was created or changed.

**Resolution:**
1. Add a payment method. See [Add a payment method](../../platform/billing/payment-method.md).
2. Retry the request.

## Request refused because a quota is exceeded

**Symptom:** A create, import, resize, or snapshot request fails with a message such as `organisation quota exceeded: volume storage (GiB) usage is <n>, requesting <m> more would exceed the limit of <limit>`.

**Cause:** The request would take your organization or project over its volume storage or snapshot quota. Volumes in `CREATING`, `DELETING`, and `ERROR` count too.

**Resolution:**
1. Delete volumes or snapshots you no longer need, including ones in `ERROR`.
2. Retry the request, or ask for a higher limit. See [Limits](../../platform/reference/limits.md#storage).

## Request refused because the organization isn't active

**Symptom:** A create, import, resize, or snapshot request fails with `organisation is <status>, not active`.

**Cause:** Your organization hasn't been approved yet, or is no longer active.

**Resolution:**
1. Check your organization's status. See [Review your organization's status](../../platform/organizations/review-status.md).
