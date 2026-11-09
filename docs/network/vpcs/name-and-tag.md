---
id: vpcs-name-and-tag
title: Name and tag network resources
description: Name a VPC or another network resource with the origin:name tag when you create it, rename it later, and change or remove its tags with the CLI.
page_type: task
parent: vpcs
nav_order: 45
tags: [networking, vpc, tags, cli]
last_reviewed: 2026-11-03
---

# Name and tag network resources

Give a VPC, subnet or other network resource a name so you can tell it apart from the others in a project. The steps below use a VPC; every other network resource with tags works the same way. A name is the `origin:name` tag; for what tags are and their limits, see [Tags](../../platform/tags.md).

## Before you begin

- The `origin` CLI, logged in, with a default project, zone and region. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- To tag an existing resource, its id and the resource's `update` permission, for example `network.vpc.update` on a VPC.

## Name a VPC when you create it

1. Pass one `--tag` per tag:

   ```sh
   origin network create-vpc --tag origin:name=frontend --tag origin:env=prod
   ```

2. Verify that the output's `tags` lists both tags.

## Name other network resources

Every command that creates a VPC, subnet, network interface, route table, network ACL, security group, Internet Gateway, NAT gateway, Floating IP or DNS policy takes `--tag`, for example:

```sh
origin network create-subnet --vpc <vpc-id> --tag origin:name=web
```

Each of them has an `update-` command that changes its tags, such as `update-vpc`, `update-subnet` and `update-security-group`. Use them for resources you created and for those the platform created for you, such as your default VPC's default security group. Routes, rules and associations have no tags.

## Rename a VPC or change its tags

`--tag` on an `update-` command replaces all of the resource's tags, so give every tag the resource keeps.

1. Read the current tags:

   ```sh
   origin network get-vpc --vpc <vpc-id>
   ```

2. Set the full new set. For example, to rename the VPC to `frontend-eu`, keep `origin:env=prod` and add `team=web`:

   ```sh
   origin network update-vpc --vpc <vpc-id> \
     --tag origin:name=frontend-eu --tag origin:env=prod --tag team=web
   ```

3. Verify that the output lists exactly these tags.

## Remove a name or a tag

To remove one tag, run the `update-` command with every tag except that one. To remove all of them, use `--no-tags`:

```sh
origin network update-vpc --vpc <vpc-id> --no-tags
```

A VPC without an `origin:name` tag is unnamed.

## Related

- [Tags](../../platform/tags.md)
- [`create-vpc` reference](../reference/cli.md#create-vpc)
- [`update-vpc` reference](../reference/cli.md#update-vpc)
