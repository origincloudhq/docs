---
id: reference
title: IAM reference
nav_title: Reference
description: Where to find every origin iam command and built-in role, and a one-line summary of each IAM operation in the REST API.
page_type: reference
parent: home
nav_order: 80
tags: [iam, reference, cli, api]
last_reviewed: 2026-11-26
---

# IAM reference

Look up exact commands, roles and API operations here. For how IAM works, see [Access model](../access-model.md).

## Reference pages

**CLI commands**  
Every `origin iam` command with its options. See [`origin iam` commands](cli.md).

**Built-in roles**  
Every role with its ID, full name and permissions. See [Built-in roles](../roles.md).

**Errors**  
Error codes shared by every API operation. See [Errors](../../platform/reference/errors.md).

## REST API

The IAM REST API answers at `https://iam.origincloudapis.eu`. It's a preview (`v1beta1`): names and fields may still change. Every request carries an access token; see [Use the REST APIs](../../platform/access/api.md#authenticate).

- A change's response carries an `Origin-Consistency-Token` header. Send it back with your next reads and they show the change; see [Read what you just changed](../../platform/access/api.md#read-what-you-just-changed).
- `CreateRoleBinding`, `UpdateRoleBinding`, `DeleteRoleBinding`, `CreateServiceAccount` and `CreateServiceAccountKey` take an optional `requestId`, a UUID. A retry with the same `requestId` within 24 hours changes nothing. A `CreateRoleBinding` or `CreateServiceAccount` retry returns what the first request did, an `UpdateRoleBinding` retry the binding as it is then, and a `DeleteRoleBinding` retry succeeds again; a `CreateServiceAccountKey` retry is refused, because the private key was in the first response only (see the table). The same `requestId` with a different request is refused with `CONFLICT`.

In the REST API, a role binding and the `member` and `actor` filters take a member by its full name: `//iam.origincloudapis.eu/users/<user-id>` for a user, `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>` for one of the organization's own service accounts, or `//iam.origincloudapis.eu/serviceAgents/<name>` for a [service agent](../service-agents.md) of the platform, bound in any organization but only to a role its service needs. Responses show every member, `creator`, audit `actor` and `target` the same way. A binding stays with the account, so it follows a later change of address.

