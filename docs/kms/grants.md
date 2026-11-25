---
id: grants
title: Grants
description: A grant lets one platform host decrypt with your key for one encryption context, for at most an hour. Learn who makes grants, how to see them on your keys, and how to end them.
page_type: concept
parent: home
nav_order: 15
tags: [kms, encryption]
last_reviewed: 2026-11-15
availability: preview
---

# Grants

A grant lets one host of the platform decrypt with one of your keys, for one encryption context, for at most an hour. The platform's services make grants for the hosts that need a key at that moment, so that no host can decrypt anything else. You can see every grant on your keys, and end any of them.

## What a grant allows

A grant names:

- **The key**, an `ENCRYPT_DECRYPT` key of yours.
- **The operation**: `DECRYPT`.
- **The grantee**: one platform host, or one platform service of the zone, by the identity its certificate names (it ends in `/zones/<zone>/hosts/<host>` or `/zones/<zone>/workloads/<workload>`).
- **The encryption context** a decryption must carry, exactly, such as `volume=<the volume's name>`. A ciphertext made with another context doesn't decrypt under the grant.
- **When it expires**: at most 60 minutes after it was made or last renewed.

Its name is `projects/<project-id>/regions/<region>/keys/<key-id>/grants/<grant-id>`.

A grant opens nothing once it has expired or been deleted, or while its key is disabled or deleted. Disabling a key suspends its grants: enabled again before they expire, they open again. Deleting a grant ends it for good.

Every grant made, renewed and deleted, and every decryption under a grant, is recorded in your organization's audit log, with the grant and its host. So is a refused one, with the reason.

A key holds at most 1000 grants that haven't expired for any one host, and a key of yours at most 1000 in each zone. Past either, making a grant is refused with `CONFLICT`. A key the platform manages for your volumes has no limit per zone, so it doesn't cap how many volumes you attach. See [Keys the platform manages](keys.md#keys-the-platform-manages).

## Who makes grants

Making a grant needs `kms.grant.create` on the key's project, which the role `roles/kms.grant-delegate` holds. Every organization holds an org-wide binding of that role to compute's service agent, `//iam.origincloudapis.eu/serviceAgents/compute`, so that compute can make the grants your attached volumes need; you can delete that binding and create it again. See [Service agents](../iam/service-agents.md). That role makes grants for hosts and never uses a key itself. Owner holds every permission, so it can make grants too; none of the other KMS roles can.

The grants on a key the platform manages are the platform's: only the platform makes, renews and deletes them. Anyone else's request is refused with `FORBIDDEN`, whatever roles they hold, and recorded in the audit log with reason `platform_managed`. You still see them with `ListGrants`. See [Keys the platform manages](keys.md#keys-the-platform-manages).

A grant is kept by the zone of its host. Making, renewing and using it keep working while any other zone of the region is down.

## See the grants on a key

List a key's grants with `ListGrants`. It needs `kms.grant.list` on the key's project, which Viewer, KMS Viewer and KMS Admin hold:

```bash
curl -H "Authorization: Bearer $(origin id token | jq -r .token)" \
  "https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/<region>/keys/<key-id>/grants"
```

The list holds every grant that hasn't expired, in every zone of the region. A grant made moments ago may be missing until its zone's change arrives.

## End a grant

Delete a grant to end it at once. It needs `kms.grant.delete`, which KMS Admin holds:

```bash
curl -X DELETE -H "Authorization: Bearer $(origin id token | jq -r .token)" \
  "https://kms.origincloudapis.eu/v1beta1/projects/<project-id>/regions/<region>/keys/<key-id>/grants/<grant-id>"
```

To stop every grant on a key at once, [disable the key](disable-delete.md). To stop new grants, remove the `roles/kms.grant-delegate` binding: the grants already made run out within an hour.

## Related

- [Keys and versions](keys.md)
- [KMS reference: API methods](reference/index.md#api-methods)
- [Built-in roles](../iam/roles.md#roleskmsgrant-delegate)
