---
id: vpcs-addressing
title: VPC and subnet addressing
nav_title: Addressing
description: How a VPC's IPv4 and IPv6 ranges are chosen, how large its subnets are, which addresses are reserved, and what happens when address space runs out.
page_type: concept
parent: vpcs
nav_order: 10
tags: [networking, vpc]
last_reviewed: 2026-11-03
---

# VPC and subnet addressing

Every VPC has one private IPv4 range and one IPv6 range. Each subnet gets its own slice of both, and every network interface gets one IPv4 and one IPv6 address from its subnet. The VPC's IPv4 range is fixed when you create the VPC, and so is the size of every subnet in it.

## The VPC's IPv4 range

You can choose the IPv4 range with `--ipv4-cidr-block` when you create the VPC. It must be private address space (`10.0.0.0/8`, `172.16.0.0/12` or `192.168.0.0/16`) and sized between `/16` and `/28`.

If you don't choose one, the platform picks a random `/16` from `172.16.0.0/16` to `172.31.0.0/16` that no other VPC in your organization uses. There are only 16 such ranges, so `create-vpc` without `--ipv4-cidr-block` can be refused with a message telling you to specify an IPv4 CIDR. Pass a range of your own and the request succeeds.

## Subnet size

Subnets are eight bits narrower than the VPC, with `/29` as the smallest size; the VPC's `subnetIpv4PrefixLength` shows it. The following table shows some examples.

| VPC range | Subnet size | Subnets per VPC | Usable addresses per subnet |
|---|---|---|---|
| `/16` | `/24` | 256 | 252 |
| `/20` | `/28` | 256 | 12 |
| `/21` to `/28` | `/29` | 2 to 256 | 4 |

You can't choose a subnet's size or resize a subnet. If you need more instances per subnet, create a VPC with a wider range.

## Reserved addresses

Four IPv4 addresses in every subnet aren't available for instances:

- The network address (for example, `10.0.1.0` in `10.0.1.0/24`)
- The router address, the first address after the network address (`10.0.1.1`)
- The DNS resolver address, the second address after the network address (`10.0.1.2`)
- The broadcast address (`10.0.1.255`)

Instances use the router address as their default gateway and the DNS resolver address as their name server. The subnet's `ipv4Gateway` and `ipv4DnsServers` fields show both, and `availableIpv4AddressCount` how many addresses are still free.

## IPv6 addresses

The platform assigns every VPC a `/56` IPv6 range; you can't choose it. Each subnet gets a `/72` from it, and each network interface gets one address from its subnet.

IPv6 works between instances inside the VPC. It doesn't work between an instance and the internet, in either direction. What an outbound IPv6 connection to an internet address does depends on the VPC's IPv6 range, its `ipv6CidrBlock`:

| VPC IPv6 range | Outbound IPv6 to the internet |
|---|---|
| Starts with `fd` (a private range) | Refused immediately with an ICMPv6 "administratively prohibited" error. Clients that fall back to IPv4, such as browsers, `curl` and package managers, then connect over IPv4 without waiting. |
| Any other range | Gets no answer. A client waits for its connection timeout before it falls back to IPv4. |

A subnet whose route table has no `::/0` route to the Internet Gateway, or that has no route table, gets the immediate refusal whatever the VPC's range.

To avoid the wait, configure the guest to prefer IPv4 for internet destinations, for example with a `precedence ::ffff:0:0/96 100` line in `/etc/gai.conf` on Linux.

## When address space runs out

Address space can run out in three places. Each case is refused with a message that names what ran out:

- **The VPC has no room for another subnet.** `create-subnet` is refused; the VPC's `availableSubnetCount` is `0`. Use a different VPC, or create a new one with a wider IPv4 range. Deleting a subnet doesn't give its range back to the VPC.
- **The subnet has no free address.** `create-network-interface` in that subnet is refused, and so is a launch that creates its interface there. Use a different subnet, or delete network interfaces you no longer need; their addresses become free again.
- **The platform has no IPv6 range left for a new VPC.** `create-vpc` is refused, because every VPC needs an IPv6 range.

A VPC's address ranges go back to the platform only when you delete the whole VPC. For what happens to a VPC's IPv6 range after deletion, see [Delete a subnet or VPC](delete.md).

## Related

- [Create a VPC and subnets](create.md)
- [Network interfaces](network-interfaces.md)
- [Limits](../../platform/reference/limits.md#network)
