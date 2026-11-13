---
id: tags
title: Tags
description: Tags are key-value labels on a resource. Learn which resources take them, how origin:name names one, and the limits on keys and values.
page_type: concept
parent: home
nav_order: 35
tags: [tags, networking, compute, storage]
last_reviewed: 2026-11-13
---

# Tags

A tag is a key-value label on a resource. Tags change how a resource is shown and found, never how it behaves: no tag opens a port, protects a resource from deletion or changes what it costs.

These resources take tags:

- Network: VPCs, subnets, network interfaces, security groups, network ACLs, Floating IPs, Internet Gateways, route tables, NAT gateways and DNS policies. Rules, routes and associations don't.
- Compute: instances, key pairs, and the images you create in a project. Platform images don't. A key pair's `origin:name` tag is its name; remove it and the key pair shows the name it was imported under.
- Storage: volumes and snapshots.
- DNS: hosted zones. Record sets and VPC attachments don't.
- KMS: keys, through the KMS API's `tags` field. A deleted key keeps its tags, which can't change until it is undeleted.

## Reserved keys

Keys that start with `origin:` are reserved. Only these two are accepted; any other `origin:` key is refused.

| Key | Value | What it does |
|---|---|---|
| `origin:name` | 1 to 128 characters, no leading or trailing spaces | Names the resource: the console shows it. The CLI prints it with the resource's other `tags`. |
| `origin:env` | One of `dev`, `staging`, `qa`, `pre-prod`, `prod` or `canary` | Marks which environment the resource belongs to. |

A name doesn't have to be unique. Two resources can carry the same name, so scripts should keep addressing resources by their id or resource name. See [Name resources](access/cli.md#name-resources).

## Your own keys

Any key that doesn't start with `origin:` is yours to use, for example `team=network` or `cost-center=4711`.

| Limit | Value |
|---|---|
| Key length | 1 to 128 characters |
| Key characters | Letters, digits and `_ . : / = + @ -` |
| Value length | 0 to 256 characters, no control characters, no leading or trailing spaces |
| Tags per resource | 50 |

A tag with an empty value is allowed, for a tag that works as a flag.

## How tags are written

You can give a resource its tags when you create it, with `--tag KEY=VALUE` once for each tag, and change them afterwards with the resource's update command. Resources the platform creates for you start without tags: your default VPC itself, its subnet, default security group, default network ACL and main route table, and an instance's auto-assigned Floating IP. Tag them afterwards.

An update command's `--tag` replaces all of the resource's tags, so give every tag to keep; `--no-tags` removes them all. The resource's get command, such as `origin pvs get-volume`, shows its current tags. For example, to name a volume and keep its `team` tag:

```sh
origin pvs update-volume --volume <volume-id> \
  --tag origin:name=data --tag team=web
```

The GraphQL API also sets and removes single tags, with the `setResourceTags` and `removeResourceTags` mutations of the `compute`, `network` and `pvs` namespaces. Setting a tag that the resource already carries replaces its value; tags you don't name are left alone. Removing a key the resource doesn't carry is not an error.

A request with any invalid tag is refused as a whole, and creates or changes nothing.

Setting and removing tags requires the resource's own `update` permission, for example `network.vpc.update` on a VPC, `compute.instance.update` on an instance or `compute.key_pair.update` on a key pair. Deleting a resource deletes its tags, including when it goes with its VPC. A terminated instance keeps its tags; a deleted volume or snapshot loses them.

## Related

- [Name and tag network resources](../network/vpcs/name-and-tag.md)
- [Launch an instance](../compute/instances/launch.md)
- [`origin pvs update-volume` reference](../storage/reference/cli.md#update-volume)
- [`origin compute update-instance` reference](../compute/reference/cli.md#update-instance)
- [`origin network update-vpc` reference](../network/reference/cli.md#update-vpc)
