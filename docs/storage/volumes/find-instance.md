---
id: volumes-find-instance
title: Find the instance a volume is attached to
nav_title: Find a volume's instance
description: Find the volume attachment that holds an IN_USE volume, and from its name the instance, with one CLI command or API query.
page_type: task
parent: volumes
nav_order: 70
tags: [storage, volumes, instances, cli, api]
last_reviewed: 2026-11-15
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

   With the API, use the `volumeAttachments` query:

   ```graphql
   query {
     compute {
       volumeAttachments(input: {
         project: "//resourcemanager.origincloudapis.eu/projects/<project-id>"
         volume: "//pvs.origincloudapis.eu/projects/<project-id>/zones/<zone>/volumes/<volume-id>"
       }) {
         id
         instance
         deviceName
         status
       }
     }
   }
   ```

3. Take the entry whose id, the last segment of its `name` (with the API, of its `id`), equals the volume's `attachment` (with the API, its `claimRef`). With the API, its `instance` is the instance's full name. Its `name` has the form `projects/<project-id>/zones/<zone>/instances/<instance-id>/volumeAttachments/<attachment-id>`: the `<instance-id>` segment is the instance, and `device` is the device name the guest sees.

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
