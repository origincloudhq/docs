---
id: encrypt-decrypt
title: Encrypt and decrypt data
description: Encrypt up to 64 KiB with a KMS key and an encryption context, store the ciphertext, and decrypt it later with the same context.
page_type: task
parent: home
nav_order: 30
tags: [kms, encryption, api]
last_reviewed: 2026-11-15
availability: preview
---

# Encrypt and decrypt data

Encrypt sends your data to the KMS and returns a ciphertext you store; Decrypt returns the data. Use it for small secrets, such as an API token or a password, up to 64 KiB. For larger data, use a data key instead; see [Encrypt large data with a data key](envelope-encryption.md).

Bytes are base64 in the JSON of requests and responses.

## Before you begin

- An `ENCRYPT_DECRYPT` key; see [Create a key](create-key.md).
- `kms.key.encrypt` and `kms.key.decrypt` on its project, which `roles/kms.encrypter-decrypter` holds.

## Encrypt

1. Encrypt the data, with an encryption context that names what it belongs to:

   ```sh
   curl -sS -X POST \
     https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>:encrypt \
     -H "$(origin id token --as-header --raw)" \
     -H 'Content-Type: application/json' \
     -d "{\"plaintext\": \"$(printf 'my-secret-token' | base64)\", \"encryptionContext\": {\"order\": \"o-1001\"}}"
   ```

2. Store `ciphertext` from the response, and the context's pairs, or what they're derived from:

   ```json
   {
     "ciphertext": "AQAAAAJ…",
     "keyVersion": "//kms.origincloudapis.eu/projects/<project-id>/regions/eu-central1/keys/<key-id>/versions/2"
   }
   ```

   The ciphertext names its key version, not its key: remember which key encrypted it.

## Decrypt

1. Decrypt the ciphertext with the same key and the same encryption context:

   ```sh
   curl -sS -X POST \
     https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>:decrypt \
     -H "$(origin id token --as-header --raw)" \
     -H 'Content-Type: application/json' \
     -d '{"ciphertext": "AQAAAAJ…", "encryptionContext": {"order": "o-1001"}}'
   ```

2. Decode `plaintext` from the response:

   ```sh
   echo '<plaintext from the response>' | base64 -d
   ```

A ciphertext given another key or another context is refused with `BAD_REQUEST` on `ciphertext`. A disabled or deleted key is refused with `CONFLICT`. See [Encryption context](keys.md#encryption-context).

## Related

- [Keys and versions](keys.md)
- [KMS reference](reference/index.md)
