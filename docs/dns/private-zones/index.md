---
id: private-zones
title: Private zones and VPC attachments
nav_title: Private zones
description: A private zone answers only inside the VPCs it's attached to. Learn how attachments work, which VPCs a zone can attach to, and the names it can't take.
page_type: concept
parent: home
nav_order: 30
tags: [dns, vpc, networking]
last_reviewed: 2026-11-07
---

# Private zones and VPC attachments

A private zone holds names for use inside your networks, such as `db.corp.example`. It's answered by the resolver of every VPC it's attached to, and by nothing else: not on the internet, and not in any other VPC. It needs no domain registration and no ownership proof, and it's `ACTIVE` from the moment you create it.

## VPC attachments

A VPC attachment makes a private zone's names resolve from every instance in one VPC, in every zone the VPC spans. A zone can be attached to several VPCs, and a VPC can carry several zones.

- **Same project only.** A private zone attaches only to VPCs of its own project. Attaching it to a VPC of another project is refused with `BAD_REQUEST`, with the same message whichever project the VPC is in.
- **One zone of a domain per VPC.** A VPC carries at most one attached zone of a domain. Attaching a second `corp.example` zone to it is refused with [`CONFLICT`](../../platform/reference/errors.md#conflict). Different VPCs may carry different zones of the same domain, so each VPC can answer the same names differently.
- **Private zones only.** Attaching a public zone is refused with `BAD_REQUEST`: it's answered on the internet, in every VPC alike.

An attachment's id is the VPC's id, so you can name the attachment of a known zone and VPC without listing.

The VPC's instances resolve the zone's names within a few seconds of the attachment, and a record set you add, change or delete reaches them as quickly. Detaching the zone stops its answers within a few seconds too. An instance that cached an answer keeps it for the record's TTL, as with any DNS answer.

Deleting a VPC deletes its attachments. The zones themselves stay.

## Names a private zone can't take

A private zone's domain may have one label, such as `corp`. It can't be `internal` or a name below it, since that domain answers each instance's own hostname, and it can't be one of the platform's own domains or a name below one. See [DNS in a VPC](../../network/dns/index.md).

## How a VPC answers

The resolver of each subnet answers the names of the private zones attached to its VPC itself, with the rest of the VPC's own names. Queries for any other name go out as the VPC's DNS policy says. See [DNS in a VPC](../../network/dns/index.md).

- **Instance hostnames first.** Names in `internal` are always the instances' own; no private zone can take them.
- **The most specific zone answers.** With `corp.example` and `dev.corp.example` both attached, `api.dev.corp.example` is answered from `dev.corp.example`.
- **A private zone answers for every name below it.** A name the zone has no record set for is answered as nonexistent (`NXDOMAIN`), and a name without a record set of the type asked for is answered with no records (`NODATA`). Neither is passed on, so inside the VPC a private zone hides the public zone of the same domain.
- **CNAMEs are followed.** A `CNAME` record set whose target lies outside its zone, in another attached zone, an instance hostname or a public name, is answered together with its target's records, following at most 8 `CNAME`s. A target without a record of the type asked for is answered with the chain and no records (`NODATA`). A chain that loops or is longer fails with `SERVFAIL`. If the VPC's DNS policy doesn't relay, a `CNAME` to a public name is answered as it is.
- **Aliases answer with the Floating IP's current address,** whichever zone of the region it's in, and with nothing while that Floating IP doesn't exist. When the Floating IP is in another zone and that zone can't be reached, the alias keeps the address it last answered with, as long as it still points at the same Floating IP: its removal, or the deletion of that Floating IP, takes effect once the other zones can be reached again. An alias pointed at another Floating IP meanwhile answers nothing until then.
- **TTLs are the record sets' own.** An instance's resolver library may cache an answer for that long.

Private zones keep resolving while the platform's control plane is unreachable: each subnet's resolver answers from the copy its host holds.

## What you can do

- [Create a private zone and attach it to a VPC](create.md)
- [Delete a hosted zone](../hosted-zones/delete.md)

## Related

- [Hosted zones](../hosted-zones/index.md)
- [VPCs and subnets](../../network/vpcs/index.md)
