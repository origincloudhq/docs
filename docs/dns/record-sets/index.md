---
id: record-sets
title: Record sets
description: A record set is every record of one name and type in a hosted zone. Learn the record types, names and wildcards, TTLs, the CNAME rules, aliases and batch changes.
page_type: concept
parent: home
nav_order: 20
tags: [dns, networking]
last_reviewed: 2026-11-08
---

# Record sets

A record set is every record of one name and type in a hosted zone, such as the two `A` records that `www.example.com` answers with. A zone holds at most one record set per name and type. A record set answers either with values of its own, its `basic` data, or with a platform resource's address, as an `alias`.

## Names

A record set's `dnsName` is the zone's domain or a name below it, written in full without the final dot, such as `www.example.com`. It's answered in lowercase. Labels may hold `_`, as in `_dmarc.example.com`. A name outside the zone is refused with `BAD_REQUEST`.

**Wildcards.** `*` as the whole leftmost label, as in `*.example.com`, makes a wildcard record set: it answers for names below `example.com` that have no record set of any type. `*` anywhere else in a name is refused.

A record set's name and type never change. To give a name another type, create a new record set; see [Change several record sets at once](batch-changes.md).

## Record types

| Type | Answers with |
|---|---|
| `A` | IPv4 addresses |
| `AAAA` | IPv6 addresses |
| `CNAME` | Another name this one is an alias of |
| `TXT` | Text |
| `MX` | Mail exchangers |
| `SRV` | Service locations |
| `CAA` | The certificate authorities that may issue certificates for the name |

A record set holds 1 to 100 values, each once, written as its type says, and at most 16 KiB of records on the wire. For every type's value format, see [Record value formats](../reference/record-values.md).

The NS and SOA records at the zone's apex are the platform's, written from the zone's name servers. They aren't record sets, and you can't create an NS record set that delegates a name below the apex.

## CNAME rules

A `CNAME` record set holds one name, and it's alone at its name: a zone can't hold a `CNAME` and any other record set of the same name. It's never at the zone's apex, `example.com` itself. A `CNAME` that would share its name is refused with [`CONFLICT`](../../platform/reference/errors.md#conflict).

To replace an `A` record set with a `CNAME` of the same name, make both changes in one batch change. See [Change several record sets at once](batch-changes.md).

## TTL

A record set's `ttl` is how long resolvers may keep its answer, from 30 seconds to 7 days, in whole seconds. It's 300 seconds when you leave it out. A shorter TTL lets a change reach clients sooner; a longer one means fewer queries. A resolver that cached an answer keeps it until its TTL runs out, whatever you change in the meantime.

## Aliases to a Floating IP

An alias record set answers with the current address of a Floating IP, and follows it as it changes: you don't copy the address into the record set. The Floating IP must be in the zone's project. A Floating IP's address is an IPv4 address, so an alias is always of type `A`; an `AAAA` alias is refused. See [Point a name at a Floating IP](alias.md).

## Changes

A change is recorded when its call answers, and answered wherever the zone is served. An update replaces what you give it: the `ttl`, the `basic` values or the `alias` (`--ttl`, `--basic-json` or `--alias` with `origin dns update-record-set`, or `updateMask` in the API, where `*` names all of them). Giving `basic` values to an alias record set, or an `alias` to one with values, replaces the kind it had.

A batch change, `origin dns batch-change-record-sets`, deletes, changes and creates record sets of one zone together, all or none. The zone is checked as the batch leaves it, not after each change. See [Change several record sets at once](batch-changes.md).

## Quotas

Each record set counts against your organization's record set quota, across all its zones, and against the project's budget where one is set. A record set beyond the quota is refused with `BAD_REQUEST`. See [DNS limits](../reference/limits.md).

## What you can do

- [Add, change and delete record sets](manage.md)
- [Change several record sets at once](batch-changes.md)
- [Point a name at a Floating IP](alias.md)
- [Use external-dns with Origin Cloud DNS](external-dns.md)

## Related

- [Record value formats](../reference/record-values.md)
- [Hosted zones](../hosted-zones/index.md)
