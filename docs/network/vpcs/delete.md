---
id: vpcs-delete
title: Delete a subnet or VPC
description: Delete a subnet or a whole VPC, clear what blocks the deletion, and learn what is removed with it and what happens to its address ranges.
page_type: task
parent: vpcs
nav_order: 50
tags: [networking, vpc, cli]
last_reviewed: 2026-11-03
---

# Delete a subnet or VPC

You can delete a single subnet, or a VPC once you've deleted what it holds. Both are refused while something still uses the network, and the refusal names what is in the way.

## Before you begin

- The `origin` CLI, logged in, with a default project, zone and region. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- The id of the subnet or VPC.
- Terminate the instances in it, or move your workload elsewhere. See [Terminate an instance](../../compute/instances/terminate.md).
- Delete every NAT gateway in it. A NAT gateway holds one of your Floating IPs and is billed until you delete it, so it's never deleted with its subnet or VPC. See [NAT gateways](../internet-access/nat-gateways.md#delete-a-nat-gateway).

## What a deletion removes

Deleting a subnet removes the subnet with its route table and network ACL associations and any unattached network interfaces in it. It's refused while an interface in it is attached to an instance, or a NAT gateway lives in it.

`delete-vpc` deletes only a VPC that holds nothing you created. It's refused, naming what's left, while the VPC has a subnet, an Internet Gateway, a security group, a network ACL or a route table. Delete those first, in this order: subnets, which takes their associations and unattached network interfaces with them, then route tables with their routes, the Internet Gateway, network ACLs and security groups. What the platform created with your project's default VPC doesn't count: its default security group, default ACL, main route table and DNS policy association are deleted with it, and so is any VPC's DNS policy association.

The GraphQL API's `deleteVpc` mutation instead removes every subnet in the VPC, its route tables, network ACLs, security groups and Internet Gateway with it.

Neither deletes a DNS policy, because a policy belongs to the project and can serve other VPCs. Delete the policy separately if you no longer need it; see [Manage DNS policies](../dns/manage-policies.md).

## Delete a subnet

1. Delete the subnet:

   ```sh
   origin network delete-subnet --subnet <subnet-id> --yes
   ```

   If the command is refused, the message names the network interface or NAT gateway that blocks it. Remove that and run the command again.

2. Verify that the subnet no longer appears:

   ```sh
   origin network list-subnets --vpc <vpc-id>
   ```

Deleting a subnet doesn't return its range to the VPC, even if it was the VPC's last subnet. A new subnet in the same VPC gets a different range.

## Delete a VPC

1. Delete what the VPC still holds. List each kind by VPC:

   ```sh
   origin network list-subnets --vpc <vpc-id>
   origin network list-route-tables --vpc <vpc-id>
   origin network list-acls --vpc <vpc-id>
   origin network list-security-groups --vpc <vpc-id>
   origin network list-internet-gateways --vpc <vpc-id>
   ```

   Delete each with its `delete-` command and `--yes`, in the order above. An Internet Gateway can be deleted once no route names it; see [Create and delete an Internet Gateway](../internet-access/internet-gateways.md#delete-an-internet-gateway).

2. Delete the VPC:

   ```sh
   origin network delete-vpc --vpc <vpc-id> --yes
   ```

   If the command is refused, the message names what the VPC still holds.

3. Verify that the VPC no longer appears:

   ```sh
   origin network list-vpcs
   ```

## What happens to the address ranges

The VPC's private IPv4 range is free for your next VPC right away. The VPC's IPv6 range goes back to the platform, which holds it back for one day before assigning it to another VPC. That gives DNS records and allow-lists that still name the old addresses time to expire.

## Other "still in use" refusals

The same rule applies elsewhere in Network. Each of these is refused, with a message naming the reason, until you remove the dependency:

- Deleting a network interface that's attached, or that a Floating IP is still associated with
- Deleting a network ACL that a subnet's ACL association still names
- Deleting a security group that a network interface's security group association still names
- Deleting a route table that a subnet's route table association still names
- Deleting an Internet Gateway or a NAT gateway that a route still names
- Deleting a DNS policy that a VPC's DNS policy association still names, or the project's default policy
- Deleting a Floating IP that's still associated, or that a NAT gateway uses

## Related

- [`delete-subnet` reference](../reference/cli.md#delete-subnet)
- [`delete-vpc` reference](../reference/cli.md#delete-vpc)
- [Troubleshoot Network](../troubleshooting/index.md#a-subnet-or-vpc-delete-is-refused)
