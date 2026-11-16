---
id: troubleshooting
title: Troubleshoot the KMS
nav_title: Troubleshooting
description: Fixes for common KMS problems - a ciphertext that doesn't decrypt, a disabled or deleted key, and retryable errors right after creating or rotating a key.
page_type: troubleshooting
parent: home
nav_order: 90
tags: [kms, troubleshooting]
last_reviewed: 2026-11-13
availability: preview
---

# Troubleshoot the KMS

## Decrypt answers BAD_REQUEST on ciphertext

**Cause:** the ciphertext doesn't decrypt under the key and encryption context the request gives. A ciphertext names its key version but not its key, and decrypts only with exactly the pairs it was encrypted with.

**Fix:** decrypt with the key that encrypted it, and the same `encryptionContext`: every pair, spelled the same, and no other. Check the audit log's entry of the encryption, whose `details` hold its context, against the refused decrypt's entry: outcome `FAILED`, reason `does_not_open`, with the context it was asked under. See [Encryption context](../keys.md#encryption-context).

## Encrypt, Decrypt or Sign answers CONFLICT

**Cause:** the key is `DISABLED` or `DELETED`.

**Fix:** read the key with GetKey. Enable a disabled key with UpdateKey; undelete a deleted one before its `purgeTime`, then enable it. See [Disable, delete and restore a key](../disable-delete.md).

## A key just created or rotated answers SERVICE_UNAVAILABLE

**Cause:** the change hasn't reached the zone that answered yet. It normally does within seconds.

**Fix:** retry with a backoff. Encrypting, decrypting, signing and generating a data key again is safe.

## Creating, rotating or deleting a key answers SERVICE_UNAVAILABLE for a while

**Cause:** the zone of the region that answers key management is unreachable. Encrypt, Decrypt, GenerateDataKey, Sign and GetPublicKey keep working.

**Fix:** retry later. A create, update, delete, undelete or rotation sent with a `requestId` can be repeated safely with the same id.

## UpdateKey, DeleteKey or RotateKey answers FORBIDDEN on a key you can read

**Cause:** the platform manages the key (`platformManaged`): it created the key for its own use of your project's data, such as protecting your volumes. You can't change such a key, whatever roles you hold.

**Fix:** none needed: the platform keeps the key. For data of your own, create a key of your own. See [Keys the platform manages](../keys.md#keys-the-platform-manages).

## Undelete answers CONFLICT

**Cause:** the key isn't deleted, or its `purgeTime` has passed and its material is destroyed. A destroyed key can't be restored, and nothing it encrypted can be decrypted.

**Fix:** none for a destroyed key. Create a new key, and encrypt your data again from its source.

## Related

- [KMS reference](../reference/index.md#errors)
- [Error codes](../../platform/reference/errors.md)
