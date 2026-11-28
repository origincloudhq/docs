---
id: volumes-find-instance
title: Find the instance a volume is attached to
nav_title: Find a volume's instance
description: Find the volume attachment that holds an IN_USE volume, and from its name the instance, with one CLI command or REST API request.
page_type: task
parent: volumes
nav_order: 70
tags: [storage, volumes, instances, cli, api]
last_reviewed: 2026-11-26
---

# Find the instance a volume is attached to

A volume that reports `IN_USE` names what holds it in `attachment`: the id of a volume attachment. The attachment belongs to an instance, and its `name` contains the instance's id. Find it, for example before you detach the volume to delete it.

## Before you begin

- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- The volume's id. See [Name resources](../../platform/access/cli.md#name-resources).
- Permission `compute.instance.list` on the project, the same permission that lets you list the project's instances. See [Roles](../../iam/roles.md).

## Find the instance

1. Read the volume's `name` and `attachment`.

   ```sh
   origin pvs get-volume --volume <volume-id>
   ```

2. List the attachments of the volume across every instance in its zone. `-` for the instance means every instance; pass the volume's full name, `//pvs.origincloudapis.eu/` followed by its `name`:

   ```sh
   origin compute list-volume-attachments --instance - \
     --volume //pvs.origincloudapis.eu/projects/<project-id>/zones/eu-central1-az1/volumes/<volume-id>
   ```

   With the REST API, list the attachments of the instance `-`, which means every instance in the zone, and filter by `volume`:

   ```sh
   curl -sS -G \
     https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/zones/<zone>/instances/-/volumeAttachments \
     --data-urlencode "volume=//pvs.origincloudapis.eu/projects/<project-id>/zones/<zone>/volumes/<volume-id>" \
     -H "$(origin id token --as-header --raw)"
   ```

3. Take the entry whose id, the last segment of its `name`, equals the volume's `attachment`. Its `name` has the form `projects/<project-id>/zones/<zone>/instances/<instance-id>/volumeAttachments/<attachment-id>`: the `<instance-id>` segment is the instance, and `device` is the disk's slot on the instance. Inside the guest, find the disk by its serial, `/dev/disk/by-id/virtio-<volume-id>`, not by that name.

4. Confirm by listing the instance's attachments. The volume is among them.

   ```sh
   origin compute list-volume-attachments --instance <instance-id> \
     --zone eu-central1-az1
   ```

## Reading the attachment list

Normally the list has one entry, with `state: ATTACHED`. Other entries appear while an attach or detach is in progress and after an attach that `FAILED`. An entry with `state: RELEASE_ABANDONED` may still hold the volume: the platform has stopped trying to release it. Detached attachments aren't listed.

The list is empty when no instance in the zone holds the volume.

## Next steps

- [Attach and detach volumes](../../compute/instance-storage/attach-detach.md)
- [Delete a volume](delete.md)

## Related

- [`list-volume-attachments` command](../../compute/reference/cli.md#list-volume-attachments)
- [Volume states](volume-states.md)
