---
id: internet-access-route-tables
title: Route tables
description: How route tables decide where a subnet's internet traffic goes, what a subnet without one reaches, and how to change routes and associations.
page_type: concept
parent: internet-access
nav_order: 10
tags: [networking, internet-access]
last_reviewed: 2026-11-03
---

# Route tables

A route table decides where a subnet's internet-bound traffic goes. A subnet uses at most one table, through its route table association. Traffic between addresses inside the VPC doesn't depend on route tables.

## Subnets without a table, main tables and tables you create

A subnet with no route table has no route out of the VPC, even when the VPC has an Internet Gateway, and isn't reachable from the internet (see [How internet access is decided](#how-internet-access-is-decided)). A subnet you create in a VPC you created starts with no table, and its `routeTable` is empty; give it one with a route table association.

A table you create with `create-route-table` starts with the VPC's local routes and no other route. Its `localRoutes` list the VPC's own IPv4 and IPv6 ranges, which every table reaches directly; they aren't routes you can change. A subnet that uses the table has no route out of the VPC until you add a default route. This is how you make a private subnet next to a public one.

Your project's default VPC has a main route table, created with the VPC, its `main` field `true`. Its own subnet uses it, and so does every subnet you create in that VPC until you associate the subnet with another table. Creating the VPC's Internet Gateway adds the default routes `0.0.0.0/0` and `::/0` through the gateway to the main table. A VPC you create has no main table.

A subnet is public when its route table has a default route to the Internet Gateway, and private otherwise.

## Routes and targets

A route sends traffic for a destination to a target. A route table decides only where traffic to the internet goes, so a route's destination is a default route: `0.0.0.0/0` for IPv4, or `::/0` for IPv6. Its target is one of:

| Target | Meaning |
|---|---|
| `--internet-gateway` | Out through the VPC's Internet Gateway. Must name the gateway of this table's VPC. |
| `--nat-gateway` | Out through a NAT gateway, which translates the traffic to its own address. Must name a NAT gateway in this table's VPC, and the destination must be `0.0.0.0/0`. |

A NAT gateway translates IPv4 only, so a `::/0` route to a NAT gateway is refused. A table holds at most one route per destination.

## How internet access is decided

The platform decides internet access per subnet and address family, from the subnet's own route table:

| The subnet's table has | Effect |
|---|---|
| `0.0.0.0/0` to the Internet Gateway | IPv4 traffic passes between the subnet and the internet, in both directions. |
| `0.0.0.0/0` to a NAT gateway | The same for IPv4. Outbound connections from instances without a Floating IP leave from the gateway's address. |
| `::/0` to the Internet Gateway | IPv6 traffic passes between the subnet and the internet, in both directions. See [IPv6 addresses](../vpcs/addressing.md#ipv6-addresses) for what works today. |
| No default route for a family | That family's traffic between the subnet and the internet is refused, in both directions. |

A subnet with no route table has no internet access for either family. Other subnets of the VPC don't change this: a private subnet stays private next to a public one, including for its instances' Floating IPs and IPv6 addresses. Traffic between subnets of the VPC doesn't depend on route tables.

A working IPv4 connection also needs a public source address. An instance gets one from its own Floating IP, or from a NAT gateway when its subnet's table routes `0.0.0.0/0` through one. An instance whose subnet has no IPv4 default route can't use its Floating IP: traffic to and from it is refused. An outbound connection the platform refuses fails at once with "administratively prohibited". These replies are rate-limited, so when an instance opens many refused connections at once, some of them time out instead of failing at once.

A NAT gateway default opens IPv4 like an Internet Gateway default does, in both directions. An instance with a Floating IP in a subnet whose table routes `0.0.0.0/0` through a NAT gateway is reachable from the internet on that Floating IP; the NAT gateway only gives instances without one their outbound address. What the subnet's table routes is what counts, not where the NAT gateway sits: a subnet routing through a NAT gateway reaches the internet even when the gateway's own subnet has no Internet Gateway default.

Access is decided by the packet's address. An instance whose interface has its [source-address check](../vpcs/network-interfaces.md#source-address-check) turned off can send from an address of another subnet, and its traffic is then treated as that subnet's.

## Change routes

Each route is a resource of its table. Add one with `create-route`, list them with `list-routes`, and remove one with `delete-route`. For example, to send a table's IPv4 internet traffic to the Internet Gateway:

```sh
origin network create-route --route-table <route-table-id> \
  --destination 0.0.0.0/0 --internet-gateway <internet-gateway-id>
```

To point the destination at another target, delete the route and create a new one:

```sh
origin network list-routes --route-table <route-table-id>
origin network delete-route --route-table <route-table-id> \
  --route <route-id> --yes
origin network create-route --route-table <route-table-id> \
  --destination 0.0.0.0/0 --nat-gateway <nat-gateway-id>
```

A change takes effect within a few seconds. Removing a subnet's default route also stops that family's connections between the subnet and the internet that are already open, including a transfer in progress.

## Associate a subnet with a table

A route table association points a subnet at a table. The table must belong to the subnet's VPC, and a subnet has at most one association:

```sh
origin network create-route-table-association --subnet <subnet-id> \
  --route-table <route-table-id>
```

To move a subnet to another table, remove its association and create a new one. The association's id is the route table's id:

```sh
origin network delete-route-table-association --subnet <subnet-id> \
  --route-table-association <route-table-id> --yes
```

## What is refused

- Deleting a VPC's main route table. It's removed only with the VPC.
- Two routes to the same destination in one table.
- A second route table association for a subnet that has one.
- Deleting a table that a route table association still names. Associate those subnets with another table first.
- A route that names an Internet Gateway of another VPC.
- A route that names a NAT gateway of another VPC, or one that no longer exists.
- Deleting a NAT gateway or an Internet Gateway while a route other than the main table's still names it.

## Related

- [Give a private subnet internet access with a NAT gateway](nat-gateways.md)
- [Create and delete an Internet Gateway](internet-gateways.md)
- [`create-route` reference](../reference/cli.md#create-route)
- [`create-route-table-association` reference](../reference/cli.md#create-route-table-association)
