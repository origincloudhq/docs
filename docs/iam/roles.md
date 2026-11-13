---
id: roles
title: Built-in roles
description: Every built-in IAM role with its ID, URN, what it's for and the exact permissions it grants, including the billing roles that Owner doesn't include.
page_type: reference
parent: home
nav_order: 20
tags: [iam, roles, reference]
last_reviewed: 2026-11-13
---

# Built-in roles

<!-- Source of truth: the built-in role and permission catalog in the IAM service.
     Check every table against `origin iam list-roles` when roles change. -->

Origin Cloud has twelve built-in roles. You can't create your own. Each section lists the role's ID, the URN the GraphQL API takes, where you can assign it, and every permission it grants. The `origin iam` commands and the REST API name a role by its ID with the slashes after `roles/` written as dots, such as `roles/iam.editor` for `roles/iam/editor`. Permission keys have the form `<service>.<resource>.<action>`; the tables group them by `<service>.<resource>`. For how roles, scopes and permissions work together, see [Access model](access-model.md).

| ID | Name | For |
|---|---|---|
| [`roles/owner`](#rolesowner) | Owner | Full control of the organization, except billing accounts |
| [`roles/viewer`](#rolesviewer) | Viewer | Read-only access to everything Owner can change |
| [`roles/iam/editor`](#rolesiameditor) | IAM Editor | Assigning and revoking roles within its own permissions |
| [`roles/iam/service-account-user`](#rolesiamservice-account-user) | Service Account User | Launching instances that run as the organization's service accounts |
| [`roles/dns/editor`](#rolesdnseditor) | DNS Editor | Managing the record sets of a project's hosted zones |
| [`roles/kms/admin`](#roleskmsadmin) | KMS Admin | Managing a project's KMS keys, without using them |
| [`roles/kms/viewer`](#roleskmsviewer) | KMS Viewer | Reading a project's KMS keys and public keys |
| [`roles/kms/encrypter-decrypter`](#roleskmsencrypter-decrypter) | KMS Encrypter/Decrypter | Encrypting and decrypting with a project's KMS keys |
| [`roles/kms/signer`](#roleskmssigner) | KMS Signer | Signing with a project's KMS keys |
| [`roles/kms/grant-delegate`](#roleskmsgrant-delegate) | KMS Grant Delegate | Letting the platform's hosts decrypt with a project's KMS keys, through grants |
| [`roles/billing/administrator`](#rolesbillingadministrator) | Billing Account Administrator | Full control of billing accounts |
| [`roles/billing/user`](#rolesbillinguser) | Billing Account User | Billing accounts without deleting them |
| [`roles/billing/viewer`](#rolesbillingviewer) | Billing Account Viewer | Read-only access to billing accounts |

## roles/owner

Full control of the organization's projects, resources and access. Owner doesn't include any billing account permission: an Owner can switch which billing account a project is charged to (`admin.project.attach`) and manage spend limits, but can't view, create, change or delete a billing account. For that, assign a billing role; see [Billing access](../platform/billing/billing-access.md).

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/owner`  
**Scope:** org-wide or one project. Only an org-wide Owner can manage members and service accounts. Because Owner holds no billing permission, an Owner can't assign or revoke the billing roles unless it also holds `roles/billing/administrator`.

| Resource | Actions |
|---|---|
| `admin.organisation` | `get`, `list`, `update`, `create`, `delete` |
| `admin.project` | `get`, `list`, `update`, `create`, `delete`, `attach` |
| `admin.resource_quota` | `get`, `update` |
| `admin.spend_limit` | `get`, `update` |
| `admin.support_case` | `list`, `get`, `create`, `update` |
| `admin.usage` | `list` |
| `compute.image` | `get`, `list`, `create`, `delete`, `update` |
| `compute.instance` | `get`, `list`, `update`, `launch`, `terminate`, `start`, `stop`, `attach`, `detach` |
| `compute.key_pair` | `get`, `list`, `create`, `delete` |
| `dns.hosted_zone` | `get`, `list`, `create`, `update`, `delete`, `verify` |
| `dns.record_set` | `get`, `list`, `create`, `update`, `delete` |
| `dns.vpc_attachment` | `get`, `list`, `create`, `delete` |
| `iam.audit_log` | `list` |
| `iam.member` | `list`, `create`, `revoke` |
| `iam.permission` | `query` |
| `iam.role` | `get`, `list`, `update`, `create`, `delete`, `assign`, `revoke` |
| `iam.service_account` | `list`, `create`, `revoke`, `act_as` |
| `kms.grant` | `get`, `list`, `create`, `update`, `delete` |
| `kms.key` | `get`, `list`, `create`, `update`, `delete`, `rotate`, `encrypt`, `decrypt`, `generate_data_key`, `sign`, `get_public_key` |
| `network.acl` | `get`, `list`, `create`, `update`, `delete` |
| `network.dns_policy` | `get`, `list`, `create`, `update`, `set_default`, `delete`, `attach` |
| `network.floating_ip` | `get`, `list`, `create`, `attach`, `detach`, `delete` |
| `network.interface` | `get`, `list`, `create`, `delete`, `attach` |
| `network.internet_gateway` | `get`, `attach`, `detach` |
| `network.nat_gateway` | `get`, `list`, `create`, `delete` |
| `network.route_table` | `get`, `list`, `create`, `update`, `delete` |
| `network.security_group` | `get`, `list`, `create`, `update`, `delete` |
| `network.subnet` | `get`, `list`, `create`, `update`, `delete` |
| `network.vpc` | `get`, `list`, `create`, `delete` |
| `observability.metric` | `get` |
| `pvs.snapshot` | `get`, `list`, `create`, `delete`, `update`, `protect`, `unprotect` |
| `pvs.volume` | `get`, `list`, `create`, `delete`, `update` |

## roles/viewer

Read-only access: every `get` and `list` permission that Owner holds. A Viewer can list members, pending invites, service accounts and the audit log, but can't change anything. Viewer includes no billing account permission.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/viewer`  
**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `admin.organisation` | `get`, `list` |
| `admin.project` | `get`, `list` |
| `admin.resource_quota` | `get` |
| `admin.spend_limit` | `get` |
| `admin.support_case` | `list`, `get` |
| `admin.usage` | `list` |
| `compute.image` | `get`, `list` |
| `compute.instance` | `get`, `list` |
| `compute.key_pair` | `get`, `list` |
| `dns.hosted_zone` | `get`, `list` |
| `dns.record_set` | `get`, `list` |
| `dns.vpc_attachment` | `get`, `list` |
| `iam.audit_log` | `list` |
| `iam.member` | `list` |
| `iam.role` | `get`, `list` |
| `iam.service_account` | `list` |
| `kms.grant` | `get`, `list` |
| `kms.key` | `get`, `list` |
| `network.acl` | `get`, `list` |
| `network.dns_policy` | `get`, `list` |
| `network.floating_ip` | `get`, `list` |
| `network.interface` | `get`, `list` |
| `network.internet_gateway` | `get` |
| `network.nat_gateway` | `get`, `list` |
| `network.route_table` | `get`, `list` |
| `network.security_group` | `get`, `list` |
| `network.subnet` | `get`, `list` |
| `network.vpc` | `get`, `list` |
| `observability.metric` | `get` |
| `pvs.snapshot` | `get`, `list` |
| `pvs.volume` | `get`, `list` |

## roles/iam/editor

Lets a principal list members and roles, and assign and revoke roles in the organization. An IAM Editor can't invite or remove members or manage service accounts; those need Owner.

An IAM Editor can only hand out what it already has. Like every principal, it can assign or revoke a role only if it holds every permission of that role itself at the scope of the grant; see [Who can assign a role](access-model.md#who-can-assign-a-role). With IAM Editor alone, that is IAM Editor itself. To let it assign Viewer as well, assign it Viewer too. An IAM Editor can never make anyone an Owner, itself included.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/iam/editor`  
**Scope:** org-wide. Role operations act on the organization, so a project-scoped IAM Editor can't use them.

| Resource | Actions |
|---|---|
| `iam.member` | `list` |
| `iam.role` | `get`, `list`, `assign`, `revoke` |

## roles/iam/service-account-user

Lets a principal act as the organization's service accounts, and nothing else: launching an instance that runs as a `WORKLOAD` service account needs it beside `compute.instance.launch`. Assign it together with a role that can launch instances, such as Owner on a project.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/iam/service-account-user`  
**Scope:** org-wide. Service accounts belong to the organization, so a project-scoped Service Account User can't act as any.

| Resource | Actions |
|---|---|
| `iam.service_account` | `act_as` |

## roles/dns/editor

For a program that keeps a project's DNS records in step, such as Kubernetes' external-dns or an ACME client answering DNS-01 challenges: it manages the record sets of the project's hosted zones, and reads the zones and their VPC attachments. A DNS Editor can't create, delete or verify a hosted zone, nor attach one to a VPC. See the [DNS guide](../dns/index.md).

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/dns/editor`  
**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `dns.record_set` | `get`, `list`, `create`, `update`, `delete` |
| `dns.hosted_zone` | `get`, `list` |
| `dns.vpc_attachment` | `get`, `list` |

## roles/kms/admin

Manages a project's KMS keys: creates, reads, enables, disables, rotates, deletes and undeletes them, reads their public keys, and reads and deletes their grants. A KMS Admin can't encrypt, decrypt or sign with a key, nor make a grant, so managing keys stays apart from reading the data they protect.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/kms/admin`
**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.grant` | `get`, `list`, `delete` |
| `kms.key` | `get`, `list`, `create`, `update`, `delete`, `rotate`, `get_public_key` |

## roles/kms/viewer

Reads a project's KMS keys, their public keys and their grants.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/kms/viewer`
**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.grant` | `get`, `list` |
| `kms.key` | `get`, `list`, `get_public_key` |

## roles/kms/encrypter-decrypter

For a program that encrypts and decrypts its data with a project's KMS keys, directly or with data keys. It can't read, list or change the keys.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/kms/encrypter-decrypter`
**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.key` | `encrypt`, `decrypt`, `generate_data_key` |

## roles/kms/signer

For a program that signs with a project's KMS signing keys, and reads their public keys to hand to verifiers. It can't read, list or change the keys.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/kms/signer`
**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.key` | `sign`, `get_public_key` |

## roles/kms/grant-delegate

For the platform's services that let a host use a project's KMS keys, such as the one that attaches your volumes: it makes, renews, reads and deletes grants, each letting one host decrypt for one encryption context for at most an hour. It can't use a key itself, nor read or change the keys.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/kms/grant-delegate`
**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.grant` | `get`, `list`, `create`, `update`, `delete` |

## roles/billing/administrator

Full control of the organization's billing accounts: view, create, update and delete them. Whoever creates an organization holds this role org-wide.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/billing/administrator`  
**Scope:** org-wide only. Assign it without a project.

| Resource | Actions |
|---|---|
| `admin.billing_account` | `get`, `list`, `create`, `update`, `delete` |

## roles/billing/user

Everything the Billing Account Administrator can do, except deleting a billing account.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/billing/user`  
**Scope:** org-wide only. Assign it without a project.

| Resource | Actions |
|---|---|
| `admin.billing_account` | `get`, `list`, `create`, `update` |

## roles/billing/viewer

Read-only access to the organization's billing accounts.

**URN:** `urn:origin:cloud:iam::::builtin/role/roles/billing/viewer`  
**Scope:** org-wide only. Assign it without a project.

| Resource | Actions |
|---|---|
| `admin.billing_account` | `get`, `list` |

## Related

- [Access model](access-model.md)
- [Assign and revoke roles](assign-roles.md)
- [Billing access](../platform/billing/billing-access.md)
- [`list-roles`](reference/cli.md#list-roles) and [`list-permissions`](reference/cli.md#list-permissions) commands
