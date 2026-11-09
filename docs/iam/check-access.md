---
id: check-access
title: Check access
description: Look up who you are and which roles you hold, list the platform's permissions, and test which permissions you hold on a project or organization.
page_type: task
parent: home
nav_order: 60
tags: [iam, roles, cli, api]
last_reviewed: 2026-11-04
---

# Check access

You can check access before you act instead of handling a permission error afterward. This is useful in automation that needs to know whether a call will succeed, and when you investigate why a request was refused.

## Before you begin

- To see your own profile, your own role bindings and the list of permissions, and to test your own permissions: any signed-in user. A service account can do all of it except read a profile, which it doesn't have.
- To list another member's role bindings: `iam.member.list` on the organization, which `roles/owner`, `roles/viewer` and `roles/iam/editor` grant org-wide.
- To check whether another principal holds a permission: `roles/owner` that covers the resource you check. Only the GraphQL API offers this check.

## Check who you are

Show your own profile. Others bind a role to you as the `member` it shows: `user:<email>` once your email address is verified.

```sh
origin iam get-user --user me
```

Example output (illustrative):

```json
{
  "name": "users/3f6e1c2a-8b4d-4e5f-9a1b-2c3d4e5f6a7b",
  "member": "user:jane@example.com",
  "email": "jane@example.com",
  "emailVerified": true,
  "givenName": "Jane",
  "familyName": "Doe"
}
```

## List your own role bindings

List every role binding you hold, across all organizations you belong to. A binding without a `project` is org-wide.

```sh
origin iam list-role-bindings --organization -
```

## List another member's role bindings

List every role a member holds in the organization, each binding with its project:

```sh
origin iam list-role-bindings --organization <org-id> --member user:jane@example.com
```

Leave out `--member` to list every binding in the organization. See [Manage organization members](manage-members.md#list-members-and-invites).

## Find a permission key

List every permission the platform checks, with what it allows.

```sh
origin iam list-permissions
```

For the permissions each role grants, see [Built-in roles](roles.md).

## Check your permissions on a project or organization

1. Pick the permissions a task needs, by key, and the project or organization it acts on. Every resource in a project is governed by the project's permissions, so asking about the project answers for each of its resources.

2. Ask which of them you hold. Repeat `--permission` for each key, up to 100.

   ```sh
   origin iam test-iam-permissions --resource projects/<project-id> \
     --permission compute.instance.launch \
     --permission network.vpc.create
   ```

3. Read the result: it lists the permissions you hold there. A request that needs a permission missing from the list would be refused with [`FORBIDDEN`](../platform/reference/errors.md#forbidden).

A permission held on the organization counts for each of its projects; one held on a project counts only there. A key the catalog doesn't name is never held. To test a service account's permissions, run the command with its credential; see [Run commands as a service account](../platform/access/cli.md#run-commands-as-a-service-account). See [How a request is authorized](access-model.md#how-a-request-is-authorized).

## Using the API

In the REST API, these are `GetUser`, `ListRoleBindings`, `ListPermissions` and `TestIamPermissions`; see the [IAM reference](reference/index.md#rest-api). The GraphQL queries are `currentUser`, `currentUserGrants`, `orgMembers`, `orgRoleAssignments`, `permissions` and `hasPermission`, all in the `iam` namespace. `hasPermission` checks any principal's permission on one resource, by its URN:

```graphql
query {
  iam {
    hasPermission(input: {
      principal: "user:<user-id>"
      permissionKey: "network.vpc.create"
      onResourceUrn: "<resource-urn>"
    })
  }
}
```

## Related

- [Access model](access-model.md)
- [Built-in roles](roles.md)
- [`origin iam` commands](reference/cli.md)
