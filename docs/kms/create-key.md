---
id: create-key
title: Create a key
description: Create an encryption or signing key in a project and region with the KMS API, name and tag it, and read or list the project's keys.
page_type: task
parent: home
nav_order: 20
tags: [kms, api]
last_reviewed: 2026-11-15
availability: preview
---

# Create a key

A new key is `ENABLED` with one version, its primary. Choose its purpose now: it can't change later. See [Purposes](keys.md#purposes).

## Before you begin

- `kms.key.create` on the project, which Owner and `roles/kms.admin` hold.
- An access token; see [Call the KMS API](reference/index.md#call-the-kms-api).

## Create the key

1. Create the key, giving its `purpose` and, optionally, its `tags`. This creates an encryption key named `orders` in `eu-central1`:

   ```sh
   curl -sS -X POST \
     https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys \
     -H "$(origin id token --as-header --raw)" \
     -H 'Content-Type: application/json' \
     -d '{"purpose": "ENCRYPT_DECRYPT", "tags": {"origin:name": "orders"}}'
   ```

   For a signing key, use `SIGN_ECDSA_P256_SHA256` or `SIGN_ED25519`.

2. Keep the key's `name` from the response: Origin Cloud assigned its id, and your programs use the key by this name. The response is the key:

   ```json
   {
     "name": "projects/<project-id>/regions/eu-central1/keys/<key-id>",
     "purpose": "ENCRYPT_DECRYPT",
     "state": "ENABLED",
     "primaryVersion": "//kms.origincloudapis.eu/projects/<project-id>/regions/eu-central1/keys/<key-id>/versions/1",
     "versions": [
       {
         "keyVersion": "//kms.origincloudapis.eu/projects/<project-id>/regions/eu-central1/keys/<key-id>/versions/1",
         "createTime": "2026-11-13T10:00:00Z"
       }
     ],
     "createTime": "2026-11-13T10:00:00Z",
     "updateTime": "2026-11-13T10:00:00Z",
     "tags": {
       "origin:name": "orders"
     }
   }
   ```

Each create makes a new key. To repeat a create safely after a timeout, send the same `requestId`, a UUID, with both requests: the repeat returns the key the first one created instead of creating a second one.

The key reaches every zone of the region within seconds. Until it has, using it may be refused with `SERVICE_UNAVAILABLE`; retry.

## Name and tag a key

A key's id is assigned by Origin Cloud; its name is the `origin:name` tag, which the console shows. A key takes up to 50 tags, under the same rules as every resource's. See [Tags](../platform/tags.md).

Replace a key's tags with UpdateKey, naming `tags` in `updateMask`. Give every tag to keep: tags you leave out are removed, and `{}` removes them all.

```sh
curl -sS -X PATCH \
  "https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>?updateMask=tags" \
  -H "$(origin id token --as-header --raw)" \
  -H 'Content-Type: application/json' \
  -d '{"tags": {"origin:name": "orders-eu", "team": "shop"}}'
```

Setting the tags a key already has succeeds and changes nothing. A deleted key keeps its tags; undelete it to change them. Changing tags needs `kms.key.update` and is recorded in the audit log as `kms.keys.updateTags`.

## Read and list keys

Read one key:

```sh
curl -sS https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id> \
  -H "$(origin id token --as-header --raw)"
```

List the project's keys in a region, ordered by name. Deleted keys are left out unless you add `showDeleted=true`:

```sh
curl -sS "https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys?showDeleted=true" \
  -H "$(origin id token --as-header --raw)"
```

## Next steps

- [Encrypt and decrypt data](encrypt-decrypt.md)
- [Sign data and verify signatures](sign-verify.md)
