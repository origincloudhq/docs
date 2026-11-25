---
id: instance-storage-local-disks-reference
title: Local disk reference
description: The fields of a local disk at launch, the rules each launch checks, and what an instance with local disks can and can't do.
page_type: reference
parent: instance-storage
nav_order: 30
tags: [compute, storage, volumes, reference, api]
related: [instance-storage-local-disks, instance-storage]
last_reviewed: 2026-11-25
---

# Local disk reference

This page lists the fields of a local disk and the rules that apply to it. For what a local disk is, see [Instance storage](index.md#key-concepts). For how to ask for one, see [Add local disks at launch](local-disks.md).

## Fields

`localDisks` is a list on an instance (`Instance`) and on a launch's recipe (`LaunchTemplateData`). Each entry is a `LocalDisk`:

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `sizeGib` | integer | yes | – | The disk's size in GiB, at least 1. |
| `device` | string | no | the first free name | The device name the guest sees the disk under: one of `vda` to `vdz`, but `vdc`, and none that the image's volumes or another local disk has. |

An instance shows `localDisks` as it was launched, with the device name each disk got. The field can't be changed after the launch.

## Rules a launch checks

A launch that breaks one of these is refused with `BAD_REQUEST` naming the field, such as `launchTemplateData.localDisks[1].device`, and creates nothing.

| Rule | Field named |
|---|---|
| At most 16 local disks. | `localDisks` |
| Each disk is at least 1 GiB. | `localDisks[n].sizeGib` |
| A device name is one of `vda` to `vdz`, and not `vdc`. | `localDisks[n].device` |
| No two local disks share a device name, and none takes a device of the image's volumes. | `localDisks[n].device` |
| A disk without a device name still finds a free one. | `localDisks[n].device` |

The launch also needs a machine with room for the instance and all its local disks together; otherwise it is refused with [`INSUFFICIENT_CAPACITY`](../../platform/reference/errors.md#insufficient_capacity). The local disks count against the volume storage quota with the root disk. See [Limits](../../platform/reference/limits.md#storage).

## With a launch template

A template's recipe keeps `localDisks` like any other field. A launch from the template that sets `localDisks` replaces all of the version's local disks for that launch; one that leaves it out keeps them. See [Launch an instance from a launch template](../launch-templates/launch.md).

## What an instance with local disks can do

| Operation | With a local disk |
|---|---|
| Stop and start | Allowed. Each start gives every local disk back empty, on whichever machine the instance starts. |
| Shutdown from inside, or a restart of the machine | The disk's data is lost the same way. |
| Terminate | The local disks are deleted with the instance. |
| Detach the disk | Refused with `BAD_REQUEST`. |
| Snapshot or resize the disk's volume | Refused with `BAD_REQUEST`. |
| Attach other volumes | Allowed, as for any instance. See [Attach and detach volumes](attach-detach.md). |
| Move to another machine for maintenance | The platform doesn't move a running instance with a local disk, because a move would erase it. |

## Billing

Each local disk is billed per GiB-hour of its size from the launch until the instance is terminated, under the product key `storage.host_local`. See [`storage_host_local`](../../pricing/reference/price-list-api.md#storage_host_local).
