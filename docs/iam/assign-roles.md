---
id: assign-roles
title: Assign and revoke roles
description: Bind a built-in role to a user or service account org-wide or for one project, and delete the binding to revoke it.
page_type: task
parent: home
nav_order: 30
tags: [iam, roles, cli, api]
last_reviewed: 2026-11-24
---

# Assign and revoke roles

Assign a role to give a user or service account access, and revoke it to take that access away. In the `origin iam` commands and the REST API, each assignment is a role binding: one role for one member, org-wide or in one project. A change takes effect on the member's next request. A user needs an Origin Cloud account before you can bind a role to them; to give access to someone who hasn't signed up yet, [invite them](manage-members.md).

## Before you begin

- An org-wide `roles/owner` or `roles/iam.editor` assignment, and every permission of the role you assign or revoke at the scope of the binding. For example, an Owner needs `roles/billing.administrator` as well to assign a billing role. See [Who can assign a role](access-model.md#who-can-assign-a-role).
- Your organization ID (`<org-id>`) and, for a project-scoped binding, the project ID (`<project-id>`).
- The member, by its full name: a user, `//iam.origincloudapis.eu/users/<user-id>`, one of the organization's service accounts, `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>`, or a platform service agent such as `//iam.origincloudapis.eu/serviceAgents/compute`, which can hold only the roles its service needs. An email address names no member: find a user's full name by their verified address with `origin iam lookup-user --email jane@example.com --organization //resourcemanager.origincloudapis.eu/organizations/<org-id>`, the `member` it answers. See [Principals](access-model.md#principals) and [Service agents](service-agents.md).

## Assign a role

1. Find the role's name, such as `roles/iam.editor` for IAM Editor; a binding takes its full name, `//iam.origincloudapis.eu/roles/iam.editor`. The command lists every built-in role with its permissions.

   ```sh
   origin iam list-roles
   ```

   For the permissions of each role, see [Built-in roles](roles.md).

2. Bind the role to the member. Omit `--project` for an org-wide binding.

   ```sh
   origin iam create-role-binding --organization <org-id> \
     --member //iam.origincloudapis.eu/users/<user-id> \
     --role //iam.origincloudapis.eu/roles/viewer
   ```

   To limit the binding to one project, add `--project //resourcemanager.origincloudapis.eu/projects/<project-id>`. A project-scoped binding applies only to resources in that project; it never allows IAM operations. See [Role assignments and scopes](access-model.md#role-assignments-and-scopes).

3. Verify the binding. The output lists the member's bindings, each with its role and project.

   ```sh
   origin iam list-role-bindings --organization <org-id> --member //iam.origincloudapis.eu/users/<user-id>
   ```

The platform refuses the binding, and changes nothing, in these cases:

- The user has no enabled account, or the service account is another organization's: [`NOT_FOUND`](../platform/reference/errors.md#not_found).
- The member, role or project isn't a full name, such as `user:jane@example.com` or `roles/viewer`: [`BAD_REQUEST`](../platform/reference/errors.md#bad_request).
- The member already holds the role at that scope: [`CONFLICT`](../platform/reference/errors.md#conflict). A retry of the command with the same `--request-id` within a day returns the binding the first one created instead.
- The role has permissions you don't hold yourself at that scope: [`FORBIDDEN`](../platform/reference/errors.md#forbidden).
- The member is a deleted service account: [`BAD_REQUEST`](../platform/reference/errors.md#bad_request).

## Revoke a role

1. Find the binding's ID in the member's bindings.

   ```sh
   origin iam list-role-bindings --organization <org-id> --member //iam.origincloudapis.eu/users/<user-id>
   ```

2. Delete the binding. Deleting can't be undone, so the command needs `--yes`.

   ```sh
   origin iam delete-role-binding --organization <org-id> \
     --role-binding <role-binding-id> --yes
   ```

3. Optionally, run `list-role-bindings` again to check that the binding is gone.

Deleting a pending binding withdraws the invitation; see [Pending role bindings](#pending-role-bindings). Deleting a binding removes that one binding only, whoever created it: another binding of the same role at another scope stays. Deleting a binding needs `iam.role.revoke` on the organization and every permission of its role at its scope, so a binding of a role with permissions you don't hold yourself is refused with [`FORBIDDEN`](../platform/reference/errors.md#forbidden).

If the binding is the organization's last org-wide `roles/owner` binding, the platform refuses with [`CONFLICT`](../platform/reference/errors.md#conflict) and removes nothing. Bind `roles/owner` org-wide to someone else first. See [The last owner is protected](access-model.md#the-last-owner-is-protected).

To take away every role a member holds in the organization, delete each of their bindings, or [remove the member](manage-members.md#remove-a-member) in the console.

## Pending role bindings

A role granted to an email address that has no account yet is a pending role binding. Today you create one with an invite in the console ([Manage organization members](manage-members.md#invite-a-member)). `list-role-bindings` and the REST API show it with `state` `PENDING` and the address as its member, `user:<email>`, such as `user:jane@example.com`. An active binding has `state` `ACTIVE`.

A pending binding grants nothing and counts toward no permission check. It is always org-wide. When someone signs up with its address and verifies it, it becomes active: its member becomes the new user's full name, and its name stays the same. It activates only while whoever created it can still assign the role; otherwise it's dropped.

To withdraw a pending binding, delete it as in [Revoke a role](#revoke-a-role). A sign-in with its address afterwards grants nothing. Withdrawing needs the same permissions as deleting an active binding: `iam.role.revoke` and every permission of its role on the organization.

In the REST API, `ListRoleBindings` lists the pending bindings for one address when its `member` filter is `user:<email>`, matched without regard to case:

```sh
curl -H "Authorization: Bearer $TOKEN" \
  "https://iam.origincloudapis.eu/v1beta1/organizations/<org-id>/roleBindings?member=user:jane@example.com"
```

## Using the API

In the REST API, these are `CreateRoleBinding` and `DeleteRoleBinding`; see the [IAM reference](reference/index.md#rest-api). In the GraphQL API, the `assignRole` and `revokeRole` mutations take the same input as full names: the `organisation`, the `member`, the `role` and, for a grant on one project, the `project`. Omit `project` for an org-wide grant.

```graphql
mutation {
  iam {
    assignRole(input: {
      organisation: "//resourcemanager.origincloudapis.eu/organizations/<org-id>"
      member: "//iam.origincloudapis.eu/users/<user-id>"
      role: "//iam.origincloudapis.eu/roles/viewer"
    })
  }
}
```

## Related

- [Access model](access-model.md)
- [Built-in roles](roles.md)
- [`create-role-binding`](reference/cli.md#create-role-binding) and [`delete-role-binding`](reference/cli.md#delete-role-binding) commands
- [Audit log](audit-log.md) – every assignment and revocation is recorded
