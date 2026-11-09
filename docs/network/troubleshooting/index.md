---
id: troubleshooting
title: Troubleshoot Network
nav_title: Troubleshooting
description: Fixes for common Network problems - no internet access, IPv6 errors, refused VPC, subnet and NAT gateway requests, and connections that hang.
page_type: troubleshooting
parent: home
nav_order: 60
tags: [networking, troubleshooting]
last_reviewed: 2026-11-05
---

# Troubleshoot Network

## An instance can't reach the internet

**Symptom:** Connections from an instance to internet addresses time out, or nothing on the internet can reach the instance.

**Cause:** Internet access needs every link of the path to be in place. One of them is missing.

**Resolution:** Check each item in order:

1. The VPC has an Internet Gateway: `origin network list-internet-gateways --vpc <vpc-id>`, or the VPC's `internetGateway` field. See [Create and delete an Internet Gateway](../internet-access/internet-gateways.md).
2. The instance has a way out. Either its network interface has a Floating IP (`origin network list-floating-ips` shows which interface each address reaches as `networkInterface`), or its subnet's route table has a `0.0.0.0/0` route to a NAT gateway. Without one of these, it has no internet access. See [Floating IPs](../internet-access/floating-ips.md) and [NAT gateways](../internet-access/nat-gateways.md).
3. The subnet has a route table, and it has a `0.0.0.0/0` route to the Internet Gateway or to a NAT gateway. Check the subnet's `routeTable` with `get-subnet`, and the table's routes with `list-routes --route-table <route-table-id>`. An empty `routeTable` means the subnet has no route table, so no internet access in either direction; associate one with `create-route-table-association`. Another subnet's table doesn't open this one. Creating an Internet Gateway for a VPC you created adds no route. See [Route tables](../internet-access/route-tables.md).
4. If the subnet has a network ACL, it has egress rules that allow the traffic to the internet, including replies to inbound connections. See [Network ACLs](../traffic-control/network-acls.md).
5. The instance's network interface has a security group association, and its groups allow the traffic. For inbound connections, a group needs an ingress rule for the port and the client's address range; the default group has them only for SSH, HTTP, HTTPS and ICMP. An interface you created starts in no security group and passes no traffic until you associate one. See [Security groups](../traffic-control/security-groups.md).
6. An instance launched with `origin compute create-instance` never gets an address from its subnet's auto-assign public IP setting; associate a Floating IP with its interface by hand. An instance whose launch created its interface in a subnet with the setting on always has one: if none could be assigned, the launch failed and the instance is `FAILED`. See [Default VPC](../vpcs/default-vpc.md#auto-assigned-public-ips).

## IPv6 connections to the internet fail or hang

**Symptom:** An instance trying to reach an internet address over IPv6 either gets an immediate ICMPv6 `administratively prohibited` error, which many clients report as `Permission denied`, or waits until the connection times out.

**Cause:** Instances can't reach the internet over IPv6. Which of the two you see depends on the VPC's IPv6 range, and on the subnet's route table: without a `::/0` route to the Internet Gateway, the connection is refused immediately.

**Resolution:** Let the client fall back to IPv4, or configure the guest to prefer IPv4. Don't retry over IPv6. See [VPC and subnet addressing](../vpcs/addressing.md#ipv6-addresses).

## Instances in different subnets can't reach each other

**Symptom:** Instances in the same subnet reach each other, but connections to instances in another subnet of the same VPC time out.

**Cause:** Traffic between subnets goes through the VPC router, which serves a VPC only while it has an Internet Gateway. If the VPC has one, a network ACL or security group may deny the traffic.

**Resolution:**

1. Create an Internet Gateway for the VPC if it has none. See [Create and delete an Internet Gateway](../internet-access/internet-gateways.md).
2. Check both subnets' network ACLs, if they have one: the source subnet needs an egress rule and the destination subnet an ingress rule, for both the request and the reply. See [Network ACLs](../traffic-control/network-acls.md).
3. Check the security groups of both instances.

## create-vpc without --ipv4-cidr-block is refused

**Symptom:** `create-vpc` fails with `no default private IPv4 range is available for another VPC in this organisation; specify an IPv4 CIDR for this VPC explicitly`.

