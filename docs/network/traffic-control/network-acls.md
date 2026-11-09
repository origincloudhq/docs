---
id: traffic-control-network-acls
title: Network ACLs
description: Network ACLs are stateless, ordered rule lists for a subnet. Learn how rules are evaluated, which traffic they apply to, and how to create one and associate it with a subnet.
page_type: concept
parent: traffic-control
nav_order: 20
tags: [networking, security]
last_reviewed: 2026-11-03
---

# Network ACLs

A network ACL is a list of allow and deny rules for a subnet, by direction, protocol, port and address range. A subnet uses at most one ACL, through its ACL association, and its rules apply to every instance in the subnet regardless of its security groups. A subnet with no ACL isn't filtered at its edge; its instances' security groups still apply. ACLs are enforced at each instance's network interface, so they apply to every packet that crosses the subnet's boundary, in any VPC, whether or not it has an Internet Gateway.

> **Note:** A network ACL doesn't filter traffic between instances in the same subnet, whether or not they run on the same machine. To control that traffic, use [security groups](security-groups.md).

## Where ACLs are enforced

An ACL applies to traffic between an instance in its subnet and an address outside that subnet:

| Traffic | ACL rules that apply |
|---|---|
| Between two instances in the same subnet | None |
| From subnet A to subnet B of the same VPC | Egress rules of A's ACL, then ingress rules of B's ACL |
| From a subnet to the internet | Egress rules of the subnet's ACL |
| From the internet to a subnet | Ingress rules of the subnet's ACL |

ACLs are stateless, so this applies to reply traffic too. A reply from subnet B to subnet A needs an egress rule in B's ACL and an ingress rule in A's ACL. A reply from a subnet to an internet client needs an egress rule in the subnet's ACL, and the replies an instance receives to its own outbound connections need an ingress rule.

A subnet with no ACL contributes no rules: traffic from subnet A to a subnet B with no ACL passes A's egress rules only.

Traffic between an instance and the VPC's DNS resolver or the instance metadata service isn't filtered by ACLs.

## How rules are evaluated

Each rule has a direction, a priority, a protocol, ports, an address range and an action:

| Field | Values |
|---|---|
| `--direction` | `INGRESS` (traffic entering the subnet) or `EGRESS` (traffic leaving it). |
| `--priority` | The rule's place in its direction, from `1`. Lower numbers are evaluated first. |
| `--protocol` | `ALL`, `TCP`, `UDP` or `ICMP`. `ICMP` means ICMP when the range is IPv4 and ICMPv6 when it is IPv6, all message types. |
| `--first-port`, `--last-port` | For `TCP` and `UDP` only. A single port is `--first-port` with `--last-port` left at `0`, a range is a `--first-port` below `--last-port`, and every port is both left at `0`. Any other spelling of the same ports is refused with a message naming the one to use. |
| `--cidr-block` | For `INGRESS`, the address range the traffic comes from. For `EGRESS`, the range it goes to. |
| `--action` | `ACCEPT` or `DROP`. |

The first rule that matches decides. Traffic that matches no rule is denied. Two rules of one direction at the same priority are refused with `FAILED_PRECONDITION`. An ACL holds at most 40 rules by default, both directions together. A rule matches one address family, so allowing both IPv4 and IPv6 takes one rule for `0.0.0.0/0` and one for `::/0`.

## The default ACL

Your project's default VPC has a default ACL, its `vpcDefault` field `true`, and every new subnet in that VPC is associated with it. It allows all traffic in both directions and both address families, with four rules at priorities 500 to 530. Add and remove its rules, or create more ACLs when subnets need different rules.

A VPC you create has no default ACL. Its subnets start with no ACL, and their `acl` is empty, until you associate one.

A VPC's default ACL can't be deleted on its own; it goes with the VPC.

## Create and assign a network ACL

`create-acl` adds an ACL with no rules to a VPC, so it drops everything until you add rules. Each rule is a resource of its ACL: add one with `create-acl-rule`, list them with `list-acl-rules`, and remove one with `delete-acl-rule`. For example, to allow HTTPS in from anywhere and everything out:

```sh
origin network create-acl --vpc <vpc-id>
origin network create-acl-rule --acl <acl-id> --direction INGRESS \
  --priority 100 --protocol TCP --first-port 443 \
  --cidr-block 0.0.0.0/0 --action ACCEPT
origin network create-acl-rule --acl <acl-id> --direction EGRESS \
  --priority 200 --protocol ALL --cidr-block 0.0.0.0/0 --action ACCEPT
```

Then associate a subnet with it. The ACL must belong to the subnet's VPC, a subnet has at most one ACL association, and the change applies to the subnet's traffic without recreating anything.

```sh
origin network create-acl-association --subnet <subnet-id> --acl <acl-id>
```

To move a subnet to another ACL, or leave it unfiltered, delete its association. The association's id is the ACL's id:

```sh
origin network delete-acl-association --subnet <subnet-id> \
  --acl-association <acl-id> --yes
```

There is no command to change a rule in place: add the new rule at a free priority, then delete the old one. An ACL other than the default can't be deleted while an ACL association names it; deleting it deletes its rules.

## Related

- [Security groups](security-groups.md)
- [Traffic control](index.md)
- [`create-acl-rule` reference](../reference/cli.md#create-acl-rule)
- [`create-acl-association` reference](../reference/cli.md#create-acl-association)
