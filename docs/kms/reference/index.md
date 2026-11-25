---
id: reference
title: KMS reference
nav_title: Reference
description: How to call the KMS API, every method of its keys, their fields, the permissions and built-in roles, the limits, and the errors the KMS answers with.
page_type: reference
parent: home
nav_order: 80
tags: [kms, reference, api]
last_reviewed: 2026-11-25
availability: preview
---

# KMS reference

For explanations, follow the links back to the concept and task pages.

## CLI

[`origin kms` commands](cli.md) lists every command with its flags: keys, encrypting, decrypting, signing, data keys and grants.

## Call the KMS API

The KMS API answers at `https://kms.origincloudapis.eu`, and at the regional name `https://kms.eu-central1.origincloudapis.eu`. It's a preview (`v1beta1`): names and fields may still change. Every request carries an access token; with the `origin` CLI logged in, `origin id token --as-header --raw` prints the header. See [Use the GraphQL API](../../platform/access/api.md#authenticate).

```sh
curl -sS https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/eu-central1/keys \
  -H "$(origin id token --as-header --raw)"
```

Requests and responses are JSON, with fields in lower camel case, such as `encryptionContext`. Bytes, such as a `plaintext` or a `signature`, are base64. A duration, such as `destroyDelay`, is written in seconds with an `s` suffix, such as `"604800s"`.

- Lists return a page at a time. Pass the response's `nextPageToken` as `pageToken` for the next page; `pageSize` asks for a page size, which the server clamps.
- Creates, updates, deletes, undeletes and rotations take an optional `requestId`, a UUID. A repeat with the same id within a day returns what the first request did instead of doing it again.

## Resource names

| Resource | Name |
|---|---|
| Key | `projects/<project-id>/regions/<region>/keys/<key-id>` |
| Key version | `projects/<project-id>/regions/<region>/keys/<key-id>/versions/<version>` |
| Public key | `projects/<project-id>/regions/<region>/keys/<key-id>/versions/<version>/publicKey` |
| Grant | `projects/<project-id>/regions/<region>/keys/<key-id>/grants/<grant-id>` |

Outside the KMS API, such as in the audit log, a key is named by its full name, `//kms.origincloudapis.eu/` followed by its name.

## API methods

Paths are relative to `https://kms.origincloudapis.eu/v1beta1/`, and `<key>` stands for `projects/<project-id>/regions/<region>/keys/<key-id>`.

| Method | HTTP | Permission | Does |
|---|---|---|---|
| `ListKeys` | `GET projects/<project-id>/regions/<region>/keys` | `kms.key.list` | The project's keys in the region, by name. `showDeleted` lists deleted keys too. |
| `GetKey` | `GET <key>` | `kms.key.get` | One key, deleted or not. |
| `CreateKey` | `POST projects/<project-id>/regions/<region>/keys` | `kms.key.create` | Creates a key from its `purpose`, with optional `tags`; Origin Cloud assigns its id. |
| `UpdateKey` | `PATCH <key>?updateMask=state,tags` | `kms.key.update` | Sets `state` to `ENABLED` or `DISABLED`, replaces `tags`, or both. |
| `DeleteKey` | `DELETE <key>` | `kms.key.delete` | Deletes a key; its material is destroyed after `destroyDelay`. |
| `UndeleteKey` | `POST <key>:undelete` | `kms.key.undelete` | Restores a deleted key, disabled, before its `purgeTime`. |
| `RotateKey` | `POST <key>:rotate` | `kms.key.rotate` | Adds a version and makes it the primary. |
| `Encrypt` | `POST <key>:encrypt` | `kms.key.encrypt` | Encrypts `plaintext` with `encryptionContext`. |
| `Decrypt` | `POST <key>:decrypt` | `kms.key.decrypt` | Decrypts `ciphertext` with `encryptionContext`. |
| `GenerateDataKey` | `POST <key>:generateDataKey` | `kms.key.generate_data_key` | A 32-byte data key, in `plaintext` and in `ciphertext`. |
| `Sign` | `POST <key>:sign` | `kms.key.sign` | Signs `data` with the primary version, or the version `keyVersion` names by its full name. |
| `GetPublicKey` | `GET <key>/versions/<version>/publicKey` | `kms.key.get_public_key` | A signing key version's public key, as PEM in `pem`. |
| `ListGrants` | `GET <key>/grants` | `kms.grant.list` | The key's grants that haven't expired, in every zone, by name. |
| `GetGrant` | `GET <key>/grants/<grant-id>` | `kms.grant.get` | One grant that hasn't expired. |
| `CreateGrant` | `POST <key>/grants` | `kms.grant.create` | Lets one host decrypt for one `encryptionContext`, for `ttl`. |
| `RenewGrant` | `POST <key>/grants/<grant-id>:renew` | `kms.grant.update` | Extends a grant to `ttl` from now. |
| `DeleteGrant` | `DELETE <key>/grants/<grant-id>` | `kms.grant.delete` | Ends a grant. |

