---
id: reference
title: Storage reference
description: Look up every origin pvs CLI command and every GraphQL query and mutation in the pvs namespace for volumes, snapshots, and storage classes.
page_type: reference
parent: home
nav_order: 30
tags: [storage, reference, cli, api]
last_reviewed: 2026-11-03
---

# Storage reference

The storage reference covers the `origin pvs` CLI commands and the `pvs` namespace of the GraphQL API. For concepts and procedures, see [Volumes](../volumes/index.md) and [Snapshots](../snapshots/index.md).

## CLI

[`origin pvs` commands](cli.md) lists every command with its options. Attaching and detaching volumes are `origin compute` commands; see [`create-volume-attachment`](../../compute/reference/cli.md#create-volume-attachment) and [`delete-volume-attachment`](../../compute/reference/cli.md#delete-volume-attachment). The CLI prints volumes and snapshots with the field names of [Volume states](../volumes/volume-states.md) and [Snapshot states](../snapshots/snapshot-states.md), which also map them to the GraphQL fields below.

## GraphQL queries

Queries live under `query { pvs { … } }`.

| Query | Returns | Permission |
|---|---|---|
| `volumes(input: { projectUrn })` | The project's volumes, without deleted ones. | `pvs.volume.list` |
| `volume(volumeUrn)` | One volume, including a deleted one. | `pvs.volume.get` |
| `snapshots(input: { projectUrn })` | The project's snapshots, without deleted ones. | `pvs.snapshot.list` |
| `snapshot(snapshotUrn)` | One snapshot, including a deleted one. | `pvs.snapshot.get` |
| `storageClasses` | Every published storage class with its `available` flag and its baseline IOPS and throughput. | None |

To find the instance an `INUSE` volume is attached to, use the `compute.volumeAttachments` query. See [Find the instance a volume is attached to](../volumes/find-instance.md).

## GraphQL mutations

Mutations live under `mutation { pvs { … } }`. Mutations that return `CommandRequestStatus` report only that the request was accepted; read the resource to see the result.

| Mutation | Effect | Returns | Permission |
|---|---|---|---|
| `createVolume` | Creates a volume, empty or from a snapshot. See [Create a volume](../volumes/create.md). | `PvsVolume` | `pvs.volume.create` |
| `importVolume` | Creates a volume from a disk image at a URL. See [Import a disk image as a volume](../volumes/import.md). | `PvsVolume` | `pvs.volume.create` |
| `resizeVolume` | Grows a volume. See [Resize a volume](../volumes/resize.md). | `CommandRequestStatus` | `pvs.volume.update` |
| `deleteVolume` | Deletes a volume. See [Delete a volume](../volumes/delete.md). | `CommandRequestStatus` | `pvs.volume.delete` |
| `createSnapshot` | Takes a snapshot of a volume. See [Create and protect a snapshot](../snapshots/create-and-protect.md). | `PvsSnapshot` | `pvs.snapshot.create` |
| `protectSnapshot` | Protects a snapshot so it can be a clone source. | `CommandRequestStatus` | `pvs.snapshot.protect` |
| `unprotectSnapshot` | Lifts a snapshot's protection. Refused with `CONFLICT` while an image is built from the snapshot. See [Delete a snapshot](../snapshots/delete.md). | `CommandRequestStatus` | `pvs.snapshot.unprotect` |
| `deleteSnapshot` | Deletes an unprotected snapshot. Refused with `CONFLICT` while an image is built from the snapshot. See [Delete a snapshot](../snapshots/delete.md). | `CommandRequestStatus` | `pvs.snapshot.delete` |

## Performance fields

`PvsVolume.iops` and `PvsVolume.throughputMibps` are the volume's own limits; `PvsStorageClass.baselineIops` and `PvsStorageClass.baselineThroughputMibps` are what a new volume of the class starts with. All four are read-only integers, and `null` means "no limit" on a volume and "not published" on a class. See [Performance limits](../volumes/storage-classes.md#performance-limits).

## Status values

The `status`, `modificationStatus`, and `protectionStatus` fields are strings. Their values are listed in [Volume states](../volumes/volume-states.md) and [Snapshot states](../snapshots/snapshot-states.md).

## Errors and limits

- [Error codes](../../platform/reference/errors.md)
- [Storage limits](../../platform/reference/limits.md#storage)
