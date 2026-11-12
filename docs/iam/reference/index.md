---
id: reference
title: IAM reference
nav_title: Reference
description: Where to find every origin iam command and built-in role, and a one-line summary of each IAM operation in the GraphQL and REST APIs.
page_type: reference
parent: home
nav_order: 80
tags: [iam, reference, cli, api]
last_reviewed: 2026-11-11
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
- `CreateRoleBinding`, `DeleteRoleBinding`, `CreateServiceAccount` and `RotateServiceAccountSecret` take an optional `requestId`, a UUID. A retry with the same `requestId` within 24 hours changes nothing. A role binding retry returns what the first request did; a `CreateServiceAccount` or `RotateServiceAccountSecret` retry is refused, because the client secret was in the first response only (see the table). The same `requestId` with a different request is refused with `CONFLICT`.
- A duration, such as `secretLifetime`, is written in seconds with an `s` suffix, such as `"7776000s"` for 90 days.

In the REST API, a role binding names its member by email: `user:<email>` for the enabled user whose account has that verified email address, or `serviceAccount:<id>` for one of the organization's own service accounts. The binding stays with the account, so it follows a later change of address.

- Binding an address that no account has verified is refused with `NOT_FOUND`.
- Binding an address that more than one account has verified is refused with `CONFLICT`.
- A response shows a user whose current address isn't verified as `userId:<user-id>`, and one whose account is gone as `deleted:user:<user-id>`.
- A list of your own bindings (`organizations/-`) shows who created each one as `userId:<user-id>`.

Role names write the catalog's slashes as dots, such as `roles/iam.editor` for `roles/iam/editor`.

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
| `GetUser` | `GET /v1beta1/users/me` | Your own profile. |
| `ListAuditLogEntries`, `GetAuditLogEntry` | `GET /v1beta1/organizations/<org-id>/auditLogEntries` | The audit log's recent entries, 90 days by default. See [Audit log](../audit-log.md#in-the-rest-api). |

Invites and members are in the GraphQL API only.

## Security token service

The security token service answers at `https://sts.origincloudapis.eu`. It's a preview (`v1beta1`). It authenticates no caller: the token in the request is the proof. See [Workload identity federation](../workload-identity-federation.md) for what it checks.

| Method | HTTP | Does |
|---|---|---|
| `AssumeServiceAccount` | `POST /v1beta1:assumeServiceAccount` | Exchanges an OIDC token (`oidcToken`) for the access token of the `WORKLOAD` service account one of whose federated credentials trusts it. `serviceAccount`, `organizations/<org-id>/serviceAccounts/<service-account-id>`, limits it to that account's credentials. `lifetime`, such as `"900s"`, from 60 seconds to an hour, sets the access token's lifetime. Answers `accessToken`, `expireTime`, `serviceAccount` and `federatedCredential`. A token no credential trusts is refused with `PERMISSION_DENIED` (403), without saying why. |

The same exchange is an OAuth 2.0 token exchange request (RFC 8693) at `POST /v1/token`, for OAuth clients: the form fields `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`, `subject_token` and `subject_token_type=urn:ietf:params:oauth:token-type:jwt`, optionally `requested_token_lifetime` in seconds. [Authenticate from GitHub Actions](../github-actions.md#exchange-the-token-yourself) shows it with curl.

## GraphQL queries

All queries are fields of the `iam` namespace of the query root.

| Query | Returns |
|---|---|
| `currentUser` | The signed-in user. |
| `currentUserGrants` | Every role assignment the caller holds, in all organizations. |
| `principalGrants` | Every role assignment one principal holds in the organization, with its scope and creation time. Needs `iam.member.list`, like `orgRoleAssignments`. |
| `roles` | Every built-in role with its permissions. |
| `role` | One built-in role by the URN `roles` lists. Needs no permission. |
| `permissions` | Every permission the platform defines. |
| `hasPermission` | Whether a principal holds a permission on a resource. |
| `orgMembers` | Every principal with a role assignment in the organization, with its role URNs. |
| `orgRoleAssignments` | Every role assignment in the organization, with its scope and creation time. |
| `orgInvites` | Pending invites in the organization. |
| `serviceAccounts` | Every service account in the organization, active or revoked, without secrets. |
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
