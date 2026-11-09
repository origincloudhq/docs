---
id: reference
title: DNS reference
nav_title: Reference
description: The origin dns CLI commands, how to call the DNS API, every method of its hosted zone, record set and VPC attachment resources, and their fields.
page_type: reference
parent: home
nav_order: 50
tags: [dns, reference, cli, api]
last_reviewed: 2026-11-08
availability: preview
---

# DNS reference

These pages list everything of one kind. For explanations, follow the links back to the concept pages.

DNS has two reference surfaces: the `origin dns` CLI commands and the DNS REST API. Both cover the same resources, one command for each API method.

## Pages

**[`origin dns` commands](cli.md)**  
Every command with its flags.

**[Record value formats](record-values.md)**  
How each record type's values are written.

**[DNS limits](limits.md)**  
Quotas, name lengths, TTLs and value counts.

**[DNS errors](errors.md)**  
Every error the DNS API answers with, and what causes it.

## CLI commands

[`origin dns` commands](cli.md) lists every command with its flags. For options that apply to every command, see [Global options](../../platform/reference/cli.md#global-options); for how `--project`, `--zone` and `--region` default, see [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).

A command takes a hosted zone by its id with `--hosted-zone`, completed with `--project`, or by its whole name. A record set or VPC attachment is taken by its id together with `--hosted-zone`, or by its whole name alone. `--zone` is never a hosted zone: it's the availability zone that completes a Floating IP's id in an alias.

A list command prints every page unless you give `--page-size` or `--page-token`. A create, update, delete or batch change sends a request id, a UUID: give your own with `--request-id` to repeat a call safely, and the repeat within a day returns what the first call did instead of doing it again.

## Call the DNS API

The DNS API answers at `https://dns.origincloudapis.eu`, the same host for every region. It's a preview (`v1beta1`): names and fields may still change. Call it directly when you don't use the CLI, such as from your own program. Every request carries an access token, as for the GraphQL API; with the `origin` CLI logged in, `origin id token --as-header --raw` prints the header. See [Use the GraphQL API](../../platform/access/api.md#authenticate). For example, to list a project's hosted zones:

```sh
curl -sS https://dns.origincloudapis.eu/v1beta1/projects/<project-id>/hostedZones \
  -H "$(origin id token --as-header --raw)"
```

Requests and responses are JSON, with fields in lower camel case, such as `dnsName`. A duration, such as a `ttl`, is written in seconds with an `s` suffix, such as `"300s"`.

- Lists return a page at a time. Pass the response's `nextPageToken` as `pageToken` for the next page; `pageSize` asks for a page size, which the server clamps.
- Creates, updates, deletes and batch changes take an optional `requestId`, a UUID. A repeat with the same id within a day returns what the first request did instead of doing it again.

## Resource names

| Resource | Name |
|---|---|
| Hosted zone | `projects/<project-id>/hostedZones/<zone-id>` |
| Record set | `projects/<project-id>/hostedZones/<zone-id>/recordSets/<record-set-id>` |
| VPC attachment | `projects/<project-id>/hostedZones/<zone-id>/vpcAttachments/<vpc-id>` |

## API methods

Paths are relative to `https://dns.origincloudapis.eu/v1beta1/`.

| Method | HTTP | CLI command | Does |
|---|---|---|---|
| `ListHostedZones` | `GET projects/<project-id>/hostedZones` | [`list-hosted-zones`](cli.md#list-hosted-zones) | The project's zones, oldest first. `dnsName` narrows the list to one domain. |
| `GetHostedZone` | `GET projects/<project-id>/hostedZones/<zone-id>` | [`get-hosted-zone`](cli.md#get-hosted-zone) | One zone. |
| `CreateHostedZone` | `POST projects/<project-id>/hostedZones` | [`create-hosted-zone`](cli.md#create-hosted-zone) | Creates an empty zone from its `dnsName`, `visibility` and optional `tags`. |
| `UpdateHostedZone` | `PATCH projects/<project-id>/hostedZones/<zone-id>?updateMask=tags` | [`update-hosted-zone`](cli.md#update-hosted-zone) | Replaces a zone's tags. |
| `DeleteHostedZone` | `DELETE projects/<project-id>/hostedZones/<zone-id>` | [`delete-hosted-zone`](cli.md#delete-hosted-zone) | Deletes an empty zone. |
| `VerifyHostedZone` | `POST projects/<project-id>/hostedZones/<zone-id>:verify` | [`verify-hosted-zone`](cli.md#verify-hosted-zone) | Checks a public zone's challenge now. |
| `ListRecordSets` | `GET projects/<project-id>/hostedZones/<zone-id>/recordSets` | [`list-record-sets`](cli.md#list-record-sets) | A zone's record sets by `dnsName`, then `type`. `dnsName` and `type` narrow the list. |
| `GetRecordSet` | `GET …/recordSets/<record-set-id>` | [`get-record-set`](cli.md#get-record-set) | One record set. |
| `CreateRecordSet` | `POST …/recordSets` | [`create-record-set`](cli.md#create-record-set) | Creates a record set from its `dnsName`, `type`, optional `ttl`, and `basic` or `alias`. |
| `UpdateRecordSet` | `PATCH …/recordSets/<record-set-id>?updateMask=…` | [`update-record-set`](cli.md#update-record-set) | Replaces a record set's `ttl`, `basic` or `alias`, or `*`. |
| `DeleteRecordSet` | `DELETE …/recordSets/<record-set-id>` | [`delete-record-set`](cli.md#delete-record-set) | Deletes a record set. |
| `BatchChangeRecordSets` | `POST …/recordSets:batchChange` | [`batch-change-record-sets`](cli.md#batch-change-record-sets) | Deletes, changes and creates record sets of one zone, all or none. |
| `ListVpcAttachments` | `GET projects/<project-id>/hostedZones/<zone-id>/vpcAttachments` | [`list-vpc-attachments`](cli.md#list-vpc-attachments) | A private zone's attachments, oldest first. `-` for the zone lists every zone's; `vpc` narrows the list to one VPC. |
| `GetVpcAttachment` | `GET …/vpcAttachments/<vpc-id>` | [`get-vpc-attachment`](cli.md#get-vpc-attachment) | One attachment. |
| `CreateVpcAttachment` | `POST …/vpcAttachments` | [`create-vpc-attachment`](cli.md#create-vpc-attachment) | Attaches a private zone to the VPC named in `vpc`. |
| `DeleteVpcAttachment` | `DELETE …/vpcAttachments/<vpc-id>` | [`delete-vpc-attachment`](cli.md#delete-vpc-attachment) | Detaches a private zone from a VPC. |

## Hosted zone fields

| Field | Description |
|---|---|
| `name` | The zone's resource name. |
| `urn` | The zone's URN, which access policies and the audit log use. |
| `dnsName` | The domain, without the final dot. Fixed at creation. |
| `visibility` | `PUBLIC` or `PRIVATE`. Fixed at creation. |
| `state` | `PENDING_VERIFICATION`, `ACTIVE` or `SUSPENDED`. See [Hosted zones](../hosted-zones/index.md#states). |
| `nameServers` | A public zone's name servers to delegate to. Empty for a private zone. |
| `challenge` | A public zone's ownership challenge: `dnsName`, `token`, `expireTime`, `verifyTime`, `suspendTime`, `suspensionReason`, and `lastCheck` in a verify response. Unset for a private zone. See [Domain ownership](../hosted-zones/ownership.md). |
| `createTime` | When the zone was created. |
| `creator` | Who created it, such as `user:<id>` or `service_account:<id>`. |
| `tags` | Up to 50 tags. See [Tags](../../platform/tags.md). |

## Record set fields

| Field | Description |
|---|---|
| `name` | The record set's resource name. |
| `urn` | The record set's URN. |
| `dnsName` | The name the records answer for, in full. Fixed at creation. |
| `type` | `A`, `AAAA`, `CNAME`, `TXT`, `MX`, `SRV` or `CAA`. Fixed at creation. |
| `ttl` | 30 seconds to 7 days; 300 seconds when left out. |
| `basic.values` | The record set's own values. See [Record value formats](record-values.md). |
| `alias.floatingIp` | The Floating IP whose address an `A` alias answers with. |
| `createTime`, `updateTime` | When the record set was created and last changed. |

A record set has either `basic` or `alias`, never both.

## Related

- [Error codes](../../platform/reference/errors.md) – the error codes every API call can return
- [Use the CLI](../../platform/access/cli.md) – install the `origin` CLI and log in
