---
id: internet-access-nat-gateways
title: Give a private subnet internet access with a NAT gateway
nav_title: NAT gateways
description: Create a NAT gateway so instances without a Floating IP can reach the internet over IPv4, route a private subnet through it, and delete it again.
page_type: task
parent: internet-access
nav_order: 40
tags: [networking, internet-access, cli, billing]
last_reviewed: 2026-11-03
---

# Give a private subnet internet access with a NAT gateway

A NAT gateway gives every instance in a private subnet outbound IPv4 access through one shared address. Instances behind it reach the internet as the gateway's address and aren't reachable from the internet. Use it for instances that only need to fetch packages or call external services, instead of giving each one a Floating IP.

A NAT gateway translates IPv4 only. It's billed per hour, in addition to the Floating IP it uses.

## Before you begin

- The `origin` CLI, logged in, with a default project, zone and region. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region). A NAT gateway lives in a zone, in a subnet of that zone.
- A VPC with an Internet Gateway. See [Create and delete an Internet Gateway](internet-gateways.md).
- A public subnet for the gateway: one whose route table has a default route to the Internet Gateway. In your default VPC, every subnet that uses the main table is public; in a VPC you created, add the default route to the subnet's own table.
- A private subnet for your instances, associated with a route table you created. See [Route tables](route-tables.md).
- A payment method on your organization. Without one, allocating the Floating IP and creating the gateway are refused with [`PAYMENT_METHOD_REQUIRED`](../../platform/reference/errors.md#payment_method_required).

## Create the NAT gateway

1. Allocate a Floating IP for the gateway, note its id, and leave it unassociated:

   ```sh
   origin network create-floating-ip --tag origin:name=nat
   ```

   The address stays yours when you delete the gateway later.

2. Create the gateway in the public subnet, and note its id:

   ```sh
   origin network create-nat-gateway --subnet <public-subnet-id> \
     --floating-ip <floating-ip-id>
   ```

   The command is refused if the subnet isn't public, if the Floating IP is associated with a network interface, if the Floating IP already backs another NAT gateway, or if you're at your NAT gateway quota.

## Route the private subnet through the gateway

1. List the routes of the private subnet's route table:

   ```sh
   origin network list-routes --route-table <route-table-id>
   ```

   If it already has a `0.0.0.0/0` route, remove it with `delete-route`: a table holds one route per destination.

2. Add a `0.0.0.0/0` route to the gateway:

   ```sh
   origin network create-route --route-table <route-table-id> \
     --destination 0.0.0.0/0 --nat-gateway <nat-gateway-id>
   ```

   A NAT gateway route must have the destination `0.0.0.0/0`. A `::/0` route to a NAT gateway is refused. The route table is regional and the NAT gateway zonal: if the gateway isn't in your default zone, give its whole `name`.

3. If the subnet doesn't use this table, associate it:

   ```sh
   origin network create-route-table-association \
     --subnet <private-subnet-id> --route-table <route-table-id>
   ```

4. Verify from an instance in the private subnet that it reaches the internet as the gateway's address, for example by calling a service that shows the caller's public address. The change applies to new connections within a few seconds.

An instance in the private subnet that has its own Floating IP keeps using that address, not the gateway's.

## Delete a NAT gateway

1. Remove every route that names the gateway, in every route table. Deleting is refused while any route still names it.

   ```sh
   origin network delete-route --route-table <route-table-id> \
     --route <route-id> --yes
   ```

2. Delete the gateway:

   ```sh
   origin network delete-nat-gateway --nat-gateway <nat-gateway-id> --yes
   ```

3. Verify that `list-nat-gateways` no longer shows it. Release the Floating IP with `delete-floating-ip --floating-ip <floating-ip-id> --yes` if you don't need it any more; billing for it continues until you do.

A NAT gateway is never deleted with its subnet or VPC. Deleting a subnet or VPC is refused while a NAT gateway lives in it.

## Related

- [Route tables](route-tables.md)
- [Floating IPs](floating-ips.md)
- [`create-nat-gateway` reference](../reference/cli.md#create-nat-gateway)
- [`delete-nat-gateway` reference](../reference/cli.md#delete-nat-gateway)
- [Troubleshoot Network](../troubleshooting/index.md#create-nat-gateway-is-refused)
