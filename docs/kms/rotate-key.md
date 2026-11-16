---
id: rotate-key
title: Rotate a key
description: Rotate a KMS key to add a new primary version; older ciphertexts still decrypt, and older signatures still verify with their version's public key.
page_type: task
parent: home
nav_order: 60
tags: [kms, api]
last_reviewed: 2026-11-13
availability: preview
---

# Rotate a key

Rotating a key adds a version and makes it the primary. New ciphertexts and signatures use it from then on, unless a Sign names an older version ([Sign with a chosen version](sign-verify.md#sign-with-a-chosen-version)). Nothing you stored needs to change: a ciphertext records its version, so Decrypt keeps decrypting it, and an older signature still verifies with its version's public key. See [Key versions](keys.md#key-versions).

## Before you begin

- An `ENABLED` key; a disabled or deleted one is refused with `CONFLICT`.
- A key of your own: one the platform manages is refused with `FORBIDDEN`. See [Keys the platform manages](keys.md#keys-the-platform-manages).
- `kms.key.rotate` on its project, which `roles/kms.admin` holds.

## Rotate

1. Rotate the key:

   ```sh
   curl -sS -X POST \
     https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>:rotate \
     -H "$(origin id token --as-header --raw)" \
     -H 'Content-Type: application/json' \
     -d '{}'
   ```

2. Check the response: `primaryVersion` names the new version, and `versions` lists every version.

The new version reaches every zone of the region within seconds. Until it has, a zone may still encrypt with the previous version, and decrypting a ciphertext of the new one there is refused with `SERVICE_UNAVAILABLE`; retry.

For a signing key, publish the new version's public key before you rely on its signatures; see [Get the public key](sign-verify.md#get-the-public-key).

## Related

- [Disable, delete and restore a key](disable-delete.md)
