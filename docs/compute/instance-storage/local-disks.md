---
id: instance-storage-local-disks
title: Add local disks at launch
description: Launch an instance with blank local disks on the machine it runs on, for scratch data and caches that don't need to survive a stop.
page_type: task
parent: instance-storage
nav_order: 20
tags: [compute, storage, volumes, api]
related: [instance-storage, instance-storage-local-disks-reference, instances-launch]
last_reviewed: 2026-11-25
---

# Add local disks at launch

Add local disks to an instance when it needs fast scratch space, such as a build cache or temporary files, that it can lose. A local disk lives on the machine the instance runs on, and its data is gone after every stop. See [Local disks are temporary](index.md#key-concepts) before you put anything on one.

You ask for local disks when you launch the instance. You can't add one to an instance that already exists, and you can't detach one.

## Before you begin

- Everything a launch needs. See [Launch an instance](../instances/launch.md#before-you-begin).
- Free volume storage quota for the root disk and the local disks together. See [Limits](../../platform/reference/limits.md#storage).
- An access token for the API, such as the one `origin id token --raw` prints. The `origin` CLI doesn't take local disks yet.

## Launch with local disks

1. Add `localDisks` to the launch's recipe, one entry per disk. Each takes a size in GiB and, optionally, a device name:

   ```sh
   curl -s -X POST \
     "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/zones/eu-central1-az1/instances:launch" \
     -H "Authorization: Bearer $(origin id token --raw)" \
     -H "Content-Type: application/json" \
     -d '{
       "launchTemplateData": {
         "instanceType": "//compute.origincloudapis.eu/instanceTypes/gp1.core.2",
         "imageFamily": "//compute.origincloudapis.eu/imageFamilies/<family>",
         "keyPair": "//compute.origincloudapis.eu/projects/<project-id>/keyPairs/<key-pair-id>",
         "localDisks": [
           {"sizeGib": 100, "device": "vdd"},
           {"sizeGib": 20}
         ]
       }
     }'
   ```

   A disk without `device` gets the first free name, in the order the disks are listed. The same `localDisks` field works on the instance body of `POST .../instances`, and in a [launch template's](../launch-templates/index.md) recipe. See [Local disk reference](local-disks-reference.md) for every rule.

   The answer is the launch's operation, as for any launch. If no machine in the zone has room for the instance and its local disks, the launch is refused with [`INSUFFICIENT_CAPACITY`](../../platform/reference/errors.md#insufficient_capacity) and creates nothing.

2. Once the instance is `RUNNING`, read it back. `localDisks` shows each disk with the device name it got:

   ```sh
   curl -s "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/zones/eu-central1-az1/instances/<instance-id>" \
     -H "Authorization: Bearer $(origin id token --raw)"
   ```

   ```json
   "localDisks": [
     {"sizeGib": 100, "device": "vdd"},
     {"sizeGib": 20, "device": "vde"}
   ]
   ```

   Each local disk is also one of the instance's volume attachments: `origin compute list-volume-attachments --instance <instance-id>` lists it with its volume.

3. Log in and find the disks. Each has its volume's id as its serial, like any other disk, and has no file system yet:

   ```sh
   lsblk -o NAME,SERIAL,SIZE
   ```

   Create a file system on it before you mount it, and again after every start: each start gives the disk back empty.

## Next steps

- Keep data that must survive on a durable volume instead. See [Attach and detach volumes](attach-detach.md).
- To launch with the same local disks again, keep them in a [launch template](../launch-templates/create.md).

## Related

- [Local disk reference](local-disks-reference.md)
- [Instance storage](index.md)
- [`storage_host_local` in the price list](../../pricing/reference/price-list-api.md#storage_host_local)
