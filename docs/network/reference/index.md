---
id: reference
title: Network reference
nav_title: Reference
description: Where to find every origin network CLI command and the REST API's resources and paths for VPCs, subnets, interfaces, gateways, routing and traffic control.
page_type: reference
parent: home
nav_order: 50
tags: [networking, reference, cli, api]
last_reviewed: 2026-11-25
---

# Network reference

Network has two reference surfaces: the `origin network` CLI commands and the network REST API. Both cover the same resources, with a command or a method for each rule, route and association. For concepts and procedures, start at [What is Origin Cloud Network?](../index.md).

## CLI commands

[`origin network` commands](cli.md) lists every command with its flags. For options that apply to every command, see [Global options](../../platform/reference/cli.md#global-options); for how `--project`, `--zone` and `--region` default, see [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).

## Names

A network resource's `name` is its relative name, such as `projects/<project>/regions/<region>/vpcs/<vpc-id>`; the commands that act on one take it, or its id. Its full name is `//network.origincloudapis.eu/` followed by its `name`. Every reference to another resource is a full name, in what the CLI and REST API take and in what they show:
- `vpc`, `subnet`, `routeTable`, `acl`, `resolverPolicy`, `internetGateway`, `natGateway`, `floatingIp`, `networkInterface`, `securityGroup`(`s`) and `peerSecurityGroup`;
- an interface's `instance`, on the compute service;
- the `vpc` and `subnet` filters of the list commands;
- an operation's `target`.

A relative name or an id there is refused with `BAD_REQUEST`. `creator` is the full name of the principal that created the resource, such as `//iam.origincloudapis.eu/users/<user-id>`, or a platform service's, `//iam.origincloudapis.eu/services/<service>`, for what the platform created.

## REST API

The Network API answers at `https://network.origincloudapis.eu`. It's a preview (`v1beta1`): names and fields may still change. Requests and responses are JSON with lower camel case field names. Every request carries an access token; see [Use the REST APIs](../../platform/access/api.md). A method that changes a resource returns a long-running operation. A collection supports `GET` to list and `POST` to create; a resource's name supports `GET`, `PATCH` where it has changeable fields, and `DELETE`. Regional resources sit under `/v1beta1/projects/<project-id>/regions/<region>/`, zonal ones under `/v1beta1/projects/<project-id>/zones/<zone>/`.

| Resource | Collection, below the region or zone |
|---|---|
| VPC | `vpcs` |
| Resolver policy association | `vpcs/<vpc-id>/resolverPolicyAssociations` |
| Resolver policy | `resolverPolicies`; `POST <name>:setDefault` makes one the default |
| Internet Gateway | `internetGateways` |
| Route table | `routeTables` |
| Route | `routeTables/<route-table-id>/routes` |
| Network ACL | `acls` |
| ACL rule | `acls/<acl-id>/rules` |
| Security group | `securityGroups` |
| Security group rule | `securityGroups/<security-group-id>/rules` |
| Subnet | `subnets` |
| Subnet's ACL association | `subnets/<subnet-id>/aclAssociations` |
| Subnet's route table association | `subnets/<subnet-id>/routeTableAssociations` |
| Network interface | `networkInterfaces` |
| Interface's security group association | `networkInterfaces/<interface-id>/securityGroupAssociations` |
| NAT gateway | `natGateways` |
| Floating IP | `floatingIps` |
| Floating IP association | `floatingIps/<floating-ip-id>/associations` |

VPCs, resolver policies and their associations, Internet Gateways, route tables, routes, ACLs, ACL rules, security groups and their rules are regional. Subnets, interfaces, NAT gateways, Floating IPs and their associations are zonal, as in the CLI.

## Errors and limits

- [Errors](../../platform/reference/errors.md)
- [Limits](../../platform/reference/limits.md#network)
