---
id: reference-limits
title: Limits
description: The quotas on what your organization and its projects can hold, how to read current usage against them, how to set project budgets, and the platform's hard limits.
page_type: reference
parent: reference
nav_order: 30
tags: [quotas, reference, organizations, projects]
last_reviewed: 2026-11-09
---

# Limits

Quotas cap how much your organization can hold at once, such as instances, vCPUs or volume storage. They protect you from runaway automation and the platform from overload. This page lists every quota, how to read it, and the hard limits that apply regardless of quota.

## How quotas work

Quotas apply at two levels, and both are checked on every request that consumes one:

**Organization quota**  
The limit for the whole organization. Origin Cloud sets it, and it can differ between organizations. To raise it, contact Origin Cloud support.

**Project budget**  
An optional limit you set on a single project, so one project can't use up the whole organization's allowance. A project has no budget until you set one; it's then bounded only by the organization quota. A budget can't exceed the organization quota for the same dimension, and the budgets of several projects may add up to more than the organization quota: they're limits, not reservations.

Quotas count what exists now, not what you created over time. Deleting a resource frees its share of the quota at once.

## Read your quota

The `organisationQuota` query returns each limit together with current usage. Usage is recounted continuously, so a resource you just created or deleted can take up to half a minute to show; the limit itself is enforced on the exact count. Anyone with read access to the organization can read it. If usage isn't available yet, the query fails with [`SERVICE_UNAVAILABLE`](errors.md#service_unavailable); retry.

```graphql
query {
  admin {
    organisationQuota(orgId: "<org-id>") {
      maxInstances      currentInstances
      maxVcpu           currentVcpu
      maxVolumeGib      currentVolumeGib
      maxVpcs           currentVpcs
      maxPublicIps      currentPublicIps
      maxHostedZones    currentHostedZones
      maxRecordSets     currentRecordSets
    }
  }
}
```

`projectQuota(orgId: "<org-id>", projectId: "<project-id>")` returns the same fields for one project. There, a `max*` field is `null` when the project has no budget for that dimension.

With the CLI, read the organization's quota and a project's budgets, each with its usage:

```sh
origin resourcemanager get-organization-quota --organization <organization-id>
origin resourcemanager get-project-quota --project <project-id>
```

A project budget that isn't set is left out of the output.

## Set a project budget

Set or remove a project's budgets with `origin resourcemanager update-project-quota`. Each dimension has a flag that sets it and a `--no-` flag that removes it; dimensions you don't name stay as they are. For example, to allow the project 16 vCPUs and remove its instance budget:

```sh
origin resourcemanager update-project-quota --project <project-id> \
  --max-vcpu 16 --no-max-instances
```

The flags are `--max-instances`, `--max-vcpu`, `--max-volume-gib`, `--max-vpcs` and `--max-public-ips`. With the API, set one dimension with the `setProjectQuotaLimit` mutation, and remove it with `clearProjectQuotaLimit`. Both ways need the `admin.resource_quota.update` permission, which the Owner role has.

```graphql
mutation {
  admin {
    setProjectQuotaLimit(input: {
      orgId: "<org-id>"
      projectId: "<project-id>"
      dimension: MAX_VCPU
      value: 16
    }) {
      maxVcpu
      currentVcpu
    }
  }
}
```

`dimension` is one of `MAX_INSTANCES`, `MAX_VCPU`, `MAX_VOLUME_GIB`, `MAX_VPCS`, `MAX_PUBLIC_IPS`, `MAX_HOSTED_ZONES` and `MAX_RECORD_SETS`. A negative value, or one above the organization quota, is refused rather than capped. Lowering a budget below current usage doesn't remove anything; it refuses further growth until usage drops below the budget.

## What a refusal looks like

