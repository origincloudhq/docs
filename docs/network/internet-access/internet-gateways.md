---
id: internet-access-internet-gateways
title: Create and delete an Internet Gateway
nav_title: Internet Gateways
description: Create an Internet Gateway to connect a whole VPC to the internet, route subnets through it, and delete it again to make the VPC private.
page_type: task
parent: internet-access
nav_order: 30
tags: [networking, internet-access, cli]
last_reviewed: 2026-11-03
---

# Create and delete an Internet Gateway

An Internet Gateway connects a whole VPC to the internet, including subnets and instances you create after it. There is no per-subnet switch; you decide per subnet through route tables, Floating IPs and NAT gateways. A VPC has at most one Internet Gateway.

## Before you begin

- The `origin` CLI, logged in, with a default project, zone and region. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- The id of the VPC.
- Room in your Internet Gateway quota. See [Limits](../../platform/reference/limits.md#network).

## Create an Internet Gateway

1. Create the gateway for the VPC:

   ```sh
   origin network create-internet-gateway --vpc <vpc-id>
   ```

   The command is refused with `FAILED_PRECONDITION` if the VPC already has a gateway, and refused if your organization or project is at its Internet Gateway quota.

   Creating the gateway adds no route to a VPC you created. Only a VPC with a main route table, your default VPC, gets two default routes through the gateway added to that table: `0.0.0.0/0` and `::/0`.

2. Note the gateway's id from its `name`. The VPC's `internetGateway` field names it too:

   ```sh
   origin network list-internet-gateways --vpc <vpc-id>
   ```

3. Give each subnet that should reach the internet a route table with a default route through the gateway:

   ```sh
   origin network create-route --route-table <route-table-id> \
     --destination 0.0.0.0/0 --internet-gateway <internet-gateway-id>
   ```

   For the steps, see [Change routes](route-tables.md#change-routes) and [Associate a subnet with a table](route-tables.md#associate-a-subnet-with-a-table). In your default VPC, check the main table's routes instead: find it with `list-route-tables --vpc <vpc-id>`, its `main` field `true`, then:

   ```sh
   origin network list-routes --route-table <route-table-id>
   ```

The gateway makes internet access possible; it doesn't give it to any instance by itself. A subnet also needs a default route to the gateway, an instance needs a Floating IP or a NAT gateway route, and its network ACL and security groups must allow the traffic. See [Internet access](index.md).

The gateway also lets instances in different subnets of the VPC reach each other, because traffic between subnets goes through the VPC router that the gateway enables.

## Delete an Internet Gateway

1. Remove the routes through the gateway from every route table other than the main one. Deleting is refused while another table still routes through it. List a table's routes with `list-routes`, and remove one:

   ```sh
   origin network delete-route --route-table <route-table-id> \
     --route <route-id> --yes
   ```

2. Delete the gateway:

   ```sh
   origin network delete-internet-gateway \
     --internet-gateway <internet-gateway-id> --yes
   ```

   In your default VPC, the platform removes the main table's routes through the gateway for you.

3. Verify that `list-internet-gateways --vpc <vpc-id>` returns no gateway.

After deleting the gateway, nothing in the VPC reaches the internet, and instances in different subnets can no longer reach each other. If you create a new gateway later, the default VPC's main table gets new default routes, and other tables need routes that name the new gateway.

## Related

- [Route tables](route-tables.md)
- [`create-internet-gateway` reference](../reference/cli.md#create-internet-gateway)
- [`delete-internet-gateway` reference](../reference/cli.md#delete-internet-gateway)
