---
id: disable-delete
title: Disable, delete and restore a key
description: Disable a KMS key to stop its use at once, delete it with a waiting period before its material is destroyed, and undelete it within that period.
page_type: task
parent: home
nav_order: 70
tags: [kms, api]
last_reviewed: 2026-11-14
availability: preview
---

# Disable, delete and restore a key

Disabling a key stops every use of it until you enable it again. Deleting a key stops every use too, and destroys its material after a waiting period: from then on, nothing it encrypted can be decrypted again. Disable a key first to find out what still uses it, and delete it only once nothing does. See [States](keys.md#states).

A key the platform manages can't be disabled, deleted or undeleted: those requests answer `FORBIDDEN`. Deleting its project doesn't delete it yet. See [Keys the platform manages](keys.md#keys-the-platform-manages).

## Before you begin

- `kms.key.update` on the key's project to disable and enable it, and `kms.key.delete` to delete and undelete it. `roles/kms.admin` holds both.

## Disable or enable a key

Set the key's `state` with UpdateKey, naming `state` in `updateMask`:

```sh
curl -sS -X PATCH \
  "https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>?updateMask=state" \
  -H "$(origin id token --as-header --raw)" \
  -H 'Content-Type: application/json' \
  -d '{"state": "DISABLED"}'
```

Use `"ENABLED"` to enable it again. Setting the state the key already has succeeds and changes nothing. The change reaches every zone of the region within seconds.

## Delete a key

1. Delete the key. `destroyDelay` is the waiting period, in whole days from 1 to 90, written in seconds; it's 30 days when you leave it out. This waits 7 days:

   ```sh
   curl -sS -X DELETE \
     "https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>?destroyDelay=604800s" \
     -H "$(origin id token --as-header --raw)"
   ```

2. Check the response: the key is `DELETED`, and `purgeTime` says when its material is destroyed. At that time the platform destroys it, and the [audit log](../iam/audit-log.md) records `kms.keys.destroy` with the platform as the actor.

Deleting a deleted key succeeds and changes nothing. A deleted key stays readable, and is listed with `showDeleted=true`.

A project can be deleted only once each key of yours in it is deleted; the keys the platform manages are deleted with the project. See [Delete a project](../platform/organizations/projects.md#delete-a-project).

## Undelete a key

Before its `purgeTime`, restore a deleted key:

```sh
curl -sS -X POST \
  https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>:undelete \
  -H "$(origin id token --as-header --raw)" \
  -H 'Content-Type: application/json' \
  -d '{}'
```

The key comes back `DISABLED`: [enable it](#disable-or-enable-a-key) to use it again. After its `purgeTime`, undeleting is refused with `CONFLICT`; the key's material is gone.

## Related

- [Keys and versions](keys.md)
- [KMS reference](reference/index.md)
