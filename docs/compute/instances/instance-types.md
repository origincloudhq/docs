---
id: instances-instance-types
title: Instance types
description: How instance types set an instance's vCPU, memory and storage bandwidth, how type names are built, and how to read the live catalog and its available flag.
page_type: concept
parent: instances
nav_order: 20
tags: [compute, instances]
related: [instances-launch, instances-change-type]
last_reviewed: 2026-11-03
---

# Instance types

An instance type sets an instance's vCPU count and memory. You choose one at launch, and you can change it later while the instance is stopped. A running instance keeps the size it has.

## Type names

A type name has three parts, for example `gp1.core.2`:

**Kind**  
The first part, such as `gp1`. A kind is a hardware family. Instances of one kind only run on machines built for that kind.

**Profile**  
The middle part, such as `core`. It describes the type's memory and network profile.

**Size**  
The last part, the vCPU count.

Don't derive vCPU or memory from the name. Each type in the catalog states both.

## The catalog

The catalog lists every instance type the platform has. Read it with the `instanceTypes` query or with `origin compute list-instance-types`. No permission is needed, and the catalog is the same for every organization.

Each entry carries these fields:

| Field | Meaning |
|---|---|
| `instanceType` | The name to pass at launch, for example `gp1.core.2`. `origin compute list-instance-types` prints it as `name`, `instanceTypes/gp1.core.2`; `--instance-type` takes either form. |
| `kind` | The hardware family, for example `gp1`. |
| `cpuAllocationMode` | The middle part of the name, for example `core`. |
| `vcpu` | Number of vCPUs. |
| `memoryMib` | Memory in MiB. |
| `storageBandwidthMbit` | The type's storage bandwidth cap in Mbit/s, or `null` for no cap. See [Storage bandwidth](#storage-bandwidth). |
| `storageBurstBandwidthMbit` | The rate the cap can burst to, in Mbit/s, or `null` for no burst. |
| `available` | Whether you can launch or change to this type right now. |

## Available and withdrawn types

The catalog also lists types that are no longer offered, with `available: false`. They stay listed because an instance running as one still reports that type, and you need to be able to look it up. Filter on `available` before you pick a type.

A withdrawn type affects instances like this:

- **Launch or change to it.** Refused with [`PRODUCT_UNAVAILABLE`](../../platform/reference/errors.md#product_unavailable). A type name that never existed is refused as invalid input instead.
- **A running instance of that type.** Unaffected. It keeps its vCPU and memory.
- **A stopped instance of that type.** Starting it is refused with `PRODUCT_UNAVAILABLE`, naming the type. The platform doesn't start it at a different size on its own. Change it to an available type first. See [Change an instance's type](change-type.md).

## Storage bandwidth

An instance type can cap the bandwidth between an instance and its volumes. The catalog states the cap as `storageBandwidthMbit`; larger types have higher caps. It covers all of the instance's volumes together, reads and writes summed, so attaching more volumes shares the cap rather than raising it. A volume attached while the instance runs shares the same cap. A type can allow bursts up to `storageBurstBandwidthMbit`. The burst allowance is 60 seconds' worth of traffic at the burst rate, and it drains by the amount you transfer above the cap, so an instance that has stayed under its cap can run at the burst rate for 60 × burst ÷ (burst − cap) seconds:

| Burst compared with the cap | Longest burst |
|---|---|
| Twice the cap, for example 2000 over 1000 Mbit/s | 2 minutes |
| 1.25 times the cap, for example 5000 over 4000 Mbit/s | 5 minutes |

After a shorter pause the allowance is only partly refilled, and the burst ends sooner. Time spent under the cap refills it at the difference between the cap and the actual rate.

The cap is set when the instance starts. A running instance keeps the cap it started with.

## Capacity

A type in the catalog with `available: true` can still be refused at launch when no machine has room for it. The launch fails with [`INSUFFICIENT_CAPACITY`](../../platform/reference/errors.md#insufficient_capacity), naming the type and what was short. Nothing is created. Retry later or choose a smaller type.

## Related

- [Launch an instance](launch.md)
- [Change an instance's type](change-type.md)
- [Limits](../../platform/reference/limits.md#compute)
- [Pricing](../../pricing/index.md)
- [Machine series](https://www.origincloud.eu/compute/machine-series/) on origincloud.eu – the gp1 series and the size of each instance type