Every response of an operation on data names the key version it used in `keyVersion`, by its full name: `//kms.origincloudapis.eu/` followed by the version's name.

## Key fields

| Field | Description |
|---|---|
| `name` | The key's resource name. |
| `purpose` | `ENCRYPT_DECRYPT`, `SIGN_ECDSA_P256_SHA256` or `SIGN_ED25519`. Fixed at creation. See [Purposes](../keys.md#purposes). |
| `state` | `ENABLED`, `DISABLED` or `DELETED`. See [States](../keys.md#states). |
| `primaryVersion` | The full name of the version new ciphertexts and signatures use. |
| `versions` | Every version, oldest first: its `keyVersion` full name and `createTime`. |
| `createTime`, `updateTime` | When the key was created and last changed. |
| `purgeTime` | For a deleted key, when its material is destroyed, or was. |
| `tags` | Labels of your own, at most 50. The `origin:name` tag is the key's name, which the console shows. See [Tags](../../platform/tags.md). |
| `platformManaged` | Output only. Set on a key the platform created for its own use of the project's data; you can't change such a key. See [Keys the platform manages](../keys.md#keys-the-platform-manages). |

## Permissions and roles

Every permission is checked on the key's project. Owner holds them all; Viewer holds `get` and `list` on keys and grants. The KMS roles, assignable org-wide or on one project:

| Role | Permissions | For |
|---|---|---|
| `roles/kms.admin` | `get`, `list`, `create`, `update`, `delete`, `undelete`, `rotate`, `get_public_key`; grants: `get`, `list`, `delete` | Managing keys, never using them on data |
| `roles/kms.viewer` | `get`, `list`, `get_public_key`; grants: `get`, `list` | Reading keys, public keys and grants |
| `roles/kms.encrypter-decrypter` | `encrypt`, `decrypt`, `generate_data_key` | A program that encrypts and decrypts its data |
| `roles/kms.signer` | `sign`, `get_public_key` | A program that signs |
| `roles/kms.grant-delegate` | grants: `get`, `list`, `create`, `update`, `delete` | The platform's services that let a host use your keys |
| `roles/kms.grant-issuer` | grants: `create`, `delete` | Storage's service agent, on the keys the platform manages |
| `roles/kms.volume-keys-agent` | `get`, `create`, `update`, `undelete`, `generate_data_key` | Storage's service agent, on the keys the platform manages |

The permissions are `kms.key.<action>` and `kms.grant.<action>`. See [Built-in roles](../../iam/roles.md) and [Assign roles](../../iam/assign-roles.md).

## Limits

| Limit | Value |
|---|---|
| Plaintext to encrypt, data to sign | 64 KiB |
| Encryption context | 16 pairs; each key and value 1 to 256 bytes |
| Data key | 32 bytes |
| Deletion waiting period (`destroyDelay`) | 1 to 90 whole days; 30 days by default |
| Page size | 50 by default, at most 500 |

## Errors

| Code | When |
|---|---|
| `BAD_REQUEST` | A malformed name or field, a region the KMS doesn't serve, data over 64 KiB, a ciphertext that doesn't decrypt under this key and encryption context, or an operation the key's purpose doesn't do. The error names the field. |
| `NOT_FOUND` | The project, the key or the key version doesn't exist. |
| `CONFLICT` | The key isn't in a state the request can start from: using a disabled or deleted key, rotating a key that isn't enabled, or undeleting a key that isn't deleted or whose material is destroyed. |
| `FORBIDDEN` | The caller lacks the method's permission on the key's project, or asks to change a key the platform manages. |
| `SERVICE_UNAVAILABLE` | Retryable: a key or a change that hasn't reached the zone yet, or the zone that answers key management is unreachable. |

See [Error codes](../../platform/reference/errors.md) for how errors are returned.

## Related

- [What is Origin Cloud KMS?](../index.md)
- [Troubleshoot the KMS](../troubleshooting/index.md)
