---
id: organizations-projects
title: Manage projects
description: Create, list, rename and delete the projects in your organization, set one as your CLI default, change the billing account a project is charged to, and delete an organization.
page_type: task
parent: organizations
nav_order: 30
tags: [projects, organizations, cli]
last_reviewed: 2026-11-14
---

# Manage projects

Every resource lives in a project, so you create at least one project before you launch anything. Use separate projects to keep applications or environments apart, to grant roles on one of them only, or to charge them to different billing accounts.

## Before you begin

- An organization, and its id. See [Create an organization](create.md).
- The `origin` CLI, logged in. See [Use the CLI](../access/cli.md).
- The Owner role (`roles/owner`) on the organization, or a role with the `admin.project.*` permissions. See [Roles](../../iam/roles.md).

You can't create projects while the organization is under review: it has to be active first. See [Review status](review-status.md).

## Create a project

You choose the project's id. It's 6 to 16 lowercase letters, digits and hyphens, starts with a letter and doesn't end with a hyphen, such as `shop-prod`. The id is part of the name of every resource in the project, and is never used again once taken, even after the project is deleted.

1. Create the project:

   ```sh
   origin resourcemanager create-project --organization <organization-id> \
     --project-id shop-prod --display-name "Web shop"
   ```

   Example output (illustrative):

   ```json
   {
     "name": "projects/shop-prod",
     "urn": "urn:origin:cloud:admin::0a1b2c3d4e5f::shop-prod",
     "displayName": "Web shop",
     "createTime": "2026-11-03T09:20:01Z",
     "creator": "user:..."
   }
   ```

   An id that's in use, or was used by a deleted project, is refused with `CONFLICT`.

2. Verify that the project is listed:

   ```sh
   origin resourcemanager list-projects --organization <organization-id>
   ```

3. Optional: make it your CLI's default project, so that commands work in it without `--project`:

   ```sh
   origin config profile-set default-project shop-prod
   ```

   See [Set a default project, zone and region](../access/cli.md#set-a-default-project-zone-and-region).

A new project is charged to the organization's default billing account, and you become its Owner.

## View a project

```sh
origin resourcemanager get-project --project <project-id>
```

`get-project-quota` shows the project's budgets and how much of each it uses. See [Limits](../reference/limits.md).

## Rename a project

Renaming changes the display name only. The project id and every resource name stay the same.

```sh
origin resourcemanager update-project --project <project-id> \
  --display-name "Web shop (production)"
```

To rename the organization, use `origin resourcemanager update-organization --organization <organization-id> --display-name <name>`.

## Change a project's billing account

A project is always charged to exactly one billing account of its organization. To charge it to another one, call the `linkProjectToBillingAccount` mutation in the `admin` namespace with `orgId`, `projectId` and `billingAccountId`. It replaces the current link; there's no way to leave a project without a billing account.

This needs the `admin.project.attach` permission, which the Owner role has. It doesn't need access to the billing account itself. See [Billing access](../billing/billing-access.md).

## Delete a project

Deleting a project is refused while it still owns any of these resources. Nothing you can delete yourself is deleted on your behalf.

- An instance that isn't terminated.
- An image or a key pair.
- A volume or snapshot that isn't deleted.
- A NAT gateway or a Floating IP.
- A VPC, including the project's default VPC.
- A DNS policy other than the project's default one.
- A hosted zone.
- A KMS key of yours that isn't `DELETED`. A key the platform manages doesn't block: it's deleted with the project.

1. Delete every resource in the project: terminate its instances, delete its images, key pairs, volumes and snapshots, delete its NAT gateways, release its Floating IPs, delete its VPCs, delete its DNS policies except the default one, delete its [hosted zones](../../dns/hosted-zones/delete.md), and [delete its KMS keys](../../kms/disable-delete.md#delete-a-key).
2. Delete the project. Deleting can't be undone, so the command needs `--yes`:

   ```sh
   origin resourcemanager delete-project --project <project-id> --yes
   ```

3. Verify that the project is no longer listed by `origin resourcemanager list-projects --organization <organization-id>`.

If a resource remains, the request fails with `CONFLICT`, naming every kind of resource the project still owns, in the order to remove them. See [`CONFLICT`](../reference/errors.md#conflict).

Deleting a project also removes its default DNS policy, the quota budgets you set on it, and every role assignment scoped to it, for every member and service account. Org-wide role assignments are unaffected. See [Role assignments and scopes](../../iam/access-model.md#role-assignments-and-scopes).

The project's deletion also deletes each KMS key the platform manages in it, such as the volumes key: the key becomes `DELETED`, with a `purgeTime` 30 days later, when its material is destroyed. See [Keys the platform manages](../../kms/keys.md#keys-the-platform-manages).

## Delete an organization

An organization can be deleted only when it has no projects and no active service accounts left. A service account is a credential someone may still be using, so it isn't deleted on your behalf.

1. Delete every project. See [Delete a project](#delete-a-project).
2. Delete every service account that isn't deleted yet. List them with `origin iam list-service-accounts --organization <organization-id>`, then delete each one. See [Revoke a service account](../../iam/service-accounts.md#revoke-a-service-account).
3. Delete the organization. Deleting can't be undone, so the command needs `--yes`:

   ```sh
   origin resourcemanager delete-organization --organization <organization-id> --yes
   ```

While a project or an active service account remains, the request fails with [`CONFLICT`](../reference/errors.md#conflict) and deletes nothing. For service accounts, the message names each one by its display name and ID.

Its quotas, its pending invites and every role assignment in it are deleted with it, so no invite to it can be accepted afterwards. Deleted service accounts stay readable, with the state `DELETED`. Its billing accounts stay, with their spend limits, so the last period can still be invoiced; they don't block the deletion.

## Related

- [Organizations and projects](index.md)
- [Platform CLI commands](../reference/cli.md)
- [Limits](../reference/limits.md)
