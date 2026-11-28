---
id: roles
title: Built-in roles
description: Every built-in IAM role with its ID, what it's for and the exact permissions it grants, including the billing roles that Owner doesn't include.
page_type: reference
parent: home
nav_order: 20
tags: [iam, roles, reference]
last_reviewed: 2026-11-27
---

# Built-in roles

<!-- Source of truth: the built-in role and permission catalog in the IAM service.
     Check every table against `origin iam list-roles` when roles change. -->

Origin Cloud has twenty-one built-in roles. You can't create your own. Each section lists the role's ID, where you can assign it, and every permission it grants. A role's full name is `//iam.origincloudapis.eu/` followed by its ID, such as `//iam.origincloudapis.eu/roles/iam.editor`; `origin iam get-role` and the REST API's `GetRole` take a role by its ID, and a role binding's `role`, in the CLI and the REST API, takes its full name. Permission keys have the form `<service>.<resource>.<action>`; the tables group them by `<service>.<resource>`. For how roles, scopes and permissions work together, see [Access model](access-model.md).

| ID | Name | For |
|---|---|---|
| [`roles/owner`](#rolesowner) | Owner | Full control of the organization, except billing accounts |
| [`roles/viewer`](#rolesviewer) | Viewer | Read-only access to everything Owner can change |
| [`roles/iam.editor`](#rolesiameditor) | IAM Editor | Assigning and revoking roles within its own permissions |
| [`roles/iam.service-account-user`](#rolesiamservice-account-user) | Service Account User | Launching instances that run as the organization's service accounts |
| [`roles/iam.service-account-token-creator`](#rolesiamservice-account-token-creator) | Service Account Token Creator | Getting short-lived tokens of the organization's service accounts, by impersonating them |
| [`roles/dns.editor`](#rolesdnseditor) | DNS Editor | Managing the record sets of a project's hosted zones |
| [`roles/pvs.csi-driver`](#rolespvscsi-driver) | PVS CSI Driver | A Kubernetes cluster's CSI driver: a project's volumes and snapshots, and attaching volumes to its instances |
| [`roles/kms.admin`](#roleskmsadmin) | KMS Admin | Managing a project's KMS keys, without using them |
| [`roles/kms.viewer`](#roleskmsviewer) | KMS Viewer | Reading a project's KMS keys and public keys |
| [`roles/kms.encrypter-decrypter`](#roleskmsencrypter-decrypter) | KMS Encrypter/Decrypter | Encrypting and decrypting with a project's KMS keys |
| [`roles/kms.signer`](#roleskmssigner) | KMS Signer | Signing with a project's KMS keys |
| [`roles/kms.grant-delegate`](#roleskmsgrant-delegate) | KMS Grant Delegate | Letting the platform's hosts decrypt with a project's KMS keys, through grants |
| [`roles/kms.grant-issuer`](#roleskmsgrant-issuer) | KMS Grant Issuer | Making and deleting grants on a project's KMS keys, nothing else |
| [`roles/kms.volume-keys-agent`](#roleskmsvolume-keys-agent) | KMS Volume Keys Agent | Creating a project's KMS keys and generating data keys with them, for storage's service agent |
| [`roles/kms.secret-keys-agent`](#roleskmssecret-keys-agent) | KMS Secret Keys Agent | Creating a project's KMS keys, generating data keys with them and decrypting those, for Secret Manager's service agent |
| [`roles/secretmanager.admin`](#rolessecretmanageradmin) | Secret Manager Admin | Full control of a project's secrets, including reading their values |
| [`roles/secretmanager.editor`](#rolessecretmanagereditor) | Secret Manager Editor | Managing a project's secrets and versions, without reading their values |
| [`roles/secretmanager.secretAccessor`](#rolessecretmanagersecretaccessor) | Secret Manager Secret Accessor | Reading the values of secrets, for a workload |
| [`roles/secretmanager.viewer`](#rolessecretmanagerviewer) | Secret Manager Viewer | Reading a project's secrets and versions, never their values |
| [`roles/billing.administrator`](#rolesbillingadministrator) | Billing Account Administrator | Full control of billing accounts |
| [`roles/billing.user`](#rolesbillinguser) | Billing Account User | Billing accounts without deleting them |
| [`roles/billing.viewer`](#rolesbillingviewer) | Billing Account Viewer | Read-only access to billing accounts |

## roles/owner

Full control of the organization's projects, resources and access. Owner doesn't include any billing account permission: an Owner can switch which billing account a project is charged to (`admin.project.attach`) and manage spend limits, but can't view, create, change or delete a billing account. For that, assign a billing role; see [Billing access](../platform/billing/billing-access.md).

**Scope:** org-wide or one project. Only an org-wide Owner can manage members and service accounts. Because Owner holds no billing permission, an Owner can't assign or revoke the billing roles unless it also holds `roles/billing.administrator`.

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
| `compute.key_pair` | `get`, `list`, `create`, `delete`, `update` |
| `compute.launch_template` | `get`, `list`, `create`, `update`, `delete` |
| `dns.hosted_zone` | `get`, `list`, `create`, `update`, `delete`, `verify` |
| `dns.record_set` | `get`, `list`, `create`, `update`, `delete` |
| `dns.vpc_attachment` | `get`, `list`, `create`, `delete` |
| `iam.audit_log` | `list` |
| `iam.member` | `list`, `create`, `revoke` |
| `iam.permission` | `query` |
| `iam.role` | `get`, `list`, `update`, `create`, `delete`, `assign`, `revoke` |
| `iam.service_account` | `list`, `create`, `revoke`, `act_as`, `get_access_token` |
| `iam.service_account_key` | `get`, `list`, `create`, `delete` |
| `kms.grant` | `get`, `list`, `create`, `update`, `delete` |
| `kms.key` | `get`, `list`, `create`, `update`, `delete`, `undelete`, `rotate`, `retire_context`, `encrypt`, `decrypt`, `generate_data_key`, `sign`, `get_public_key` |
| `network.acl` | `get`, `list`, `create`, `update`, `delete` |
| `network.resolver_policy` | `get`, `list`, `create`, `update`, `set_default`, `delete`, `attach` |
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
| `secretmanager.secret` | `get`, `list`, `create`, `update`, `delete`, `force_delete`, `restore` |
| `secretmanager.secret_version` | `get`, `list`, `add`, `access`, `enable`, `disable`, `destroy` |

## roles/viewer

Read-only access: every `get` and `list` permission that Owner holds. A Viewer can list members, pending role bindings, service accounts and the audit log, but can't change anything. Viewer includes no billing account permission, and reads secrets' names and versions but never their values.

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
| `compute.launch_template` | `get`, `list` |
| `dns.hosted_zone` | `get`, `list` |
| `dns.record_set` | `get`, `list` |
| `dns.vpc_attachment` | `get`, `list` |
| `iam.audit_log` | `list` |
| `iam.member` | `list` |
| `iam.role` | `get`, `list` |
| `iam.service_account` | `list` |
| `iam.service_account_key` | `get`, `list` |
| `kms.grant` | `get`, `list` |
| `kms.key` | `get`, `list` |
| `network.acl` | `get`, `list` |
| `network.resolver_policy` | `get`, `list` |
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
| `secretmanager.secret` | `get`, `list` |
| `secretmanager.secret_version` | `get`, `list` |

## roles/iam.editor

Lets a principal list members and roles, and assign and revoke roles in the organization. An IAM Editor can grant a role to a user by email address only when the address has an account: a pending role binding, which emails an invitation, needs `iam.member.create`, which Owner has. An IAM Editor can't remove members in the console or manage service accounts; those need Owner.

An IAM Editor can only hand out what it already has. Like every principal, it can assign or revoke a role only if it holds every permission of that role itself at the scope of the grant; see [Who can assign a role](access-model.md#who-can-assign-a-role). With IAM Editor alone, that is IAM Editor itself. To let it assign Viewer as well, assign it Viewer too. An IAM Editor can never make anyone an Owner, itself included.

**Scope:** org-wide. Role operations act on the organization, so a project-scoped IAM Editor can't use them.

| Resource | Actions |
|---|---|
| `iam.member` | `list` |
| `iam.role` | `get`, `list`, `assign`, `revoke` |

## roles/iam.service-account-user

Lets a principal act as the organization's service accounts, and nothing else: launching an instance that runs as a `WORKLOAD` service account needs it beside `compute.instance.launch`. Assign it together with a role that can launch instances, such as Owner on a project.

**Scope:** org-wide. Service accounts belong to the organization, so a project-scoped Service Account User can't act as any.

| Resource | Actions |
|---|---|
| `iam.service_account` | `act_as` |

It doesn't let the principal get a service account's token; that is [`roles/iam.service-account-token-creator`](#rolesiamservice-account-token-creator).

## roles/iam.service-account-token-creator

Lets a principal get short-lived tokens of the organization's service accounts by impersonating them through the STS, and nothing else. A token it gets acts with the service account's roles, not the principal's, and names the principal as the one acting, so you can hand a tool such as an AI agent a service account with narrow roles instead of your own access. It doesn't let the principal launch an instance as a service account; that is [`roles/iam.service-account-user`](#rolesiamservice-account-user). Owner includes this permission.

**Scope:** one service account, or org-wide. Bound on one service account, its holder may impersonate that account and no other, and holds nothing on the organization or its projects; see [Grant impersonation of one service account](service-accounts.md#grant-impersonation-of-one-service-account). It is the only role that can be bound on one account. An org-wide one may impersonate every active service account of the organization, so assign it org-wide only to principals you would trust with each of them. Service accounts belong to the organization, so a project-scoped Service Account Token Creator can't impersonate any.

Tools that impersonate with this role: the CLI's [`--impersonate-service-account`](../platform/access/cli.md#act-as-a-service-account-with-your-login) (from version 2.1.0), the impersonation option of the Rust, Go and TypeScript SDKs, the Terraform provider's `impersonate_service_account` (from version 0.26.0), and the [hosted MCP server](../platform/access/hosted-mcp.md) with `?service_account=`.

| Resource | Actions |
|---|---|
| `iam.service_account` | `get_access_token` |

## roles/dns.editor

For a program that keeps a project's DNS records in step, such as Kubernetes' external-dns or an ACME client answering DNS-01 challenges: it manages the record sets of the project's hosted zones, and reads the zones and their VPC attachments. A DNS Editor can't create, delete or verify a hosted zone, nor attach one to a VPC. See the [DNS guide](../dns/index.md).

**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `dns.record_set` | `get`, `list`, `create`, `update`, `delete` |
| `dns.hosted_zone` | `get`, `list` |
| `dns.vpc_attachment` | `get`, `list` |

## roles/pvs.csi-driver

For the Origin CSI driver (`pvs.csi.origincloud.eu`) of a Kubernetes cluster on Origin Cloud, bound to the service account the cluster's nodes run as. It creates, reads, resizes and deletes the project's volumes, creates, reads, protects, unprotects and deletes their snapshots (a volume is restored only from a protected snapshot, and a snapshot is deleted only once unprotected), and attaches and detaches volumes on the project's instances, running or stopped. It reads instances, so the driver can find a node's instance and zone, and lists a volume's attachments across the project's instances. Reading a storage class needs no permission, and an operation is read with its resource's `get`.

It can't launch, stop, start, change or terminate an instance. Volume attachments are guarded on their instance: `compute.instance.attach` and `compute.instance.detach` are what attaching and detaching a volume take.

**Scope:** org-wide or one project. Bind it on the cluster's project.

To install the driver and give the cluster's nodes this role, see [Install the Origin CSI driver](../storage/kubernetes/install.md); for errors it reports, see [Troubleshoot the Origin CSI driver](../storage/kubernetes/troubleshooting.md#requests-refused-with-permission_denied).

| Resource | Actions |
|---|---|
| `compute.instance` | `get`, `list`, `attach`, `detach` |
| `pvs.snapshot` | `get`, `list`, `create`, `delete`, `protect`, `unprotect` |
| `pvs.volume` | `get`, `list`, `create`, `update`, `delete` |

## roles/kms.admin

Manages a project's KMS keys: creates, reads, enables, disables, rotates, deletes and undeletes them, reads their public keys, and reads and deletes their grants. A KMS Admin can't encrypt, decrypt or sign with a key, nor make a grant, so managing keys stays apart from reading the data they protect.

**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.grant` | `get`, `list`, `delete` |
| `kms.key` | `get`, `list`, `create`, `update`, `delete`, `undelete`, `rotate`, `get_public_key` |

## roles/kms.viewer

Reads a project's KMS keys, their public keys and their grants.

**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.grant` | `get`, `list` |
| `kms.key` | `get`, `list`, `get_public_key` |

## roles/kms.encrypter-decrypter

For a program that encrypts and decrypts its data with a project's KMS keys, directly or with data keys. It can't read, list or change the keys.

**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.key` | `encrypt`, `decrypt`, `generate_data_key` |

## roles/kms.signer

For a program that signs with a project's KMS signing keys, and reads their public keys to hand to verifiers. It can't read, list or change the keys.

**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.key` | `sign`, `get_public_key` |

## roles/kms.grant-delegate

For the platform's services that let a host use a project's KMS keys. Every new organization binds it org-wide to compute's service agent, `//iam.origincloudapis.eu/serviceAgents/compute`, which attaches your volumes, and only a service agent's binding of it does anything; see [Service agents](service-agents.md). It makes, renews, reads and deletes grants, each letting one host decrypt for one encryption context for at most an hour. It can't use a key itself, nor read or change the keys.

**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.grant` | `get`, `list`, `create`, `update`, `delete` |

## roles/kms.grant-issuer

For the platform's services that let a worker or host use a key for one short job. Every organization binds it org-wide to storage's service agent, `//iam.origincloudapis.eu/serviceAgents/storage`; see [Service agents](service-agents.md). It makes a grant and deletes it, and nothing else: it can't renew, read or list grants, nor read, change or use the keys. Storage's service agent may use it only on the keys the platform manages for your projects; the KMS refuses it on your own keys.

**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.grant` | `create`, `delete` |

## roles/kms.volume-keys-agent

For the platform's service that keeps your volumes' keys. Every organization binds it org-wide to storage's service agent, `//iam.origincloudapis.eu/serviceAgents/storage`; see [Service agents](service-agents.md). It creates a key, reads it, enables it, undeletes it, generates data keys with it and retires an encryption context on it, and nothing else: it can't list, rotate or delete a key, encrypt or decrypt with one, nor touch its grants. Storage's service agent uses it to create each project's volumes key and a data key for each new encrypted volume. Retiring an encryption context makes any ciphertext made under it unopenable for good; see [Retired encryption contexts](../kms/reference/index.md#retired-encryption-contexts). The KMS lets a service agent read, use and change only the keys the platform manages for your projects, and refuses it on your own keys.

**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.key` | `get`, `create`, `update`, `undelete`, `generate_data_key`, `retire_context` |

## roles/kms.secret-keys-agent

For the platform's service that keeps your secrets' keys. Every organization binds it org-wide to Secret Manager's service agent, `//iam.origincloudapis.eu/serviceAgents/secretmanager`; see [Service agents](service-agents.md). It creates a key, reads it, enables it, undeletes it, generates data keys with it and decrypts them, and nothing else: it can't list, rotate or delete a key, encrypt with one, nor touch its grants. Secret Manager, which isn't available yet, will use it to create each project's secrets key in a region, encrypt each secret version's data key and decrypt that data key when the secret is read. The KMS lets a service agent read, use and change only the keys the platform manages for your projects, and refuses it on your own keys.

**Scope:** org-wide or one project.

| Resource | Actions |
|---|---|
| `kms.key` | `get`, `create`, `update`, `undelete`, `generate_data_key`, `decrypt` |

## roles/secretmanager.admin

> **Not yet available.** Secret Manager isn't offered yet. The four Secret Manager roles can be assigned, but grant nothing until it is.

Full control of a project's secrets: creates, reads, changes, deletes and restores them, deletes them at once with no recovery window (`force_delete`), and adds, reads the values of, enables, disables and destroys their versions. It is the only Secret Manager role that can delete a secret for good before its recovery window ends.

**Scope:** org-wide, one project, or a list of secrets.

| Resource | Actions |
|---|---|
| `secretmanager.secret` | `get`, `list`, `create`, `update`, `delete`, `force_delete`, `restore` |
| `secretmanager.secret_version` | `get`, `list`, `add`, `access`, `enable`, `disable`, `destroy` |

## roles/secretmanager.editor

Manages a project's secrets and their versions without reading their values: creates, reads, changes, deletes and restores secrets, and adds, enables, disables and destroys versions. A Secret Manager Editor can't read a version's value (`access`), and can't delete a secret at once, past its recovery window (`force_delete`).

**Scope:** org-wide, one project, or a list of secrets.

| Resource | Actions |
|---|---|
| `secretmanager.secret` | `get`, `list`, `create`, `update`, `delete`, `restore` |
| `secretmanager.secret_version` | `get`, `list`, `add`, `enable`, `disable`, `destroy` |

## roles/secretmanager.secretAccessor

For a workload that reads its secrets' values, and nothing else: it can't list, read or change secrets or versions. Bind it with a [list of resources](access-model.md#bindings-limited-to-a-list-of-resources) naming exactly the secrets the workload needs, so it can't read the project's other secrets.

**Scope:** org-wide, one project, or a list of secrets.

| Resource | Actions |
|---|---|
| `secretmanager.secret_version` | `access` |

## roles/secretmanager.viewer

Reads a project's secrets and their versions: their names, states, KMS keys, tags and times. A Secret Manager Viewer never reads a version's value.

**Scope:** org-wide, one project, or a list of secrets.

| Resource | Actions |
|---|---|
| `secretmanager.secret` | `get`, `list` |
| `secretmanager.secret_version` | `get`, `list` |

## roles/billing.administrator

Full control of the organization's billing accounts: view, create, update and delete them. Whoever creates an organization holds this role org-wide.

**Scope:** org-wide only. Assign it without a project.

| Resource | Actions |
|---|---|
| `admin.billing_account` | `get`, `list`, `create`, `update`, `delete` |

## roles/billing.user

Everything the Billing Account Administrator can do, except deleting a billing account.

**Scope:** org-wide only. Assign it without a project.

| Resource | Actions |
|---|---|
| `admin.billing_account` | `get`, `list`, `create`, `update` |

## roles/billing.viewer

Read-only access to the organization's billing accounts.

**Scope:** org-wide only. Assign it without a project.

| Resource | Actions |
|---|---|
| `admin.billing_account` | `get`, `list` |

## Related

- [Access model](access-model.md)
- [Assign and revoke roles](assign-roles.md)
- [Billing access](../platform/billing/billing-access.md)
- [`list-roles`](reference/cli.md#list-roles) and [`list-permissions`](reference/cli.md#list-permissions) commands