A request that would exceed a quota fails with [`BAD_REQUEST`](errors.md#bad_request) on the field `quota`, and nothing is created. The message names the scope, the dimension, the current usage and the limit:

```text
invalid input on field quota: project quota exceeded: vCPU usage is 14, requesting 4 more would exceed the limit of 16
```

Free up usage, raise or clear the project budget, or ask Origin Cloud support for a higher organization quota.

## Compute

| Quota | Field | Counts | Checked when you |
|---|---|---|---|
| Instances | `maxInstances` | Instances that aren't terminated | Launch an instance |
| vCPU | `maxVcpu` | vCPUs of the instances that count, by instance type | Launch an instance, or change an instance to a larger type |

Stopped instances count against both quotas until you terminate them. Changing an instance to a smaller type is never refused by quota. A launch also counts the instance's root volume against the storage quota and, in a subnet that assigns public IPs, its public address against the public IP quota.

For instance type sizes and the root disk size rules, see [Instance types](../../compute/instances/instance-types.md) and [Launch an instance](../../compute/instances/launch.md).

## Storage

| Quota | Field | Counts | Checked when you |
|---|---|---|---|
| Volume storage | `maxVolumeGib` | The size in GiB of all volumes that aren't deleted | Create or import a volume, grow a volume, or launch an instance |
| Snapshots | Not readable | Snapshots | Create a snapshot |

A resize counts only the growth, not the volume's whole new size.

The snapshot quota applies per organization. It isn't returned by `organisationQuota`; the refusal message states the limit.

Each volume also has an IOPS and throughput limit, which no quota changes: 3,000 IOPS and 125 MiB/s for a `gp1` volume. See [Performance limits](../../storage/volumes/storage-classes.md#performance-limits).

For volume sizes, see [Volumes](../../storage/volumes/index.md).

## Network

| Quota | Field | Counts | Checked when you |
|---|---|---|---|
| VPCs | `maxVpcs` | VPCs, including default VPCs | Create a VPC, or launch the first instance into a project's default VPC |
| Public IPs | `maxPublicIps` | Floating IPs, whether you allocated them or the platform assigned them at launch | Allocate a Floating IP, or launch into a subnet that assigns public IPs |
| Subnets | Not readable | Subnets | Create a subnet |
| Internet gateways | Not readable | Internet gateways | Attach an internet gateway |
| NAT gateways | Not readable | NAT gateways | Create a NAT gateway |
| Route tables | Not readable | Route tables | Create a route table |
| Network ACLs | Not readable | Network ACLs | Create a network ACL |
| Security groups | Not readable | Security groups | Create a security group |
| Rules per network ACL | Not readable | Rules in one network ACL | Replace a network ACL's rules |
| Rules per security group | Not readable | Ingress and egress rules of one security group, combined | Create a security group with rules, add a rule to one, or replace its rules |

The quotas marked "Not readable" apply per organization and aren't returned by `organisationQuota`; the refusal message states the limit. The two rule quotas apply to each network ACL or security group separately.

A launch into a subnet that assigns public IPs needs room for one more under the public IP quota. With the quota used up, the launch fails: the instance turns `FAILED` with the quota refusal as its reason, and it gets no network interface and no address. See [Default VPC](../../network/vpcs/default-vpc.md#auto-assigned-public-ips).

For address ranges and subnet sizes, see [VPC and subnet addressing](../../network/vpcs/addressing.md).

## DNS

| Quota | Field | Counts | Checked when you |
|---|---|---|---|
| Hosted zones | `maxHostedZones` | Hosted zones, public and private, in any state | Create a hosted zone |
| Record sets | `maxRecordSets` | Record sets of all zones | Create a record set, or make a batch change that creates more than it deletes |

An organization may hold 20 hosted zones and 10,000 record sets unless Origin Cloud support has raised its quota. For the DNS API's fixed limits, see [DNS limits](../../dns/reference/limits.md).

## IAM

IAM has no quotas. The number of members, role assignments and service accounts in an organization isn't limited.

| Limit | Value |
|---|---|
| Audit log entries per page | 100 by default, 500 at most. See [Audit log](../../iam/audit-log.md). |
| Org-wide Owners | At least one at all times. The last one can't be revoked or removed. |

## Organizations and projects

| Limit | Value |
|---|---|
| Projects per organization | No quota |
| Project ID | 6 to 16 lowercase letters, digits and hyphens, starting with a letter |
| Support cases per page | 100 by default, 500 at most |

## Related

- [Error codes](errors.md)
- [Organizations and projects](../organizations/index.md)
