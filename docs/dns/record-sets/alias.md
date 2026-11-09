---
id: record-sets-alias
title: Point a name at a Floating IP
nav_title: Alias to a Floating IP
description: Create an alias record set that answers with a Floating IP's address and follows it, instead of copying the address into an A record.
page_type: task
parent: record-sets
nav_order: 30
tags: [dns, cli, internet-access]
last_reviewed: 2026-11-08
---

# Point a name at a Floating IP

An alias record set answers with the current address of a Floating IP. You name the Floating IP rather than its address, so the record set never holds a stale copy.

## Before you begin

- The `origin` CLI, logged in, with a default project or `--project` on each command. See [Use the CLI](../../platform/access/cli.md).
- A hosted zone and a Floating IP in the same project. `origin network list-floating-ips` lists your Floating IPs with their whole `name`, such as `projects/<project-id>/zones/eu-central1-az1/floatingIps/<floating-ip-id>`. See [Floating IPs](../../network/internet-access/floating-ips.md).

## Create the alias

1. Create a record set of type `A` with `--alias`, naming the Floating IP. `--zone` is the Floating IP's availability zone, which completes its id:

   ```sh
   origin dns create-record-set --hosted-zone <zone-id> --dns-name app.example.com \
     --type A --zone eu-central1-az1 --alias floating_ip=<floating-ip-id>
   ```

   Example output:

   ```text
   name        projects/my-project/hostedZones/hz-Oqu2Vgc2nt6/recordSets/rrset-aEgOwUfG2yy
   urn         urn:origin:cloud:dns::<org-id>:my-project:hz-Oqu2Vgc2nt6/rrset-aEgOwUfG2yy
   dnsName     app.example.com
   type        A
   ttl         300s
   updateTime  2026-11-08T09:19:26.871119Z (0s ago)
   createTime  2026-11-08T09:19:26.871119Z (0s ago)
   alias
     floatingIp  projects/my-project/zones/eu-central1-az1/floatingIps/fip-Q1K4AbFVadO
   ```

   With the Floating IP's whole name, `--alias floating_ip=projects/<project-id>/zones/eu-central1-az1/floatingIps/<floating-ip-id>`, `--zone` isn't needed.

2. Check the name once the zone is served:

   ```sh
   dig +short A app.example.com
   ```

The alias is refused with `BAD_REQUEST` for a Floating IP of another project, and for an `AAAA` record set: a Floating IP's address is IPv4. A Floating IP allocated moments ago may be refused with the retryable [`SERVICE_UNAVAILABLE`](../../platform/reference/errors.md#service_unavailable); run the command again after a short wait.

## Turn an alias into values, or values into an alias

Change the record set with the kind you want, and it replaces the kind it had. For example, to make an existing `A` record set follow a Floating IP:

```sh
origin dns update-record-set --hosted-zone <zone-id> --record-set <record-set-id> \
  --zone eu-central1-az1 --alias floating_ip=<floating-ip-id>
```

To give it values of its own again, update it with `--basic-json`, such as `--basic-json '{"values": ["192.0.2.40"]}'`.

## Related

- [Record sets](index.md#aliases-to-a-floating-ip)
- [Floating IPs](../../network/internet-access/floating-ips.md)
- [`create-record-set` reference](../reference/cli.md#create-record-set)
