---
id: reference
title: Storage reference
description: Look up every origin pvs CLI command and every REST method of the storage API for volumes, snapshots, and storage classes, with the permission each needs.
page_type: reference
parent: home
nav_order: 30
tags: [storage, reference, cli, api]
last_reviewed: 2026-11-25
---

# Storage reference

The storage reference covers the `origin pvs` CLI commands and the storage REST API. For concepts and procedures, see [Volumes](../volumes/index.md) and [Snapshots](../snapshots/index.md).

## CLI

[`origin pvs` commands](cli.md) lists every command with its options. Attaching and detaching volumes are `origin compute` commands; see [`create-volume-attachment`](../../compute/reference/cli.md#create-volume-attachment) and [`delete-volume-attachment`](../../compute/reference/cli.md#delete-volume-attachment). The CLI prints volumes and snapshots with the field names of [Volume states](../volumes/volume-states.md) and [Snapshot states](../snapshots/snapshot-states.md). The REST API uses the same field names.

## Names

A volume's, snapshot's and storage class's `name` is its relative name, such as `projects/<project>/zones/<zone>/volumes/<volume-id>`; the commands that act on one take it, or its id. Its full name is `//pvs.origincloudapis.eu/` followed by its `name`. Every reference to another resource is a full name, both in what the CLI and REST API take and in what they show: `storageClass` and `sourceSnapshot` on a volume, `sourceVolume` on a snapshot, and an operation's `target`. A relative name or an id there is refused with `BAD_REQUEST`. `creator` is the full name of the principal that created the resource, such as `//iam.origincloudapis.eu/users/<user-id>` or `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>`.

## REST API

The storage API answers at `https://pvs.origincloudapis.eu`. It's a preview (`v1beta1`): names and fields may still change. Requests and responses are JSON with lower camel case field names, such as `sizeGib`. Every request carries an access token; see [Use the REST APIs](../../platform/access/api.md). In the paths, a volume or snapshot is `projects/<project-id>/zones/<zone>/volumes/<volume-id>` or `.../snapshots/<snapshot-id>`. A reference to another resource in a request or response is a full name; see [Names](#names).

A method that changes a resource returns a long-running operation, which reports only that the request was accepted. Read the resource, or wait for the operation, to see the result.

| Method | Path | Effect | Permission |
|---|---|---|---|
| `ListVolumes` | `GET /v1beta1/projects/<project-id>/zones/<zone>/volumes` | The zone's volumes, without deleted ones. | `pvs.volume.list` |
| `GetVolume` | `GET /v1beta1/<volume-name>` | One volume, including a deleted one. | `pvs.volume.get` |
| `CreateVolume` | `POST /v1beta1/projects/<project-id>/zones/<zone>/volumes` | Creates a volume, empty or from a snapshot. See [Create a volume](../volumes/create.md). | `pvs.volume.create` |
| `ImportVolume` | `POST /v1beta1/projects/<project-id>/zones/<zone>/volumes:import` | Creates a volume from a disk image at a URL. See [Import a disk image as a volume](../volumes/import.md). | `pvs.volume.create` |
| `UpdateVolume` | `PATCH /v1beta1/<volume-name>?updateMask=sizeGib` | Grows a volume, or changes its tags. See [Resize a volume](../volumes/resize.md). | `pvs.volume.update` |
| `DeleteVolume` | `DELETE /v1beta1/<volume-name>` | Deletes a volume. See [Delete a volume](../volumes/delete.md). | `pvs.volume.delete` |
| `ListSnapshots` | `GET /v1beta1/projects/<project-id>/zones/<zone>/snapshots` | The zone's snapshots, without deleted ones. | `pvs.snapshot.list` |
| `GetSnapshot` | `GET /v1beta1/<snapshot-name>` | One snapshot, including a deleted one. | `pvs.snapshot.get` |
| `CreateSnapshot` | `POST /v1beta1/projects/<project-id>/zones/<zone>/snapshots` | Takes a snapshot of a volume. See [Create and protect a snapshot](../snapshots/create-and-protect.md). | `pvs.snapshot.create` |
| `ProtectSnapshot` | `POST /v1beta1/<snapshot-name>:protect` | Protects a snapshot so it can be a clone source. | `pvs.snapshot.protect` |
| `UnprotectSnapshot` | `POST /v1beta1/<snapshot-name>:unprotect` | Lifts a snapshot's protection. Refused with `CONFLICT` while an image is built from the snapshot. See [Delete a snapshot](../snapshots/delete.md). | `pvs.snapshot.unprotect` |
| `DeleteSnapshot` | `DELETE /v1beta1/<snapshot-name>` | Deletes an unprotected snapshot. Refused with `CONFLICT` while an image is built from the snapshot. See [Delete a snapshot](../snapshots/delete.md). | `pvs.snapshot.delete` |
| `ListStorageClasses` | `GET /v1beta1/storageClasses` | Every published storage class with its `available` flag and its baseline IOPS and throughput. | None |
| `GetStorageClass` | `GET /v1beta1/storageClasses/<class>` | One storage class. | None |

To find the instance an `IN_USE` volume is attached to, list the volume's attachments with the compute API's `ListVolumeAttachments` method. See [Find the instance a volume is attached to](../volumes/find-instance.md).

## Performance fields

A volume's `iops` and `throughputMibps` are the volume's own limits; a storage class's `baselineIops` and `baselineThroughputMibps` are what a new volume of the class starts with. All four are read-only integers, and `0` means "no limit" on a volume and "not published" on a class. See [Performance limits](../volumes/storage-classes.md#performance-limits).

## Encryption field

A volume's `encryption` says how it is encrypted at rest. It is read-only, and absent for a volume that isn't encrypted.

| Field | Value |
|---|---|
| `encryption.format` | `LUKS2` for a persistent volume, `QCOW_LUKS` for a host-local volume. |
| `encryption.kmsKey` | The full name of the KMS key that wraps the volume's data key, such as `//kms.origincloudapis.eu/projects/<project-id>/regions/<region>/keys/<key-id>`. |

The volume's data key itself is never shown. See [Encryption at rest](../../platform/encryption-at-rest.md) for what is encrypted and who holds the keys, and [KMS](../../kms/index.md) for how keys and grants work.

## Status values

The `state`, `resizeState`, and `protectionState` fields are enumerations, written as strings in JSON. Their values are listed in [Volume states](../volumes/volume-states.md) and [Snapshot states](../snapshots/snapshot-states.md).

## Errors and limits

- [Error codes](../../platform/reference/errors.md)
- [Storage limits](../../platform/reference/limits.md#storage)
