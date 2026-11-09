---
id: traffic-control-replace-rule-sets
title: How rules, routes and lists change
nav_title: Rule and list changes
description: Rules, routes and associations are resources you add and remove one at a time; tags and DNS upstream servers are replaced as a whole. Learn how each kind of change works.
page_type: concept
parent: traffic-control
nav_order: 30
tags: [networking, security, dns, cli]
last_reviewed: 2026-11-03
---

# How rules, routes and lists change

Network has two kinds of change: resources you add and remove one at a time, and lists on a resource that an update replaces as a whole.

## Rules, routes and associations are resources

Network ACL rules, security group rules, route table routes, and the associations between resources are resources of their own. You add one with its `create-` command and remove it with its `delete-` command, and the others stay as they are:

| What | Add | Remove |
|---|---|---|
| A network ACL rule | `create-acl-rule` | `delete-acl-rule` |
| A security group rule | `create-security-group-rule` | `delete-security-group-rule` |
| A route | `create-route` | `delete-route` |
| A subnet's route table or network ACL | `create-route-table-association`, `create-acl-association` | `delete-route-table-association`, `delete-acl-association` |
| A network interface's security group | `create-security-group-association` | `delete-security-group-association` |
| A Floating IP's network interface | `create-floating-ip-association` | `delete-floating-ip-association` |
| A VPC's DNS policy | `create-dns-policy-association` | `delete-dns-policy-association` |

None of them can be changed in place. To change one, add the new one and remove the old one; for an association, which a subnet, interface or VPC has at most one of, remove the old one first.

## Lists on a resource are replaced as a whole

An `update-` command changes only what its flags name, and needs at least one; without any, the CLI refuses it before it sends anything. A list it names is replaced as a whole:

- `--tag` replaces all of a resource's tags, so give every tag to keep. `--no-tags` removes them all. See [Name and tag network resources](../vpcs/name-and-tag.md).
- `--upstream-server` on `update-dns-policy` replaces all of a DNS policy's upstream servers. `--no-upstream-servers` removes them all. See [Manage DNS policies](../dns/manage-policies.md).

An empty list is stated by name, with its `--no-` flag, never by leaving a flag out. Giving both forms, such as `--tag` together with `--no-tags`, is refused.

The GraphQL API's `updateAclRules`, `updateSecurityGroupRules`, `updateRouteTableRoutes`, `updateDnsPolicy` and `setNetworkInterfaceSecurityGroups` mutations replace a whole rule, route, server or security group list in one call. Read the current list first, and send every member to keep.

## Booleans are explicit

`--relay-enabled`, `--auto-assign-public-ip`, `--source-address-check` and `--same-group` take `true` or `false` rather than being on when present. Leaving one off an update leaves the setting as it is; it can't turn a setting off by accident.

## Contradictions are refused

A change that would contradict what's already there is refused with `FAILED_PRECONDITION`: a security group rule identical to one the group has, an ACL rule at a priority another rule of its direction has, a second route to a destination the table already routes, or a second association for a subnet, VPC or Floating IP that has one. A relaying DNS policy needs at least one upstream server.

## Related

- [Security groups](security-groups.md)
- [Network ACLs](network-acls.md)
- [Manage DNS policies](../dns/manage-policies.md)
- [Route tables](../internet-access/route-tables.md#change-routes)
