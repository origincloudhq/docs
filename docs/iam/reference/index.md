---
id: reference
title: IAM reference
nav_title: Reference
description: Where to find every origin iam command and built-in role, and a one-line summary of each IAM operation in the GraphQL and REST APIs.
page_type: reference
parent: home
nav_order: 80
tags: [iam, reference, cli, api]
last_reviewed: 2026-11-20
---

# IAM reference

<!-- GraphQL list: the `iam` fields of the query and mutation roots in the published GraphQL schema. -->

Look up exact commands, roles and API operations here. For how IAM works, see [Access model](../access-model.md).

## Reference pages

**CLI commands**  
Every `origin iam` command with its options. See [`origin iam` commands](cli.md).

**Built-in roles**  
Every role with its URN and permissions. See [Built-in roles](../roles.md).

**Errors**  
Error codes shared by every API operation. See [Errors](../../platform/reference/errors.md).

## REST API

The IAM REST API answers at `https://iam.origincloudapis.eu`. It's a preview (`v1beta1`): names and fields may still change. Every request carries an access token, as for the GraphQL API; see [Use the GraphQL API](../../platform/access/api.md#authenticate).

- A change's response carries an `Origin-Consistency-Token` header. Send it back with your next reads and they show the change; see [Read what you just changed](../../platform/access/api.md#read-what-you-just-changed).
- `CreateRoleBinding`, `DeleteRoleBinding`, `CreateServiceAccount`, `RotateServiceAccountSecret` and `CreateServiceAccountKey` take an optional `requestId`, a UUID. A retry with the same `requestId` within 24 hours changes nothing. A role binding retry returns what the first request did; a `CreateServiceAccount`, `RotateServiceAccountSecret` or `CreateServiceAccountKey` retry is refused, because the client secret or the private key was in the first response only (see the table). The same `requestId` with a different request is refused with `CONFLICT`.
- A duration, such as `secretLifetime`, is written in seconds with an `s` suffix, such as `"7776000s"` for 90 days.

In the REST API, a role binding and the `member` and `actor` filters take a member by its full name, and only by it: `//iam.origincloudapis.eu/users/<user-id>` for a user, `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>` for one of the organization's own service accounts, or `//iam.origincloudapis.eu/serviceAgents/<name>` for a [service agent](../service-agents.md) of the platform, bound in any organization but only to a role its service needs. Responses show every member, `creator`, audit `actor` and `target` the same way. A binding stays with the account, so it follows a later change of address.

- Binding a user ID that no enabled account has, or a service account of another organization, is refused with `NOT_FOUND`. The `member` and `actor` filters only read a full name: a user whose account is gone still finds the audit entries of their changes.
- An email address (`user:<email>`), a relative name such as `users/<user-id>` and the older forms `serviceAccount:<id>` and `serviceAgent:<name>` are refused with `INVALID_ARGUMENT`. `LookupUser` answers the user whose account verified an address.
- A change the platform made itself names it among its internal services, such as `//iam.origincloudapis.eu/services/kms` for the KMS destroying a deleted key's material.

A role is named `roles/<role>`, such as `roles/iam.editor`. A role binding takes and shows it by its full name, such as `//iam.origincloudapis.eu/roles/iam.editor`; a role's `includedPermissions` are full names too, such as `//iam.origincloudapis.eu/permissions/iam.role.assign`. A project is named by its full name, `//resourcemanager.origincloudapis.eu/projects/<project-id>`, in a binding, an audit entry and both filters.

