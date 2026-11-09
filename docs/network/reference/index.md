---
id: reference
title: Network reference
nav_title: Reference
description: Where to find every origin network CLI command and every GraphQL query and mutation in the network namespace of the API.
page_type: reference
parent: home
nav_order: 50
tags: [networking, reference, cli, api]
last_reviewed: 2026-11-03
---

# Network reference

Network has two reference surfaces: the `origin network` CLI commands and the `network` namespace of the GraphQL API. Both cover the same resources; the CLI has a command for each rule, route and association, where the GraphQL API replaces whole lists. For concepts and procedures, start at [What is Origin Cloud Network?](../index.md).

## CLI commands

[`origin network` commands](cli.md) lists every command with its flags. For options that apply to every command, see [Global options](../../platform/reference/cli.md#global-options); for how `--project`, `--zone` and `--region` default, see [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).

## GraphQL queries

All queries are fields of `network` on the root query type. For how to call the API, see [API access](../../platform/access/api.md).

| Query | Returns |
|---|---|
| `vpcs` | Every VPC in a project. |
| `vpc` | One VPC by URN. |
| `subnets` | Every subnet in a project. |
| `subnet` | One subnet by URN. |
| `networkInterfaces` | Every network interface in a project. |
| `networkInterface` | One network interface by URN. |
| `internetGateway` | A VPC's Internet Gateway, if it has one. |
| `routeTables` | Every route table in a project. |
| `routeTable` | One route table by URN. |
| `natGateways` | Every NAT gateway in a project. |
| `floatingIps` | Every Floating IP in a project. |
| `floatingIp` | One Floating IP by URN. |
| `acls` | Every network ACL in a project. |
| `acl` | One network ACL by URN. |
| `securityGroups` | Every security group in a project. |
| `securityGroup` | One security group by URN. |
| `dnsPolicies` | Every DNS policy in a project. |
| `dnsPolicy` | One DNS policy by URN. |

## GraphQL mutations

All mutations are fields of `network` on the root mutation type.

| Mutation | Does |
|---|---|
| `createVpc` | Creates an empty VPC: no subnet, route table, ACL or security group. |
| `deleteVpc` | Deletes a VPC and everything it owns. |
| `createSubnet` | Adds a subnet to a VPC. |
| `deleteSubnet` | Deletes a subnet. |
| `updateSubnetAcl` | Assigns a network ACL to a subnet. |
| `updateSubnetAutoAssignPublicIp` | Turns automatic Floating IPs for a subnet on or off. |
| `createNetworkInterface` | Creates a standalone network interface in a subnet. |
| `deleteNetworkInterface` | Deletes a standalone network interface. |
| `setNetworkInterfaceSourceAddressCheck` | Turns the source-address check on or off for a network interface. |
| `setNetworkInterfaceSecurityGroups` | Replaces the security groups a network interface carries. |
| `attachInternetGateway` | Attaches an Internet Gateway to a VPC. |
| `detachInternetGateway` | Detaches a VPC's Internet Gateway. |
| `createRouteTable` | Creates a route table in a VPC. |
| `updateRouteTableRoutes` | Replaces a route table's routes. |
| `associateRouteTable` | Points a subnet at a route table. |
| `deleteRouteTable` | Deletes a route table. |
| `createNatGateway` | Creates a NAT gateway in a public subnet. |
| `deleteNatGateway` | Deletes a NAT gateway. |
| `allocateFloatingIp` | Allocates a Floating IP to a project. |
| `associateFloatingIp` | Associates a Floating IP with a network interface. |
| `disassociateFloatingIp` | Removes a Floating IP's association. |
| `releaseFloatingIp` | Releases a Floating IP. |
| `createAcl` | Creates a network ACL in a VPC. |
| `updateAclRules` | Replaces a network ACL's rules. |
| `deleteAcl` | Deletes a network ACL. |
| `createSecurityGroup` | Creates a security group in a VPC, optionally with initial rules. |
| `updateSecurityGroupRules` | Replaces a security group's ingress and egress rules. |
| `deleteSecurityGroup` | Deletes a security group. |
| `createDnsPolicy` | Creates a DNS policy in a project. |
| `updateDnsPolicy` | Replaces a DNS policy's relaying setting and upstream servers. |
| `attachDnsPolicy` | Attaches a DNS policy to a VPC. |
| `setDefaultDnsPolicy` | Makes a DNS policy the project's default. |
| `deleteDnsPolicy` | Deletes a DNS policy. |

## Errors and limits

- [Errors](../../platform/reference/errors.md)
- [Limits](../../platform/reference/limits.md#network)
