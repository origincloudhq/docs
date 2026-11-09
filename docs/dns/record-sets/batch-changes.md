---
id: record-sets-batch-changes
title: Change several record sets at once
nav_title: Batch changes
description: Delete, change and create record sets of one zone in a single call that applies all or none, such as replacing an A record set with a CNAME.
page_type: task
parent: record-sets
nav_order: 20
tags: [dns, cli]
last_reviewed: 2026-11-08
---

# Change several record sets at once

`origin dns batch-change-record-sets` deletes, changes and creates record sets of one zone together. Either every change is made, or none is. The zone is checked as the batch leaves it, not after each change, so one batch can do what no single change can, such as replacing the `A` record set of `www.example.com` with a `CNAME`: on its own, the `CNAME` would conflict with the `A` record set.

## Before you begin

- The `origin` CLI, logged in, with a default project or `--project` on each command. See [Use the CLI](../../platform/access/cli.md).
- The zone's id, and the ids of the record sets to delete or change. `origin dns list-record-sets --hosted-zone <zone-id>` lists them; see [List and read record sets](manage.md#list-and-read-record-sets).

## Replace an A record set with a CNAME

1. Name the record set to delete with `--deletion`, and give the record sets to create in `--creations-json`, as a create takes them:

   ```sh
   origin dns batch-change-record-sets --hosted-zone <zone-id> \
     --deletion <a-record-set-id> \
     --creations-json '[{"dnsName": "www.example.com", "type": "CNAME", "ttl": "300s",
                         "basic": {"values": ["app.example.net"]}}]'
   ```

2. Check the output. It lists the record sets changed, then those created, each in the order of the request:

   ```text
   recordSets
     - name        projects/my-project/hostedZones/hz-Oqu2Vgc2nt6/recordSets/rrset-B7D9YpRmmh9
       urn         urn:origin:cloud:dns::<org-id>:my-project:hz-Oqu2Vgc2nt6/rrset-B7D9YpRmmh9
       dnsName     www.example.com
       type        CNAME
       ttl         300s
       updateTime  2026-11-08T09:19:00.872184Z (0s ago)
       createTime  2026-11-08T09:19:00.872184Z (0s ago)
       basic
         values  app.example.net
   ```

The same `CNAME` created on its own, while the `A` record set exists, is refused with [`CONFLICT`](../../platform/reference/errors.md#conflict): `www.example.com has other record sets, and a CNAME is alone at its name`.

## What a batch takes

| Option | Holds |
|---|---|
| `--deletion` | A record set to delete, by its id or its whole name. Repeat it for more. |
| `--updates-json` | The record sets to change, as a JSON array: each a `recordSet` with its whole `name` and the fields to change, and an `updateMask` naming them, `ttl`, `basic`, `alias` or `*`. |
| `--creations-json` | The record sets to create, as a JSON array of record sets as a create takes them: `dnsName`, `type`, an optional `ttl`, and `basic` or `alias`. |
| `--request-id` | Optional. A UUID; a repeat with the same id within a day answers with the first request's record sets, as they are now, instead of making the changes again. |

The JSON options take `@<file>` to read the array from a file. Durations in JSON are written in seconds with an `s` suffix, such as `"60s"`.

A batch makes 1 to 1,000 changes in all; an empty or larger one is refused with `BAD_REQUEST`. Each kind of change needs its permission on the zone: `dns.record_set.delete`, `.update` or `.create`. A record set may be named once at most across `--deletion` and `--updates-json`. Each change is refused as its own command would refuse it, with a message that names the change; then none of the changes is made. Deletions in a batch need no `--yes`.

For example, an update of a TTL and a new TXT record set in one call, from two files. `updates.json`:

```json
[
  {"recordSet": {"name": "projects/<project-id>/hostedZones/<zone-id>/recordSets/<record-set-id>", "ttl": "60s"},
   "updateMask": "ttl"}
]
```

`creations.json`:

```json
[
  {"dnsName": "example.com", "type": "TXT", "basic": {"values": ["v=spf1 mx -all"]}}
]
```

```sh
origin dns batch-change-record-sets --hosted-zone <zone-id> \
  --updates-json @updates.json --creations-json @creations.json
```

## Related

- [Record sets](index.md)
- [Add, change and delete record sets](manage.md)
- [`batch-change-record-sets` reference](../reference/cli.md#batch-change-record-sets)
- [DNS errors](../reference/errors.md)