- Binding a user ID that no enabled account has, or a service account of another organization, is refused with `NOT_FOUND`. The `member` and `actor` filters only read a full name: a user whose account is gone still finds the audit entries of their changes.
- `CreateRoleBinding` also takes a user by email address, `user:<email>`: the account that verified it is bound and named by its full name, and an address no account has verified gets a [pending binding](../assign-roles.md#pending-role-bindings). The `member` filter of `ListRoleBindings` takes `user:<email>` for pending bindings. Elsewhere, and a bare address, a relative name such as `users/<user-id>` and the older forms `serviceAccount:<id>` and `serviceAgent:<name>` anywhere, are refused with `INVALID_ARGUMENT`. `LookupUser` answers the user whose account verified an address.
- A change the platform made itself names it among its internal services, such as `//iam.origincloudapis.eu/services/kms` for the KMS destroying a deleted key's material.

A role is named `roles/<role>`, such as `roles/iam.editor`. A role binding takes and shows it by its full name, such as `//iam.origincloudapis.eu/roles/iam.editor`; a role's `includedPermissions` are full names too, such as `//iam.origincloudapis.eu/permissions/iam.role.assign`. A project is named by its full name, `//resourcemanager.origincloudapis.eu/projects/<project-id>`, in a binding, an audit entry and both filters. A binding on one service account names it by its full name in `serviceAccount`, which `ListRoleBindings` filters by too; a binding sets at most one of `project` and `serviceAccount`.

| Method | HTTP | Does |
|---|---|---|
| `ListRoles`, `GetRole` | `GET /v1beta1/roles`, `GET /v1beta1/roles/<role>` | The built-in roles. Needs no permission. |
| `ListPermissions`, `GetPermission` | `GET /v1beta1/permissions`, `GET /v1beta1/permissions/<key>` | Every permission. Needs no permission. |
| `TestIamPermissions` | `POST /v1beta1/organizations/<org-id>:testIamPermissions`, `POST /v1beta1/projects/<project-id>:testIamPermissions` | Which of the permissions you send you hold there, or, with `fullResourceName`, on one resource there. See [Check access](../check-access.md#using-the-api). |
| `ListRoleBindings`, `GetRoleBinding` | `GET /v1beta1/organizations/<org-id>/roleBindings` | The organization's role bindings, active and pending, each with its `state`, each with its `resources`, optionally one member's, one project's or one service account's, or those that apply to one `resource`. A pending binding's `member` is `user:<email>`, which `member` filters by too. `organizations/-` lists your own active bindings, in every organization. See [Pending role bindings](../assign-roles.md#pending-role-bindings). |
| `CreateRoleBinding` | `POST /v1beta1/organizations/<org-id>/roleBindings` | Grants a role to a member, org-wide, in one project or, for `roles/iam.service-account-token-creator` only, on one service account, optionally limited to a list of `resources` there ([Limit a binding to a list of resources](../assign-roles.md#limit-a-binding-to-a-list-of-resources)). With `member` `user:<email>`, binds the account that verified the address, or, when none has, creates an org-wide pending binding and emails the address an invitation, which also needs `iam.member.create`. `CONFLICT` when more than one account verified the address, or the address already holds a pending binding of the role. A retry with the same `requestId` returns the binding the first request created, pending or since activated. |
| `UpdateRoleBinding` | `PATCH /v1beta1/organizations/<org-id>/roleBindings/<id>?updateMask=resources` | Replaces the list of `resources` a binding is limited to; an empty list widens it to its whole scope. `updateMask` must be `resources`, and a pending binding is refused ([Add or remove a resource from a binding](../assign-roles.md#add-or-remove-a-resource-from-a-binding)). |
| `DeleteRoleBinding` | `DELETE /v1beta1/organizations/<org-id>/roleBindings/<id>` | Removes one role binding. Deleting a pending binding withdraws it. |
| `ListServiceAccounts`, `GetServiceAccount` | `GET /v1beta1/organizations/<org-id>/serviceAccounts` | The organization's service accounts; deleted ones with `showDeleted`. |
| `CreateServiceAccount` | `POST /v1beta1/organizations/<org-id>/serviceAccounts` | Creates a service account with no credential: give a `WORKLOAD` one a federated credential, an `EXTERNAL` one a key. A retry with the same `requestId` returns the account the first request created. |
| `DeleteServiceAccount` | `DELETE /v1beta1/organizations/<org-id>/serviceAccounts/<id>` | Revokes a service account for good, with every role binding it holds. |
| `ListFederatedCredentials` | `GET /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/federatedCredentials` | A `WORKLOAD` service account's trust policies for CI providers' OIDC tokens. `showDeleted` includes deleted ones. |
| `GetFederatedCredential` | `GET /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/federatedCredentials/<id>` | One federated credential, deleted or not. |
| `CreateFederatedCredential` | `POST /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/federatedCredentials` | Trusts tokens of an issuer and audience that carry the given claims. Needs `iam.service_account.create` and `iam.service_account.act_as`. |
| `DeleteFederatedCredential` | `DELETE /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/federatedCredentials/<id>` | Stops trusting them: no token is exchanged for it from then on, and those exchanged before are refused at their next call. |
| `ListServiceAccountKeys`, `GetServiceAccountKey` | `GET /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/keys` | A service account's keys: `name`, `algorithm`, `createTime`, `lastUseTime` (when the security token service last exchanged an assertion signed with it, to within an hour; unset until then) and `state`, never a private key. `showDeleted` includes deleted ones. Needs `iam.service_account_key.list` or `iam.service_account_key.get`. |
| `CreateServiceAccountKey` | `POST /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/keys` with the body `{}` | Generates an `ES256` key for an `EXTERNAL` service account. Its `credentialsFile`, a JSON document with the key's and the account's full names and the private key, is in this response only: the platform keeps only the public key. Needs `iam.service_account_key.create` and `iam.service_account.act_as`. An account has at most 10 keys that aren't deleted: an 11th is refused with `CONFLICT`. A `WORKLOAD` service account is refused with `INVALID_ARGUMENT`. A retry with the same `requestId` is refused with `CONFLICT`, its `ErrorInfo` metadata naming the key under `serviceAccountKey`: delete that key and create a new one. |
| `DeleteServiceAccountKey` | `DELETE /v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/keys/<id>` | Deletes a key. It stays readable as `DELETED`. Deleting a service account deletes its keys. |
| `GetUser` | `GET /v1beta1/users/me` | Your own profile. |
| `ActivatePendingRoleBindings` | `POST /v1beta1/users/me:activatePendingRoleBindings` with the body `{}` | Activates the [pending role bindings](../assign-roles.md#pending-role-bindings) for your email address, once your account has verified it, and returns your `User`, like `GetUser`. Takes `users/me` or your own `users/<user-id>`. An unverified address activates nothing; a repeat call activates only what was granted since. A service account is refused with `BAD_REQUEST`, another user's name with `NOT_FOUND`. A client such as the console calls it after you sign in. |
| `LookupUser` | `GET /v1beta1/users:lookup?email=<email>&organization=//resourcemanager.origincloudapis.eu/organizations/<org-id>` | The user whose account verified `email`, by their `name` and their full name, `member`, which a role binding takes. Needs `iam.role.assign` on the organization. `NOT_FOUND` when no enabled account verified the address, `CONFLICT` when more than one did. Given and family names are left empty. |
| `ListAuditLogEntries`, `GetAuditLogEntry` | `GET /v1beta1/organizations/<org-id>/auditLogEntries` | The audit log's recent entries, 90 days by default. See [Audit log](../audit-log.md#paging-through-the-log). |

An invitation is a pending role binding: the REST API creates, lists and withdraws it with the role binding methods. There is no member or invite resource.

## Security token service

The security token service answers at `https://sts.origincloudapis.eu`. It's a preview (`v1beta1`). It authenticates no caller: the token or assertion in the request is the proof. See [Workload identity federation](../workload-identity-federation.md) for what it checks of an OIDC token, and [Service account keys](#service-account-keys) below for a key's assertion.

| Method | HTTP | Does |
|---|---|---|
| `AssumeServiceAccount` | `POST /v1beta1:assumeServiceAccount` | Exchanges an OIDC token (`oidcToken`) for the access token of the `WORKLOAD` service account one of whose federated credentials trusts it. `serviceAccount`, the account's full name, `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>`, limits it to that account's credentials; a relative name is refused with `BAD_REQUEST`. `lifetime`, such as `"900s"`, from 60 seconds to an hour, sets the access token's lifetime. `audience` is who the access token is for: `origincloud:api`, the platform's APIs, when unset, or `https://mcp.origincloudapis.eu`, the hosted MCP server, whose token the APIs refuse; any other is refused with `INVALID_ARGUMENT` (400). Answers `accessToken`, `expireTime`, and `serviceAccount` and `federatedCredential` as full names. A token no credential trusts is refused with `PERMISSION_DENIED` (403), without saying why. |

The same exchange is an OAuth 2.0 token exchange request (RFC 8693) at `POST /v1/token`, for OAuth clients: the form fields `grant_type=urn:ietf:params:oauth:grant-type:token-exchange`, `subject_token` and `subject_token_type=urn:ietf:params:oauth:token-type:jwt`, optionally `requested_token_lifetime` in seconds and `audience`, as above; an audience it issues no token for is answered `invalid_target`. [Authenticate from GitHub Actions](../github-actions.md#exchange-the-token-yourself) shows it with curl.

### Service account keys

An `EXTERNAL` service account exchanges an assertion signed with one of its [keys](#rest-api) for its access token with an OAuth 2.0 JWT bearer grant (RFC 7523) at `POST /v1/token`: the form fields `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer` and `assertion`, optionally `requested_token_lifetime` in seconds and `audience`, as for `AssumeServiceAccount`.

The assertion is a JWT signed `ES256` with the key's private key from the credentials file:

| Part | Value |
|---|---|
| Header `alg` | `ES256` |
| Header `kid` | The key's full name, `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>/keys/<key-id>` (the credentials file's `name`) |
| `iss` and `sub` | The service account's full name, `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>` (the credentials file's `service_account`) |
| `aud` | `https://sts.origincloudapis.eu` (the credentials file's `sts_endpoint`) or `https://sts.origincloudapis.eu/v1/token` |
| `iat` and `exp` | When it was made and when it expires, in seconds since the epoch: at most an hour apart. `iat` may be up to a minute ahead of the service's clock. An optional `nbf` is checked the same way. |
| `jti` | An ID you never use again with this key, up to 128 bytes |

The security token service refuses the assertion when the key is deleted or isn't the account's, the signature doesn't verify, `aud` isn't one of the two above, it has expired or lives longer than an hour, its `jti` was used before, or the account is deleted or isn't an `EXTERNAL` one. A refusal is answered `invalid_grant` (400) without saying why; the [audit log](../audit-log.md) records the reason. A key you have just created takes a few seconds to reach every availability zone: until it has, its assertion is answered `temporarily_unavailable` (503), which the SDKs retry, for up to a minute after the assertion's `iat`; a key that still isn't known after that is refused as deleted.

A token is answered as RFC 6749 answers one: `access_token`, `token_type` `Bearer` and `expires_in`, by default 15 minutes, between 60 seconds and an hour with `requested_token_lifetime`. Its `sub` is the service account's full name. The platform's APIs accept it as the service account while the key isn't deleted and the account is an active `EXTERNAL` one, so deleting the key or the account stops its access tokens at their next call.

```bash
curl -s https://sts.origincloudapis.eu/v1/token \
  -d grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer \
  -d assertion="$ASSERTION"
```
