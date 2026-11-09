---
id: dns-manage-policies
title: Manage DNS policies
description: Create DNS policies, change their upstream servers and relaying, associate a policy with a VPC, change a project's default policy, and delete a policy.
page_type: task
parent: dns
nav_order: 10
tags: [networking, dns, cli]
last_reviewed: 2026-11-03
---

# Manage DNS policies

A DNS policy decides where a VPC relays queries it can't answer itself. Use your own policy when a VPC must resolve names in your company's DNS zone, or when it must not resolve external names at all.

## Before you begin

- The `origin` CLI, logged in, with a default project, zone and region. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region). A DNS policy belongs to a region, and serves the VPCs of that region.
- The id of the VPC, if you associate a policy with one.
- The IPv4 or IPv6 addresses of the upstream DNS servers you want to use.

## Create a policy

1. Create the policy with its upstream servers and relaying turned on, and note its id:

   ```sh
   origin network create-dns-policy --relay-enabled true \
     --upstream-server 192.0.2.53 --upstream-server 192.0.2.54
   ```

   Servers are tried in the order you give them, at most five. To create a policy that refuses every query outside the VPC, use `--relay-enabled false` with no upstream servers. Relaying with no upstream servers is refused.

2. Verify it with `list-dns-policies`.

A new policy isn't the project's default. Associate it with a VPC, or make it the default.

## Associate a policy with a VPC

1. Associate the policy. It must belong to the VPC's project and region, and a VPC has at most one DNS policy association.

   ```sh
   origin network create-dns-policy-association --vpc <vpc-id> \
     --dns-policy <dns-policy-id>
   ```

2. Verify that the VPC's `dnsPolicy` names the policy:

   ```sh
   origin network get-vpc --vpc <vpc-id>
   ```

While it has the association, the VPC relays through that policy and doesn't follow the project's default. To make it follow the default again, delete the association. Its id is the DNS policy's id:

```sh
origin network delete-dns-policy-association --vpc <vpc-id> \
  --dns-policy-association <dns-policy-id> --yes
```

To move a VPC to another policy, delete its association, then create a new one.

## Change a policy's servers or relaying

1. Change what you name. `--upstream-server` replaces the whole server list, so give every server to keep; `--relay-enabled` alone leaves the servers as they are.

   ```sh
   origin network update-dns-policy --dns-policy <dns-policy-id> \
     --relay-enabled true --upstream-server 192.0.2.53
   ```

2. Verify with `get-dns-policy --dns-policy <dns-policy-id>`.

The change applies to every VPC that relays through the policy within seconds, while instances keep running; no restart is needed.

## Change the project's default policy

1. Make another policy the default in its region:

   ```sh
   origin network set-default-dns-policy --dns-policy <dns-policy-id>
   ```

2. Verify with `list-dns-policies`: the policy's `projectDefault` is `true`.

Every VPC of the region with no DNS policy association, which is every VPC you create until you associate one, relays through the new default from then on. A VPC with an association, such as your default VPC, keeps its policy; delete or replace the association to move it.

## Delete a policy

1. Delete the DNS policy association of every VPC that uses the policy, or replace it with one to another policy. A policy can't be deleted while an association names it, or while it's the project's default.

2. Delete the policy:

   ```sh
   origin network delete-dns-policy --dns-policy <dns-policy-id> --yes
   ```

3. Verify that `list-dns-policies` no longer shows it.

Deleting a VPC doesn't delete its DNS policy. Deleting the project deletes its default policy; see [Delete a project](../../platform/organizations/projects.md#delete-a-project).

## Related

- [DNS](index.md)
- [How rules, routes and lists change](../traffic-control/replace-rule-sets.md)
- [`create-dns-policy` reference](../reference/cli.md#create-dns-policy)
- [`update-dns-policy` reference](../reference/cli.md#update-dns-policy)
- [`create-dns-policy-association` reference](../reference/cli.md#create-dns-policy-association)