| Method | HTTP | Does |
|---|---|---|
| `ListRoles`, `GetRole` | `GET /v1beta1/roles`, `GET /v1beta1/roles/<role>` | The built-in roles. Needs no permission. |
| `ListPermissions`, `GetPermission` | `GET /v1beta1/permissions`, `GET /v1beta1/permissions/<key>` | Every permission. Needs no permission. |
| `TestIamPermissions` | `POST /v1beta1/organizations/<org-id>:testIamPermissions`, `POST /v1beta1/projects/<project-id>:testIamPermissions` | Which of the permissions you send you hold there. |
| `ListRoleBindings`, `GetRoleBinding` | `GET /v1beta1/organizations/<org-id>/roleBindings` | The organization's role bindings, optionally one member's or one project's. `organizations/-` lists your own, in every organization. |
| `CreateRoleBinding` | `POST /v1beta1/organizations/<org-id>/roleBindings` | Grants a role to a member, org-wide or in one project. |
| `DeleteRoleBinding` | `DELETE /v1beta1/organizations/<org-id>/roleBindings/<id>` | Removes one role binding. |
| `ListServiceAccounts`, `GetServiceAccount` | `GET /v1beta1/organizations/<org-id>/serviceAccounts` | The organization's service accounts; deleted ones with `showDeleted`. An `EXTERNAL` one's `secretExpireTime` says when its client secret expires. |
| `CreateServiceAccount` | `POST /v1beta1/organizations/<org-id>/serviceAccounts` | Creates a service account. Its `clientSecret` is in this response only. The secret expires after `secretLifetime`: 90 days when it's left out, at most 365 days; a `WORKLOAD` service account takes none. A retry with the same `requestId` is refused with `CONFLICT`, and the `metadata` of its `ErrorInfo` detail names the account under `serviceAccount`: delete that account and create a new one, or rotate its secret, to get a working secret. |
| `RotateServiceAccountSecret` | `POST /v1beta1/organizations/<org-id>/serviceAccounts/<id>:rotateSecret` | Issues a new client secret for an `EXTERNAL` service account, in this response only, and refuses the old one at once. The new secret expires after `secretLifetime`, 90 days when it's left out, at most 365 days. Needs `iam.service_account.create`. See [Rotate the client secret](../service-accounts.md#rotate-the-client-secret). |
| `DeleteServiceAccount` | `DELETE /v1beta1/organizations/<org-id>/serviceAccounts/<id>` | Revokes a service account for good, with every role binding it holds. |
| `ListFederatedCredentials` | `GET /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/federatedCredentials` | A `WORKLOAD` service account's trust policies for CI providers' OIDC tokens. `showDeleted` includes deleted ones. |
| `GetFederatedCredential` | `GET /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/federatedCredentials/<id>` | One federated credential, deleted or not. |
| `CreateFederatedCredential` | `POST /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/federatedCredentials` | Trusts tokens of an issuer and audience that carry the given claims. Needs `iam.service_account.create` and `iam.service_account.act_as`. |
| `DeleteFederatedCredential` | `DELETE /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/federatedCredentials/<id>` | Stops trusting them: no token is exchanged for it from then on, and those exchanged before are refused at their next call. |
| `ListServiceAccountKeys`, `GetServiceAccountKey` | `GET /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/keys` | A service account's keys: `name`, `algorithm`, `createTime`, `lastUseTime` (unset until a key is used) and `state`, never a private key. `showDeleted` includes deleted ones. Needs `iam.service_account_key.list` or `iam.service_account_key.get`. |
| `CreateServiceAccountKey` | `POST /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/keys` with the body `{}` | Generates an `ES256` key for an `EXTERNAL` service account. Its `credentialsFile`, a JSON document with the key's and the account's full names and the private key, is in this response only: the platform keeps only the public key. Needs `iam.service_account_key.create` and `iam.service_account.act_as`. An account has at most 10 keys that aren't deleted: an 11th is refused with `CONFLICT`. A `WORKLOAD` service account is refused with `INVALID_ARGUMENT`. A retry with the same `requestId` is refused with `CONFLICT`, its `ErrorInfo` metadata naming the key under `serviceAccountKey`: delete that key and create a new one. |
| `DeleteServiceAccountKey` | `DELETE /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/keys/<id>` | Deletes a key. It stays readable as `DELETED`. Deleting a service account deletes its keys. |
| `GetUser` | `GET /v1beta1/users/me` | Your own profile. |
| `LookupUser` | `GET /v1beta1/users:lookup?email=<email>&organization=//resourcemanager.origincloudapis.eu/organizations/<org-id>` | The user whose account verified `email`, by their `name` and their full name, `member`, which a role binding takes. Needs `iam.role.assign` on the organization. `NOT_FOUND` when no enabled account verified the address, `CONFLICT` when more than one did. Given and family names are left empty. |
| `ListAuditLogEntries`, `GetAuditLogEntry` | `GET /v1beta1/organizations/<org-id>/auditLogEntries` | The audit log's recent entries, 90 days by default. See [Audit log](../audit-log.md#in-the-rest-api). |

