---
id: volumes-storage-classes
title: Storage classes
description: A storage class is a volume's performance tier. Learn which classes exist, which one you can select today, the IOPS and throughput limit each gives a volume, and how to read the catalog.
page_type: concept
parent: volumes
nav_order: 10
tags: [storage, volumes]
last_reviewed: 2026-11-03
---

# Storage classes

A storage class is the performance tier of a volume, chosen when you create or import it. It sets the media the volume is stored on and the IOPS and throughput limit the volume starts with. `gp1` (general purpose, SSD-backed) is the only class you can select, and it's the class a volume gets when you don't name one.

## Published classes

The platform publishes three classes. Only those with `available: true` in the catalog can be selected.

| Class | Display name | Media | IOPS | Throughput | Available |
|---|---|---|---|---|---|
| `gp1` | General Purpose | `SSD` | 3,000 | 125 MiB/s | Yes (default) |
| `st1` | Throughput Optimized | `HDD` | Not published | Not published | No |
| `io1` | I/O Intensive | `SSD` | Not published | Not published | No |

Read the catalog rather than relying on this table. The `origin pvs list-storage-classes` command and the `pvs.storageClasses` query return every published class with its display name, backing media, whether it's the default, its `available` flag and its baseline limits. The catalog is platform-wide and needs no permission.

```sh
origin pvs list-storage-classes
origin pvs get-storage-class --storage-class gp1
```

In the CLI's output, a class's `name` is `storageClasses/<class>`, such as `storageClasses/gp1`, and the fields are `displayName`, `media`, `defaultClass`, `available`, `baselineIops` and `baselineThroughputMibps`. The GraphQL query has the same fields, with `storageClass` for the class and `isDefault` in place of `defaultClass`:

```graphql
query {
  pvs {
    storageClasses {
      storageClass
      displayName
      media
      isDefault
      available
      baselineIops
      baselineThroughputMibps
    }
  }
}
```

## Performance limits

Every volume has a limit on how many I/O operations per second (IOPS) and how much data per second (throughput, in MiB/s, where 1 MiB is 1,048,576 bytes) it serves. A new volume gets its class's baseline: `baselineIops` and `baselineThroughputMibps` in the catalog. The volume then carries the limit itself, in its own `iops` and `throughputMibps` fields, which `origin pvs get-volume` shows.

A `gp1` volume is limited to 3,000 IOPS and 125 MiB/s, whatever its size. The limit applies to every volume the same way: one you create empty, one you create from a snapshot, one you import, and an instance's root disk.

A volume that already existed when limits were introduced gets its class's baseline too. If an instance had it attached while running, the limit is guaranteed from the instance's next start.

Keep these points in mind:

**Reads and writes count together**  
A volume doing 2,000 reads and 1,000 writes per second is at its 3,000 IOPS limit.

**Every I/O is one operation, whatever its size**  
A 1 MiB write counts as one operation, the same as a 4 KiB write. Large sequential I/O reaches the throughput limit long before the IOPS limit.

**The limit is a ceiling, not a guarantee**  
The storage behind every volume is shared. A volume can't go above its limit, but under heavy load from other volumes it may not reach it.

**Most workloads never reach it**  
A database writing small transactions one at a time is bound by how long each write takes to become durable, a few milliseconds, which keeps it at a few hundred writes per second. The limit matters for bulk loads, backups, benchmarks and other work that keeps many I/Os in flight.

A volume whose `iops` and `throughputMibps` are `0` in the CLI's output, or `null` in the GraphQL API, has no limit. Volumes you create are always limited.

You can't change a volume's limit yet.

## Choosing a class

Pass the class as `--storage-class` on `origin pvs create-volume` and `origin pvs import-volume`, by its id, such as `gp1`, or its whole name, `storageClasses/gp1`. With the API, pass it as `storageClass` on the `createVolume` or `importVolume` mutation. Omit it to get the default.

The platform answers two kinds of wrong values differently:

**A published class that isn't available**  
For example, `st1` or `io1`. The request is refused with [`PRODUCT_UNAVAILABLE`](../../platform/reference/errors.md#product_unavailable), and the message lists the classes you can use. Nothing is created.

**A class that doesn't exist**  
For example, a typo such as `gp2`. The request is refused with [`BAD_REQUEST`](../../platform/reference/errors.md#bad_request) and the message `invalid storage_class`. Nothing is created.

## Existing volumes

A volume keeps the class it was created with. A volume that was created in a class that isn't selectable now keeps working and stays on its own media. The `available` flag only governs new volumes.

An existing `st1` volume has the `gp1` limits until `st1` publishes limits of its own.

## Related

- [Create a volume](create.md)
- [Import a disk image as a volume](import.md)
- [`list-storage-classes` command](../reference/cli.md#list-storage-classes)
- [Pricing](../../pricing/index.md)