**Cause:** The platform picks default ranges from 16 `/16` ranges, and your organization's VPCs already use them, or the random choice found no free one.

**Resolution:** Run `create-vpc` again with `--ipv4-cidr-block` and a private range between `/16` and `/28`. See [VPC and subnet addressing](../vpcs/addressing.md#the-vpcs-ipv4-range).

## A subnet or VPC delete is refused

**Symptom:** `delete-subnet` or `delete-vpc` fails, naming what's in the way.

**Cause:** An attached network interface or a NAT gateway is still in the subnet or VPC. `delete-vpc` is also refused while the VPC holds a subnet, an Internet Gateway, a security group, a network ACL or a route table you created. See [What a deletion removes](../vpcs/delete.md#what-a-deletion-removes).

**Resolution:**

1. For a network interface, terminate the instance that uses it. See [Terminate an instance](../../compute/instances/terminate.md).
2. For a NAT gateway, remove the routes that name it, then delete it. See [Delete a NAT gateway](../internet-access/nat-gateways.md#delete-a-nat-gateway).
3. For a VPC, delete what it still holds. See [Delete a VPC](../vpcs/delete.md#delete-a-vpc).
4. Run the delete again.

## A connection to a Floating IP from inside the VPC hangs

**Symptom:** An instance connects to the Floating IP of another instance, or to its own, and the connection hangs. The same connection from outside the platform works, or the connection works by private address.

**Cause:** One of two things:

- The server's security groups don't allow the caller's public address. Traffic through a Floating IP carries a public source address, which rules that name a security group don't match.
- The caller is in a different VPC from the Floating IP. A Floating IP is reachable from inside the platform only from its own VPC.

**Resolution:** Add an ingress rule for the caller's public address (its own Floating IP, or the Floating IP it calls), or connect by private address within the VPC. From another VPC, connect from outside the platform instead. See [Floating IPs](../internet-access/floating-ips.md#reaching-a-floating-ip-from-inside-its-vpc).

## create-nat-gateway is refused

**Symptom:** `create-nat-gateway` fails.

**Cause:** The message names one of these:

- `a nat gateway must live in a public subnet`: the subnet's route table has no default route to an Internet Gateway.
- `this floating ip is associated with a network interface`: the Floating IP is in use by an instance.
- `this floating ip already backs nat gateway`: each gateway needs its own Floating IP.
- [`PAYMENT_METHOD_REQUIRED`](../../platform/reference/errors.md#payment_method_required): your organization has no valid payment method.
- A quota message naming NAT gateways.

**Resolution:** Create the gateway in a subnet whose route table has a default route to the VPC's Internet Gateway, such as a subnet that uses the default VPC's main route table, or add that route to the subnet's table. A subnet with no route table isn't public. Use a Floating IP that's allocated and unassociated, or allocate a new one with `create-floating-ip`. See [NAT gateways](../internet-access/nat-gateways.md).

## A rule, route or association is refused with FAILED_PRECONDITION

**Symptom:** `create-acl-rule`, `create-security-group-rule`, `create-route` or a `create-…-association` command fails with `FAILED_PRECONDITION`.

**Cause:** What you add contradicts what's there: an ACL rule of the same direction already has that priority, the security group already has an identical rule, the route table already has a route to that destination, or the subnet, VPC, network interface or Floating IP already has that kind of association.

**Resolution:** Pick a free priority, or list the existing rules, routes or associations with the matching `list-` command and delete the one you replace first. See [How rules, routes and lists change](../traffic-control/replace-rule-sets.md#contradictions-are-refused).

## An update is refused without contacting the API

**Symptom:** An `update-` command, such as `update-security-group` or `update-dns-policy`, exits with status `2` and `the following required arguments were not provided`.

**Cause:** An update changes only what its flags name, so it needs at least one. Rules aren't changed with an `update-` command: they're resources of their own.

**Resolution:** Give the flag of what you change, such as `--tag` or `--no-tags`. To change a group's or ACL's rules, use `create-security-group-rule`, `create-acl-rule` and their `delete-` commands. See [How rules, routes and lists change](../traffic-control/replace-rule-sets.md).
