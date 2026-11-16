---
id: sign-verify
title: Sign data and verify signatures
description: Sign up to 64 KiB with an ECDSA or Ed25519 KMS key, read the key version's public key, and verify the signature with OpenSSL anywhere.
page_type: task
parent: home
nav_order: 50
tags: [kms, api]
last_reviewed: 2026-11-15
availability: preview
---

# Sign data and verify signatures

A signing key signs inside the KMS; anyone with its public key verifies, without calling the KMS. Use it to sign a release, a token or a document.

## Before you begin

- A `SIGN_ECDSA_P256_SHA256` or `SIGN_ED25519` key; see [Create a key](create-key.md).
- `kms.key.sign` and `kms.key.get_public_key` on its project, which `roles/kms.signer` holds.
- OpenSSL 3, to verify.

## Sign

1. Sign the data, up to 64 KiB. Send the data itself, not a digest: an ECDSA key hashes it with SHA-256.

   ```sh
   curl -sS -X POST \
     https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>:sign \
     -H "$(origin id token --as-header --raw)" \
     -H 'Content-Type: application/json' \
     -d "{\"data\": \"$(base64 -w0 release.txt)\"}"
   ```

2. Save the signature, and note the key version that made it:

   ```json
   {
     "signature": "MEUCIQ…",
     "keyVersion": "//kms.origincloudapis.eu/projects/<project-id>/regions/eu-central1/keys/<key-id>/versions/1"
   }
   ```

   ```sh
   echo '<signature from the response>' | base64 -d > release.sig
   ```

## Sign with a chosen version

By default the key's primary version signs. Name a version with `keyVersion` when your verifiers must know it before the signature exists, for example a token whose header names its key, or to keep signing with the old version until your verifiers have the new one's public key after a rotation:

```sh
curl -sS -X POST \
  https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>:sign \
  -H "$(origin id token --as-header --raw)" \
  -H 'Content-Type: application/json' \
  -d "{\"data\": \"$(base64 -w0 release.txt)\", \"keyVersion\": \"//kms.origincloudapis.eu/projects/<project-id>/regions/eu-central1/keys/<key-id>/versions/1\"}"
```

The version must belong to the key you sign with and still hold its material. A version of another key, or one destroyed with its key, is refused with `400 Bad Request`.

## Get the public key

Read the public key of the version that signed: its name is the version's, followed by `/publicKey`. The response's `pem` is a PEM-encoded SubjectPublicKeyInfo.

```sh
curl -sS \
  https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys/<key-id>/versions/1/publicKey \
  -H "$(origin id token --as-header --raw)" | jq -r .pem > release.pub.pem
```

A public key isn't secret: publish it where your verifiers read it. It stays readable while the key is disabled or deleted, until the key's material is destroyed.

## Verify

For an ECDSA key:

```sh
openssl dgst -sha256 -verify release.pub.pem -signature release.sig release.txt
```

For an Ed25519 key:

```sh
openssl pkeyutl -verify -pubin -inkey release.pub.pem -rawin -in release.txt -sigfile release.sig
```

Both print `Verified OK` (or `Signature Verified Successfully`) for a valid signature.

## Related

- [Rotate a key](rotate-key.md): a rotated key signs with its new version, so verifiers need its public key too
- [KMS reference](reference/index.md)
