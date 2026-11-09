---
id: private-zones-create
title: Create a private zone and attach it to a VPC
nav_title: Create a private zone
description: Create a private hosted zone, add its record sets, and attach it to the VPCs whose instances should resolve its names.
page_type: task
parent: private-zones
nav_order: 10
tags: [dns, vpc, cli]
last_reviewed: 2026-11-08
---

# Create a private zone and attach it to a VPC

Give the services in your VPCs names of your own, such as `db.corp.example`, that nothing outside those VPCs can resolve.

## Before you begin

- The `origin` CLI, logged in, with a default project or `--project` on each command. See [Use the CLI](../../platform/access/cli.md).
- A VPC in the same project, and its id. `origin network list-vpcs --region eu-central1` lists them.
- A valid billing setup for the project. See [Add a payment method](../../platform/billing/payment-method.md).

## Create the zone

1. Create the zone with `--visibility PRIVATE`:

   ```sh
   origin dns create-hosted-zone --dns-name corp.example --visibility PRIVATE
   ```

   Example output:

   ```text
   name        projects/my-project/hostedZones/hz-kk6T2DGfIwv
   state       ACTIVE
   urn         urn:origin:cloud:dns::<org-id>:my-project:hz-kk6T2DGfIwv
   dnsName     corp.example
   visibility  PRIVATE
   creator     user:<user-id>
   createTime  2026-11-08T09:19:45.095279Z (0s ago)
   ```

2. Note the zone's id, the last segment of its `name`. Its `state` is `ACTIVE`, and it has no name servers or challenge.

3. Add its record sets, such as an `A` record set for `db.corp.example` holding the private address of your database instance:

   ```sh
   origin dns create-record-set --hosted-zone <zone-id> --dns-name db.corp.example \
     --type A --basic-json '{"values": ["10.0.1.20"]}'
   ```

   See [Add, change and delete record sets](../record-sets/manage.md).

## Attach the zone to a VPC

1. Attach the zone to the VPC:

   ```sh
   origin dns create-vpc-attachment --hosted-zone <zone-id> \
     --region eu-central1 --vpc <vpc-id>
   ```

   Example output:

   ```text
   name        projects/my-project/hostedZones/hz-kk6T2DGfIwv/vpcAttachments/vpc-h1YVgFoiOtm
   urn         urn:origin:cloud:dns::<org-id>:my-project:hza-lK1GyvP0IBm
   vpc         projects/my-project/regions/eu-central1/vpcs/vpc-h1YVgFoiOtm
   createTime  2026-11-08T09:19:45.491641Z (0s ago)
   ```

   `--region` completes the VPC's id to its whole name; you can give the whole name, `projects/<project-id>/regions/eu-central1/vpcs/<vpc-id>`, instead.

2. From an instance in the VPC, check that the name resolves:

   ```sh
   dig +short A db.corp.example
   ```

   The name resolves within a few seconds of the attachment.

Repeat the attachment for each VPC that should resolve the zone's names. The attachment's id is the VPC's id: `origin dns get-vpc-attachment --hosted-zone <zone-id> --vpc-attachment <vpc-id>` reads it.

A VPC created moments ago may be refused with the retryable [`SERVICE_UNAVAILABLE`](../../platform/reference/errors.md#service_unavailable); run the command again after a short wait.

## Find the zones attached to a VPC

List the attachments of every zone in the project, narrowed to one VPC, with `-` in place of the zone:

```sh
origin dns list-vpc-attachments --hosted-zone - --region eu-central1 \
  --vpc <vpc-id> -o name
```

Example output:

```text
projects/my-project/hostedZones/hz-kk6T2DGfIwv/vpcAttachments/vpc-h1YVgFoiOtm
```

Each attachment's `name` holds its zone's id. The table output shows the attachments' ids, which are the VPC's, so use `-o name` or `-o json` to see the zones.

## Detach the zone

Delete the attachment. Its id is the VPC's id:

```sh
origin dns delete-vpc-attachment --hosted-zone <zone-id> \
  --vpc-attachment <vpc-id> --yes
```

The VPC's instances stop resolving the zone's names once the VPC's hosts drop the zone.

## Related

- [Private zones and VPC attachments](index.md)
- [DNS in a VPC](../../network/dns/index.md)
- [`create-vpc-attachment` reference](../reference/cli.md#create-vpc-attachment)
- [An attachment is refused](../troubleshooting/index.md#an-attachment-is-refused)
