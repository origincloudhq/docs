---
id: reference-record-values
title: Record value formats
description: How the values of each record type are written in a record set - A, AAAA, CNAME, TXT, MX, SRV and CAA - with an example of each.
page_type: reference
parent: reference
nav_order: 20
tags: [dns, reference]
last_reviewed: 2026-11-08
---

# Record value formats

A record set's `basic.values` holds 1 to 100 values, each once, in no particular order. With the CLI, give them as `--basic-json '{"values": ["192.0.2.10", "192.0.2.11"]}'`. Each is written as its record set's `type` says below. Names inside values are written in full, without the final dot, and answered in lowercase.

| Type | Format | Example |
|---|---|---|
| `A` | An IPv4 address | `192.0.2.10` |
| `AAAA` | An IPv6 address | `2001:db8::10` |
| `CNAME` | One name | `www.example.net` |
| `TXT` | The text as it is, printable ASCII, up to 4,000 characters, without quotes | `v=spf1 mx -all` |
| `MX` | `{preference} {exchange}` | `10 mail.example.com` |
| `SRV` | `{priority} {weight} {port} {target}` | `10 5 5060 sip.example.com` |
| `CAA` | `{flags} {tag} {value}`, flags `0` or `128`, the value as it is, without quotes | `0 issue letsencrypt.org` |

## Notes per type

**`CNAME`**  
Holds exactly one name. It's alone at its name, and never at the zone's apex. See [CNAME rules](../record-sets/index.md#cname-rules).

**`TXT`**  
A value longer than 255 characters is split into strings of 255 characters on the wire; you write it as one value. Write it without the surrounding quotes a zone file would use.

**`MX`**  
`0 .`, as the record set's only value, says the name takes no mail.

**`SRV`**  
A target of `.`, as the record set's only value's target, says the service isn't offered at the name.

**`CAA`**  
Write the value without quotes, such as `0 issuewild letsencrypt.org`.

## Size

All of a record set's records together take at most 16 KiB on the wire. A value its type doesn't take is refused with `BAD_REQUEST`.

## Alias record sets

An alias record set has no values: it has `alias.floatingIp` instead, and is always of type `A`. See [Point a name at a Floating IP](../record-sets/alias.md).

## Related

- [Record sets](../record-sets/index.md)
- [DNS limits](limits.md)
