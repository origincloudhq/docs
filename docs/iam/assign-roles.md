---
id: assign-roles
title: Assign and revoke roles
description: Bind a built-in role to a user or service account org-wide or for one project, and delete the binding to revoke it.
page_type: task
parent: home
nav_order: 30
tags: [iam, roles, cli, api]
last_reviewed: 2026-11-04
---

# Assign and revoke roles

Assign a role to give a user or service account access, and revoke it to take that access away. In the `origin iam` commands and the REST API, each assignment is a role binding: one role for one member, org-wide or in one project. A change takes effect on the member's next request. A user needs an Origin Cloud account before you can bind a role to them; to give access to someone who hasn't signed up yet, [invite them](manage-members.md).

## Before you begin

- An org-wide `roles/owner` or `roles/iam/editor` assignment, and every permission of the role you assign or revoke at the scope of the binding. For example, an Owner needs `roles/billing/administrator` as well to assign a billing role. See [Who can assign a role](access-model.md#who-can-assign-a-role).
- Your organization ID (`<org-id>`) and, for a project-scoped binding, the project ID (`<project-id>`).
- The member: `user:<email>`, the verified email address of the person's account, or `serviceAccount:<service-account-id>`. See [Principals](access-model.md#principals).

## Assign a role

1. Find the role's name. The command lists every built-in role with its permissions; a name writes the catalog's slashes as dots, such as `roles/iam.editor` for IAM Editor.

   ```sh
   origin iam list-roles
   ```

   For the permissions of each role, see [Built-in roles](roles.md).

2. Bind the role to the member. Omit `--project` for an org-wide binding.

   ```sh
   origin iam create-role-binding --organization <org-id> \
     --member user:jane@example.com \
     --role roles/viewer
   ```

   To limit the binding to one project, add `--project projects/<project-id>`. A project-scoped binding applies only to resources in that project; it never allows IAM operations. See [Role assignments and scopes](access-model.md#role-assignments-and-scopes).

3. Verify the binding. The output lists the member's bindings, each with its role and project.

   ```sh
   origin iam list-role-bindings --organization <org-id> --member user:jane@example.com
   ```

The platform refuses the binding, and changes nothing, in these cases:

- No account has the address as its verified email: [`NOT_FOUND`](../platform/reference/errors.md#not_found).
- The member already holds the role at that scope: [`CONFLICT`](../platform/reference/errors.md#conflict). A retry of the command with the same `--request-id` within a day returns the binding the first one created instead.
- The role has permissions you don't hold yourself at that scope: [`FORBIDDEN`](../platform/reference/errors.md#forbidden).
- The member is a deleted service account: [`BAD_REQUEST`](../platform/reference/errors.md#bad_request).

## Revoke a role

1. Find the binding's ID in the member's bindings.

   ```sh
   origin iam list-role-bindings --organization <org-id> --member user:jane@example.com
   ```

2. Delete the binding. Deleting can't be undone, so the command needs `--yes`.

   ```sh
   origin iam delete-role-binding --organization <org-id> \
     --role-binding <role-binding-id> --yes
   ```

3. Optionally, run `list-role-bindings` again to check that the binding is gone.

Deleting a binding removes that one binding only, whoever created it: another binding of the same role at another scope stays. Deleting a binding needs `iam.role.revoke` on the organization and every permission of its role at its scope, so a binding of a role with permissions you don't hold yourself is refused with [`FORBIDDEN`](../platform/reference/errors.md#forbidden).

If the binding is the organization's last org-wide `roles/owner` binding, the platform refuses with [`CONFLICT`](../platform/reference/errors.md#conflict) and removes nothing. Bind `roles/owner` org-wide to someone else first. See [The last owner is protected](access-model.md#the-last-owner-is-protected).

To take away every role a member holds in the organization, delete each of their bindings, or [remove the member](manage-members.md#remove-a-member) in the console.

## Using the API

In the REST API, these are `CreateRoleBinding` and `DeleteRoleBinding`; see the [IAM reference](reference/index.md#rest-api). In the GraphQL API, the `assignRole` and `revokeRole` mutations take the same input, with the principal by user ID and the role by URN. Omit `projectId` for an org-wide grant.

```graphql
mutation {
  iam {
    assignRole(input: {
      orgId: "<org-id>"
      principal: "user:<user-id>"
      roleUrn: "urn:origin:cloud:iam::::builtin/role/roles/viewer"
    })
  }
}
```

## Related

- [Access model](access-model.md)
- [Built-in roles](roles.md)
- [`create-role-binding`](reference/cli.md#create-role-binding) and [`delete-role-binding`](reference/cli.md#delete-role-binding) commands
- [Audit log](audit-log.md) – every assignment and revocation is recorded
