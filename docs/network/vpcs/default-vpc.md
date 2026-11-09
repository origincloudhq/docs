---
id: vpcs-default-vpc
title: Default VPC
description: The platform creates a default VPC for a project the first time an instance is launched without a subnet. Learn what it contains, how to use it from the CLI, and how auto-assigned public IPs work.
page_type: concept
parent: vpcs
nav_order: 20
tags: [networking, vpc, internet-access]
last_reviewed: 2026-11-05
---

# Default VPC

A project's default VPC is ready to launch into: the platform builds it with a subnet, an Internet Gateway, routing and filtering in place. The platform creates it the first time an instance is launched in the project without naming a subnet, through the GraphQL API's `launchInstance`. Every later launch without a subnet reuses the same default VPC and its subnet.

`origin compute create-instance` always names a network interface you created, so it never creates the default VPC. Once your project has one, you can create network interfaces in its subnet and launch with them. Its `projectDefault` field is `true`:

```sh
origin network list-vpcs
```

A VPC you create with `create-vpc` never becomes a project's default VPC.

## What the default VPC contains

A VPC you create is empty. The default VPC comes with:

- A subnet with auto-assign public IP turned on.
- An Internet Gateway, from the start.
- A main route table, its `main` field `true`, with default routes to the Internet Gateway. The default VPC's subnet uses it, and so does every subnet you create in the VPC until you associate it with another table.
- A default network ACL that allows all traffic, its `vpcDefault` field `true`. The default VPC's subnet uses it, and so does every subnet you create in the VPC.
- A default security group, its `vpcDefault` field `true`.
- An association with the project's default DNS policy.

The default security group, ACL and main route table can't be deleted on their own; they go with the VPC. Like any other VPC, the default VPC has a random private `/16` IPv4 range and an IPv6 range. For the address rules, see [VPC and subnet addressing](addressing.md).

The default security group admits SSH, HTTP, HTTPS and ICMP from anywhere, and all traffic from other members of the same group. A launch without a subnet puts the instance's interface in it. An interface you create with `create-network-interface` starts in no security group, in the default VPC too: associate the default group with it, or one of your own, before you launch. See [Security groups](../traffic-control/security-groups.md#default-security-group).

## Auto-assigned public IPs

A subnet's auto-assign public IP setting decides whether an instance gets a Floating IP automatically when its launch creates its network interface in the subnet, as a launch without a subnet does. The default VPC's subnet has it on; you can turn it on or off for any subnet. See [Create a VPC and subnets](create.md#change-a-subnets-auto-assign-setting).

An instance launched with `origin compute create-instance` uses an existing interface, which gets no address this way, whatever the setting. Associate a Floating IP with the interface instead; see [Floating IPs](../internet-access/floating-ips.md).

When the setting applies, the public address is part of the network interface the launch creates: the interface is created with a Floating IP already associated, and the address is released when the interface is deleted with the instance. An auto-assigned Floating IP has `autoAssigned` set to `true`, and you can't disassociate or release it yourself. To keep a public address across instances, allocate a Floating IP yourself instead; the platform never releases an address you allocated.

An instance never runs without the address its subnet promises. If no public address can be assigned, because none is free in the zone or the public IP quota is used up, the launch fails: the instance turns `FAILED` with a status reason that says which, and it gets no network interface and no address. Terminate the instance, then launch again later, release a Floating IP you no longer need, or launch into a subnet with the setting off. See [Status reasons](../../compute/reference/status-reasons.md#the-network-interface-could-not-be-created).

Changing the setting affects only instances launched afterwards. Turning it on doesn't give a Floating IP to running instances, and turning it off doesn't take one away.

## When to use your own VPC instead

Create your own VPC when you want private-only instances, your own address range, or full control of its routing and filtering. You build its subnets, route tables, ACLs and security groups yourself; see [Create a VPC and subnets](create.md). For the launch command, see [Launch an instance](../../compute/instances/launch.md).

## Related

- [Create a VPC and subnets](create.md)
- [Internet access](../internet-access/index.md)
