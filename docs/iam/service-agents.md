---
id: service-agents
title: Service agents
description: Service agents are the identities the platform's own services act as in your organization. Learn which exist, which roles they hold and how to remove them.
page_type: concept
parent: home
nav_order: 15
tags: [iam, roles, security]
last_reviewed: 2026-11-15
---

# Service agents

A service agent is the identity one of the platform's own services acts as in your organization, such as compute's, `//iam.origincloudapis.eu/serviceAgents/compute`. You see it in your role bindings like any other member, and it can do only what those bindings allow. It belongs to the platform, not to your organization: you can't create or delete one, get a key or a token for it, or act as it.

## The service agents

| Member | Service | Bound in every organization |
|---|---|---|
| `//iam.origincloudapis.eu/serviceAgents/compute` | Compute. It makes the KMS grants that let a host decrypt a volume's key while the volume is attached to an instance on that host. | [`roles/kms.grant-delegate`](roles.md#roleskmsgrant-delegate), org-wide |
| `//iam.origincloudapis.eu/serviceAgents/storage` | Storage, for the volumes key the platform manages in each project. | Nothing |

A service agent's full name is `//iam.origincloudapis.eu/serviceAgents/<name>`, such as `//iam.origincloudapis.eu/serviceAgents/compute`. The REST API and the `origin iam` commands and the GraphQL API take and show a service agent by its full name only. A name the platform has no service agent for is refused with `BAD_REQUEST`.

## What you can change

The following diagram shows how compute's binding lets it act in your organization.

```mermaid
flowchart LR
  accTitle: How compute's service agent acts in an organization
  accDescr: The organization's binding of roles/kms.grant-delegate to compute's service agent lets compute make KMS grants on the organization's keys. Each grant lets one host decrypt for one volume. Deleting the binding stops new grants; grants already made run out within an hour.
  binding["Role binding: compute's service agent holds roles/kms.grant-delegate"] --> compute[Compute acts as its service agent]
  compute -->|makes| grant[KMS grant for one host and one volume]
  grant -->|lets the host| decrypt[Decrypt the volume's key]
```

Every organization holds compute's binding of `roles/kms.grant-delegate`, made by the platform once: a new organization holds it from its creation. You can [delete it](assign-roles.md) like any other binding, if you hold the role's permissions yourself. Compute then makes no new grants on your organization's keys, and the grants it already made run out within an hour. The platform doesn't make the binding again: to let compute grant again, create it yourself.

A service agent can hold only the roles its service needs: compute only `roles/kms.grant-delegate`, storage none. A binding of any other role to a service agent is refused with `BAD_REQUEST`, so a service agent never becomes a way to do what your own bindings don't allow.

## In the audit log

A binding the platform makes for a service agent is recorded as `iam.role.assign` with the platform as the actor, `//iam.origincloudapis.eu/services/<service>` in the REST API. A change you make to it is recorded under your name, as any other. Once compute makes KMS grants as its service agent, the entries of those grants will name the agent as the actor: `//iam.origincloudapis.eu/serviceAgents/compute`. See [Audit log](audit-log.md).

## Related

- [Access model](access-model.md) – principals, roles and scopes
- [Built-in roles](roles.md) – what `roles/kms.grant-delegate` allows
