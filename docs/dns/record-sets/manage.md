---
id: record-sets-manage
title: Add, change and delete record sets
nav_title: Manage record sets
description: Create a record set in a hosted zone, list and read the zone's record sets, change their values or TTL, and delete them with the origin dns commands.
page_type: task
parent: record-sets
nav_order: 10
tags: [dns, cli]
last_reviewed: 2026-11-08
---

# Add, change and delete record sets

Add the records a name answers with, change them, and remove them.

## Before you begin

- The `origin` CLI, logged in, with a default project or `--project` on each command. See [Use the CLI](../../platform/access/cli.md).
- A hosted zone, and its id. `origin dns list-hosted-zones` lists your project's zones.
- The value format of the record type you want. See [Record value formats](../reference/record-values.md).

## Add a record set

1. Create the record set with its `--dns-name`, `--type`, optionally its `--ttl`, and its values in `--basic-json`. This example answers `www.example.com` with two IPv4 addresses for 5 minutes:

   ```sh
   origin dns create-record-set --hosted-zone <zone-id> --dns-name www.example.com \
     --type A --ttl 5m --basic-json '{"values": ["192.0.2.10", "192.0.2.11"]}'
   ```

   Example output:

   ```text
   name        projects/my-project/hostedZones/hz-Oqu2Vgc2nt6/recordSets/rrset-4pWqIJyKCYA
   urn         urn:origin:cloud:dns::<org-id>:my-project:hz-Oqu2Vgc2nt6/rrset-4pWqIJyKCYA
   dnsName     www.example.com
   type        A
   ttl         300s
   updateTime  2026-11-08T09:18:21.684086Z (0s ago)
   createTime  2026-11-08T09:18:21.684086Z (0s ago)
   basic
     values  192.0.2.10, 192.0.2.11
   ```

   Other types take their values the same way. For example, the domain's mail exchangers, for an hour:

   ```sh
   origin dns create-record-set --hosted-zone <zone-id> --dns-name example.com \
     --type MX --ttl 1h \
     --basic-json '{"values": ["10 mail1.example.com", "20 mail2.example.com"]}'
   ```

   `--basic-json @<file>` reads the values from a file instead.

2. Note the record set's id, the last segment of its `name`.

A record set of a name and type the zone already holds is refused with [`CONFLICT`](../../platform/reference/errors.md#conflict): change that one instead. To retry a create safely after a lost answer, give both attempts the same `--request-id`, a UUID.

## List and read record sets

List the zone's record sets, or read one:

```sh
origin dns list-record-sets --hosted-zone <zone-id>
origin dns get-record-set --hosted-zone <zone-id> --record-set <record-set-id>
```

Example output of the list:

```text
NAME                DNS NAME          TYPE   TTL     VALUES                                       FLOATING IP
rrset-kgBe7G6KTC4   example.com       MX     3600s   10 mail1.example.com, 20 mail2.example.com
rrset-4pWqIJyKCYA   www.example.com   A      300s    192.0.2.10, 192.0.2.11
```

A list is sorted by `dnsName`, then by `type`. `--dns-name` and `--type` narrow it to one name or one type, such as `--type MX`.

## Change a record set

Give `update-record-set` what to replace: `--ttl`, `--basic-json` or `--alias`. Values you give replace all of the record set's values, and whatever you leave out stays as it is. This example replaces the addresses of `www.example.com` and keeps its TTL:

```sh
origin dns update-record-set --hosted-zone <zone-id> --record-set <record-set-id> \
  --basic-json '{"values": ["192.0.2.20"]}'
```

And this one changes only its TTL, to a minute:

```sh
origin dns update-record-set --hosted-zone <zone-id> --record-set <record-set-id> \
  --ttl 1m
```

A record set's name and type can't change. To answer a name with another type, create a record set of that type; to replace one type with another, such as an `A` with a `CNAME`, see [Change several record sets at once](batch-changes.md).

## Delete a record set

Delete it with `--yes`; without it, the command says what it would delete and sends nothing:

```sh
origin dns delete-record-set --hosted-zone <zone-id> --record-set <record-set-id> --yes
```

The name stops answering with those records wherever the zone is served; resolvers that cached them keep them until their TTL runs out.

## Related

- [Record sets](index.md)
- [Record value formats](../reference/record-values.md)
- [`create-record-set` reference](../reference/cli.md#create-record-set)
- [`update-record-set` reference](../reference/cli.md#update-record-set)
- [DNS errors](../reference/errors.md)
