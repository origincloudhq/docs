---
id: reference
title: Storage reference
description: Look up every origin pvs CLI command and every GraphQL query and mutation in the pvs namespace for volumes, snapshots, and storage classes.
page_type: reference
parent: home
nav_order: 30
tags: [storage, reference, cli, api]
last_reviewed: 2026-11-24
---

# Storage reference

The storage reference covers the `origin pvs` CLI commands and the `pvs` namespace of the GraphQL API. For concepts and procedures, see [Volumes](../volumes/index.md) and [Snapshots](../snapshots/index.md).

## CLI

[`origin pvs` commands](cli.md) lists every command with its options. Attaching and detaching volumes are `origin compute` commands; see [`create-volume-attachment`](../../compute/reference/cli.md#create-volume-attachment) and [`delete-volume-attachment`](../../compute/reference/cli.md#delete-volume-attachment). The CLI prints volumes and snapshots with the field names of [Volume states](../volumes/volume-states.md) and [Snapshot states](../snapshots/snapshot-states.md), which also map them to the GraphQL fields below.

## Names

A volume's, snapshot's and storage class's `name` is its relative name, such as `projects/<project>/zones/<zone>/volumes/<volume-id>`; the commands that act on one take it, or its id. Its full name is `//pvs.origincloudapis.eu/` followed by its `name`. Every reference to another resource is a full name, both in what the CLI and REST API take and in what they show: `storageClass` and `sourceSnapshot` on a volume, `sourceVolume` on a snapshot, and an operation's `target`. A relative name or an id there is refused with `BAD_REQUEST`. `creator` is the full name of the principal that created the resource, such as `//iam.origincloudapis.eu/users/<user-id>` or `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>`.

## GraphQL queries

Queries live under `query { pvs { … } }`. A volume's or snapshot's `id` is its full resource name, such as `//pvs.origincloudapis.eu/projects/<project-id>/zones/<zone>/volumes/<volume-id>`, and every argument that names one takes that `id`. A project is named by its full resource name too: `//resourcemanager.origincloudapis.eu/projects/<project-id>`. A relative name or a bare id is refused with `BAD_REQUEST`.

| Query | Returns | Permission |
|---|---|---|
| `volumes(input: { project })` | The project's volumes, without deleted ones. | `pvs.volume.list` |
| `volume(id)` | One volume, including a deleted one. | `pvs.volume.get` |
| `snapshots(input: { project })` | The project's snapshots, without deleted ones. | `pvs.snapshot.list` |
| `snapshot(id)` | One snapshot, including a deleted one. | `pvs.snapshot.get` |
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

## Encryption field

In the REST API, a volume's `encryption` says how it is encrypted at rest. It is read-only, and absent for a volume that isn't encrypted.

| Field | Value |
|---|---|
| `encryption.format` | `LUKS2` for a persistent volume, `QCOW_LUKS` for a host-local volume. |
| `encryption.kmsKey` | The full name of the KMS key that wraps the volume's data key, such as `//kms.origincloudapis.eu/projects/<project-id>/regions/<region>/keys/<key-id>`. |

The volume's data key itself is never shown. See [KMS](../../kms/index.md) for how keys and grants work.

## Status values

The `status`, `modificationStatus`, and `protectionStatus` fields are strings. Their values are listed in [Volume states](../volumes/volume-states.md) and [Snapshot states](../snapshots/snapshot-states.md).

## Errors and limits

- [Error codes](../../platform/reference/errors.md)
- [Storage limits](../../platform/reference/limits.md#storage)
