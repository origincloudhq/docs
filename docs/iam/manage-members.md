---
id: manage-members
title: Manage organization members
nav_title: Manage members
description: Add people to your organization by email, list members and pending role bindings, remove a member's access, and withdraw an invitation before it applies.
page_type: task
parent: home
nav_order: 40
tags: [iam, organizations, cli, api]
last_reviewed: 2026-11-24
---

# Manage organization members

A member is any principal with at least one role binding in your organization. There is no separate member or invite resource: you add someone by granting them a role, and remove them by deleting their bindings. To change the roles of an existing member, [assign and revoke roles](assign-roles.md).

You can name a person by their email address, even before they have an account. If the address has none, the grant is a [pending role binding](assign-roles.md#pending-role-bindings) and the platform emails them an invitation.

## Before you begin

- To add a member by an address that has no account yet: an org-wide `roles/owner` assignment. You can only grant a role you could assign yourself. See [Who can assign a role](access-model.md#who-can-assign-a-role).
- To add a member who already has an account, or to remove one: an org-wide `roles/owner` or `roles/iam.editor` assignment, and every permission of each role you grant or revoke.
- To list members and pending role bindings: an org-wide `roles/owner`, `roles/viewer` or `roles/iam.editor` assignment.

## Add a member

1. Bind a role to the person's email address. For what each role allows, see [Built-in roles](roles.md).

   ```sh
   origin iam create-role-binding --organization <org-id> \
     --member user:jane@example.com \
     --role //iam.origincloudapis.eu/roles/viewer
   ```

   What happens next depends on whether an Origin Cloud account has verified the address:

   - **Account exists:** the role is granted immediately, and the binding's `member` is the user's full name. There's no separate step to accept.
   - **No account yet:** the binding is created with `state` `PENDING`, org-wide, and the platform emails the address an invitation to sign up. The binding becomes active the first time someone signs up with that address, verifies it and signs in, to the console or with `origin id login`. If by then you can no longer assign the role yourself, it's dropped instead.

   Delivery of the email is best effort: a bounced or delayed email doesn't affect the binding.

2. Verify the binding. A pending binding is listed by its address:

   ```sh
   origin iam list-role-bindings --organization <org-id> --member user:jane@example.com
   ```

A pending binding is always org-wide. To give someone access to a single project only, ask them to sign up first, then [bind a project-scoped role](assign-roles.md) to their address or full name.

In the console, the **Access** page adds a member with **Send invite**, which does the same for an org-wide role.

## List members and pending role bindings

- [`list-role-bindings`](reference/cli.md#list-role-bindings) lists the organization's role bindings: each member with one role, org-wide or in one project, and each pending binding with its address, `user:<email>`, and `state` `PENDING`. Add `--member //iam.origincloudapis.eu/users/<user-id>` or `--member user:<email>` for one member's bindings, or `--project //resourcemanager.origincloudapis.eu/projects/<project-id>` for one project's.

  ```sh
  origin iam list-role-bindings --organization <org-id>
  ```

- The console's **Access** page shows every principal with a role, at any scope, with its grants, and the pending bindings under pending invites: the email address, role, who created it and when. A pending binding disappears from that list once it activates or is withdrawn.

## Remove a member

Removing a member revokes every role the principal holds in the organization, org-wide and in every project. To take away a single role, [revoke the role](assign-roles.md#revoke-a-role) instead.

With the CLI, delete each of the member's bindings with [`delete-role-binding`](reference/cli.md#delete-role-binding). In the console:

1. On the **Access** page, find the member and choose **Remove access**.

2. Confirm with **Remove**.

3. Check that the member is gone from the list.

If the member is the organization's last org-wide owner, the platform refuses with [`CONFLICT`](../platform/reference/errors.md#conflict) and removes nothing. See [The last owner is protected](access-model.md#the-last-owner-is-protected). If the member holds a role you couldn't revoke yourself, such as a billing role when you hold none, the platform refuses with [`FORBIDDEN`](../platform/reference/errors.md#forbidden) and removes nothing.

## Withdraw an invitation

An invitation is a pending role binding, so you withdraw it by deleting the binding. A sign-in with its address afterwards grants nothing.

```sh
origin iam delete-role-binding --organization <org-id> \
  --role-binding <role-binding-id> --yes
```

In the console, find it under the pending invites on the **Access** page and choose **Revoke**. Removing a member acts only on their active bindings, so it doesn't withdraw a pending one.

## Using the API

In the REST API, add a member with `CreateRoleBinding` and `member` set to `user:<email>`, list members with `ListRoleBindings`, and remove one or withdraw an invitation with `DeleteRoleBinding`. See [Assign and revoke roles](assign-roles.md) and the [IAM reference](reference/index.md#rest-api).

The GraphQL fields `inviteMember`, `removeMember`, `revokeInvite`, `orgMembers` and `orgInvites`, in the `iam` namespace, are the older path the console still uses. New integrations should use the REST API.

## Related

- [Assign and revoke roles](assign-roles.md)
- [Access model](access-model.md)
- [Organizations](../platform/organizations/index.md)
- [Audit log](audit-log.md) – grants, pending bindings, withdrawals and removals are recorded
