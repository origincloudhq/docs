---
id: hosted-zones
title: Hosted zones
description: A hosted zone is a domain the platform answers for, public on the internet or private inside your VPCs. Learn the two kinds, their names, states and tags.
page_type: concept
parent: home
nav_order: 10
tags: [dns, networking]
last_reviewed: 2026-11-13
---

# Hosted zones

A hosted zone is a domain the platform answers for, such as `example.com`, together with every name below it, such as `www.example.com`. It belongs to a project, and to no region. You choose its domain, its `dnsName`, and whether it's public or private, its `visibility`, when you create it; neither changes afterwards.

## Public and private zones

| | Public zone | Private zone |
|---|---|---|
| Answered | On the internet, by the zone's name servers | Only inside the VPCs it's attached to |
| Before it answers | Proves control of its domain, and the domain is delegated to the zone's name servers | Is attached to a VPC |
| Starts as | `PENDING_VERIFICATION` | `ACTIVE` |
| Domain | At least two labels, such as `example.com`, at most 235 characters | May be one label, such as `corp` |
| Same domain twice | Only one zone holds a domain at a time, platform-wide | Different VPCs may carry different zones of the same domain |

Neither kind may be one of the platform's own domains or a name below one. A private zone's domain isn't `internal` or a name below it: that domain answers each instance's own hostname. See [DNS in a VPC](../../network/dns/index.md).

A domain is written without the final dot, and answered in lowercase.

## States

| State | Meaning |
|---|---|
| `PENDING_VERIFICATION` | A public zone that hasn't proved control of its domain yet. It isn't answered and holds no domain. |
| `ACTIVE` | Answered. A public zone in this state holds its domain. |
| `SUSPENDED` | A public zone that lost control of its domain. It isn't answered, keeps its record sets, and its domain is free for another zone. |

A private zone is `ACTIVE` from the start and stays so. How a public zone moves between the states is described in [Domain ownership](ownership.md).

## Name servers and delegation

A public zone's `nameServers` lists the name servers to delegate its domain to: set them as the domain's NS records at its registrar. They're fixed when the zone is created. Delegate the domain only once the zone is `ACTIVE`: the name servers don't answer for a pending or suspended zone, so the domain would stop resolving. The NS and SOA records at the zone's apex are the platform's, written from these name servers; they aren't record sets you manage. A private zone has no name servers.

## When changes are answered

A change is recorded when its call answers. A public zone's records are answered on the internet once Origin Cloud's public name servers serve the zone, and a private zone's in a VPC once the VPC's hosts serve it. Resolvers that cached an earlier answer keep it until its TTL runs out; see [TTL](../record-sets/index.md#ttl).

## Tags

A hosted zone takes up to 50 tags. The `origin:name` tag is the name the console shows. Tags are the only thing about a zone you can change after creating it. See [Tags](../../platform/tags.md).

## Quotas and billing

Each hosted zone counts against your organization's hosted zone quota, and against the project's budget where one is set. Creating a zone requires a valid billing setup for its project; without one it's refused with [`PAYMENT_METHOD_REQUIRED`](../../platform/reference/errors.md#payment_method_required). See [DNS limits](../reference/limits.md).

## What you can do

- [Create a public zone and verify it](create-public.md)
- [Create a private zone and attach it to a VPC](../private-zones/create.md)
- [Delete a hosted zone](delete.md)

## Related

- [Domain ownership](ownership.md)
- [Record sets](../record-sets/index.md)
- [Private zones and VPC attachments](../private-zones/index.md)
