---
id: traffic-control-security-groups
title: Security groups
description: Security groups are stateful firewalls on each network interface. Learn how rules and group references work, what the default group allows, and how to add rules and associate groups with interfaces.
page_type: concept
parent: traffic-control
nav_order: 10
tags: [networking, security]
last_reviewed: 2026-11-03
---

# Security groups

A security group is a firewall for a network interface. Its ingress rules say what may reach the instance and its egress rules say what the instance may send, by protocol, port, and a peer: an IP range or another security group in the same VPC. Security groups apply to every packet to or from the interface, including traffic between instances in the same subnet.

## How rules are evaluated

Security groups are stateful. Once a rule allows a connection, its reply traffic is allowed automatically, without a rule in the other direction. Anything no rule allows is denied.

Each rule has:

- A direction: `INGRESS` for traffic the interface admits, `EGRESS` for traffic it sends.
- A protocol: `ALL`, `TCP`, `UDP` or `ICMP`. `ICMP` means ICMP for an IPv4 peer and ICMPv6 for an IPv6 peer, all message types.
- Ports, for `TCP` and `UDP` only: `--first-port` and `--last-port`. A single port is `--first-port 22` with `--last-port` left at `0`, a range is `--first-port 8000 --last-port 8100`, and every port is both left at `0`. Any other spelling of the same ports is refused with a message naming the one to use. `ALL` and `ICMP` rules have no ports.
- A peer: an IP range with `--cidr-block`, such as `203.0.113.0/24` or `0.0.0.0/0`; another security group of the same VPC with `--peer-security-group`; or the group's own members with `--same-group true`.
- An optional `--description` of what the rule is for.

An interface can carry several groups, each through a security group association; see [Network interfaces](../vpcs/network-interfaces.md). An interface in no security group passes no traffic except address resolution. Address resolution (ARP and IPv6 neighbor discovery) always passes, so an interface can always be found by its neighbors. ICMP that belongs to a connection already allowed, such as the reply to the instance's own ping or a "fragmentation needed" message, passes too; an `ICMP` rule is what allows new ICMP, such as a ping from outside.

An instance is never reachable without its security groups. Until the rules of every group on its interface are in place, usually within a few seconds of the start, it passes no traffic except address resolution.

## Rules that name a security group

A rule whose peer is a security group matches the private addresses of every interface that currently carries that group, on any machine. The match follows membership as you launch and terminate instances and change the groups an interface carries. A group with no members matches nothing.

Letting a group's own members in, with `--same-group true`, is the usual way to let the members of a cluster talk to each other. A rule can name only a group in the same VPC; naming a group of another VPC is refused.

Group references match private addresses only. Traffic that arrives through a Floating IP, including from an instance in the same VPC, carries a public source address and doesn't match. See [Floating IPs](../internet-access/floating-ips.md#reaching-a-floating-ip-from-inside-its-vpc).

## Default security group

Your project's default VPC has a default security group, its `vpcDefault` field `true`. A launch through the GraphQL API without a subnet puts the instance's interface in it. An interface you create with `create-network-interface` starts in no group, in any VPC, and passes no traffic except address resolution until you associate a group with it. A VPC you create has no default group: create one with `create-security-group`.

The default security group has:

- An ingress rule that allows all traffic from members of the group itself.
- Ingress rules that allow SSH (TCP 22), HTTP (TCP 80), HTTPS (TCP 443) and ICMP from anywhere, each over IPv4 (`0.0.0.0/0`) and IPv6 (`::/0`).
- Two egress rules that allow all outbound IPv4 and IPv6 traffic.

So an instance launched with the default group answers ping and accepts SSH and web traffic from the internet as soon as it has a public address, and instances that share the group can reach each other on any port. Every other port is closed to anything outside the group until you add a rule.

SSH is open to everyone because instances accept only key-based logins: every launch takes a key pair, and password logins are refused. To allow SSH from one address range only, replace the two SSH rules as shown below.

## Change a security group's rules

Each rule is a resource of its group. Add one with `create-security-group-rule`, list them with `list-security-group-rules`, and remove one with `delete-security-group-rule`. There is no command to change a rule in place: add the new rule, then remove the old one.

For example, to restrict the default group's SSH to one range:

1. List the group's rules, and note the ids of the two SSH rules, the ones with `protocol` `TCP` and `firstPort` `22`:

   ```sh
   origin network list-security-group-rules --security-group <security-group-id>
   ```

2. Add a rule for the range you allow:

   ```sh
   origin network create-security-group-rule --security-group <security-group-id> \
     --direction INGRESS --protocol TCP --first-port 22 \
     --cidr-block 198.51.100.0/24 --description "SSH from the office"
   ```

3. Remove the two rules that allow SSH from anywhere:

   ```sh
   origin network delete-security-group-rule --security-group <security-group-id> \
     --rule <rule-id> --yes
   ```

A rule identical to one the group already has, `--description` included, is refused with `FAILED_PRECONDITION`. A group holds at most 120 rules by default, both directions together.

A change applies to every instance whose interface carries the group, usually within a few seconds. You don't restart the instance.

## Change an interface's security groups

A security group association puts an interface in a group, also while it's attached to an instance. Every group must be in the interface's VPC.

```sh
origin network create-security-group-association \
  --network-interface <network-interface-id> \
  --security-group <web-security-group-id>
```

To take the interface out of a group, delete the association. Its id is the security group's id:

```sh
origin network delete-security-group-association \
  --network-interface <network-interface-id> \
  --security-group-association <ssh-security-group-id> --yes
```

An interface without any association passes no traffic except replies to its own traffic and address resolution. Find an instance's interface with `origin compute get-instance`, and the groups it carries with `list-security-group-associations --network-interface <network-interface-id>`. The change reaches a running instance within a few seconds, without a restart. Rules in other groups that name an added or removed group as their peer follow it too.

## Create and delete security groups

`create-security-group` adds a group to a VPC with no rules, so it allows nothing in either direction until you add rules. In a VPC you create, the groups you create are the only ones; use several when different workloads need different rules.

A VPC's default security group can't be deleted on its own; it goes with the VPC. Any other group can't be deleted while a security group association still names it. Delete those associations first, or delete the interfaces. Deleting a group deletes its rules.

```sh
origin network delete-security-group --security-group <security-group-id> --yes
```

## Related

- [Network ACLs](network-acls.md)
- [`create-security-group-rule` reference](../reference/cli.md#create-security-group-rule)
- [`create-security-group-association` reference](../reference/cli.md#create-security-group-association)
- [`create-security-group` reference](../reference/cli.md#create-security-group)