Invites and members are in the GraphQL API only.

## Security token service

The security token service answers at `https://sts.origincloudapis.eu`. It's a preview (`v1beta1`). It authenticates no caller: the token in the request is the proof. See [Workload identity federation](../workload-identity-federation.md) for what it checks.

| Method | HTTP | Does |
|---|---|---|
| `AssumeServiceAccount` | `POST /v1beta1:assumeServiceAccount` | Exchanges an OIDC token (`oidcToken`) for the access token of the `WORKLOAD` service account one of whose federated credentials trusts it. `serviceAccount`, the account's full name, `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>`, limits it to that account's credentials; a relative name is refused with `BAD_REQUEST`. `lifetime`, such as `"900s"`, from 60 seconds to an hour, sets the access token's lifetime. `audience` is who the access token is for: `origincloud:api`, the platform's APIs, when unset, or `https://mcp.origincloudapis.eu`, the hosted MCP server, whose token the APIs refuse; any other is refused with `INVALID_ARGUMENT` (400). Answers `accessToken`, `expireTime`, and `serviceAccount` and `federatedCredential` as full names. A token no credential trusts is refused with `PERMISSION_DENIED` (403), without saying why. |

The same exchange is an OAuth 2.0 token exchange request (RFC 8693) at `POST /v1/token`, for OAuth clients: the form fields `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`, `subject_token` and `subject_token_type=urn:ietf:params:oauth:token-type:jwt`, optionally `requested_token_lifetime` in seconds and `audience`, as above; an audience it issues no token for is answered `invalid_target`. [Authenticate from GitHub Actions](../github-actions.md#exchange-the-token-yourself) shows it with curl.

## GraphQL queries

All queries are fields of the `iam` namespace of the query root. They name an organization, a project, a member, a role, an invite and a service account by full names, and show them the same way; see [Use the GraphQL API](../../platform/access/api.md#resource-names).

| Query | Returns |
|---|---|
| `currentUser` | The signed-in user. |
| `currentUserGrants` | Every role assignment the caller holds, in all organizations. |
| `principalGrants` | Every role assignment one principal holds in the organization, with its scope and creation time. Needs `iam.member.list`, like `orgRoleAssignments`. |
| `roles` | Every built-in role with its permissions. |
| `role` | One built-in role by the full name `roles` lists as its `id`. Needs no permission. |
| `permissions` | Every permission the platform defines. |
| `hasPermission` | Whether a member holds a permission on an organization or a project, by its full name. Needs `iam.permission.query` there. |
| `orgMembers` | Every principal with a role assignment in the organization, with its roles' full names. |
| `orgRoleAssignments` | Every role assignment in the organization, with its scope and creation time. |
| `orgInvites` | Pending invites in the organization. |
| `serviceAccounts` | Every service account in the organization, active or revoked, without secrets. |
| `serviceAccountKeys`, `serviceAccountKey` | A service account's keys, active or deleted, without private keys. |
| `auditLogEntries` | One page of the organization's audit log. See [Audit log](../audit-log.md). |

## GraphQL mutations

All mutations are fields of the `iam` namespace of the mutation root.

| Mutation | Effect |
|---|---|
| `assignRole` | Assigns a built-in role to a principal, org-wide or for one project. Only a role whose permissions you hold yourself at that scope, and never to a revoked service account. |
| `revokeRole` | Revokes one role from a principal at exactly the given scope. Only a role whose permissions you hold yourself at that scope. |
| `inviteMember` | Invites a person by email with one org-wide role, which you must be able to assign. |
| `removeMember` | Revokes every role a principal holds in the organization, if you could revoke each of them. |
| `revokeInvite` | Cancels a pending invite. |
| `createServiceAccount` | Creates a service account and returns its client ID and one-time client secret. |
| `revokeServiceAccount` | Disables a service account's credential and removes every role assignment it holds. Permanent. |
| `createServiceAccountKey` | Generates a key for an `EXTERNAL` service account and returns its one-time `credentialsFile`. |
| `deleteServiceAccountKey` | Deletes a service account key. |
