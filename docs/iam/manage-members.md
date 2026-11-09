---
id: manage-members
title: Manage organization members
nav_title: Manage members
description: Invite people to your organization by email in the console, list members, role bindings and pending invites, remove a member's access, and cancel an invite before it applies.
page_type: task
parent: home
nav_order: 40
tags: [iam, organizations, cli, api]
last_reviewed: 2026-11-04
---

# Manage organization members

A member is any principal with at least one role binding in your organization. You add people by email with an invite, which grants them one role org-wide, even before they have an account. To change the roles of an existing member, [assign and revoke roles](assign-roles.md).

Invites and member removal are in the console's **Access** page and the GraphQL API. The `origin` CLI has no invite command; it lists who holds which role with [`list-role-bindings`](reference/cli.md#list-role-bindings).

## Before you begin

- To invite, remove or cancel an invite: an org-wide `roles/owner` assignment. You can only invite with a role you could assign yourself, and only remove a member whose every role you could revoke. See [Who can assign a role](access-model.md#who-can-assign-a-role).
- To list members and invites: an org-wide `roles/owner`, `roles/viewer` or `roles/iam/editor` assignment.

## Invite a member

1. In the console, open **Access** for your organization.

2. Enter the person's email address, pick the role they should get, and choose **Send invite**. For what each role allows, see [Built-in roles](roles.md).

   What happens next depends on whether the email address, matched exactly, already has an Origin Cloud account:

   - **Account exists:** the role is granted org-wide immediately. There's no separate step to accept.
   - **No account yet:** the invite is stored as pending. It's applied the first time that address signs up and signs in, to the console or with `origin id login`. If by then you can no longer assign the role yourself, the invite is dropped instead.

   Either way, the platform emails the invitee. Delivery is best effort: a bounced or delayed email doesn't affect the grant or the pending invite.

3. Verify the invite. An existing account appears among the principals on the **Access** page; a pending invite appears under the pending invites.

Invites are org-wide only. To give someone access to a single project, ask them to sign up first, then [bind a project-scoped role](assign-roles.md) to `user:<email>`.

## List members and invites

- The **Access** page shows every principal with a role, at any scope, with its grants, and the pending invites: the email address, role, who invited them and when. An invite disappears from the list once it's applied or revoked.
- [`list-role-bindings`](reference/cli.md#list-role-bindings) lists the organization's role bindings: each member with one role, org-wide or in one project. Add `--member user:<email>` for one member's bindings, or `--project projects/<project-id>` for one project's.

  ```sh
  origin iam list-role-bindings --organization <org-id>
  ```

## Remove a member

Removing a member revokes every role the principal holds in the organization, org-wide and in every project. To take away a single role, [revoke the role](assign-roles.md#revoke-a-role) instead.

1. On the **Access** page, find the member and choose **Remove access**.

2. Confirm with **Remove**.

3. Check that the member is gone from the list.

If the member is the organization's last org-wide owner, the platform refuses with [`CONFLICT`](../platform/reference/errors.md#conflict) and removes nothing. See [The last owner is protected](access-model.md#the-last-owner-is-protected). If the member holds a role you couldn't revoke yourself, such as a billing role when you hold none, the platform refuses with [`FORBIDDEN`](../platform/reference/errors.md#forbidden) and removes nothing.

With the CLI, remove each of the member's bindings with [`delete-role-binding`](reference/cli.md#delete-role-binding).

## Cancel a pending invite

Removing a member acts only on role bindings, so it doesn't cancel a pending invite.

1. On the **Access** page, find the invite under the pending invites and choose **Revoke**.

2. Confirm with **Revoke**, and check that the invite is gone.

## Using the API

The mutations are `inviteMember`, `removeMember` and `revokeInvite`; the queries are `orgMembers` and `orgInvites`, all in the `iam` namespace. `orgRoleAssignments` returns the same data as `orgMembers` with one entry per assignment, including its project scope and when it was created. For the full list, see the [IAM reference](reference/index.md).

```graphql
mutation {
  iam {
    inviteMember(input: {
      orgId: "<org-id>"
      email: "jane@example.com"
      roleUrn: "urn:origin:cloud:iam::::builtin/role/roles/viewer"
    })
  }
}
```

## Related

- [Assign and revoke roles](assign-roles.md)
- [Access model](access-model.md)
- [Organizations](../platform/organizations/index.md)
- [Audit log](audit-log.md) – invites, cancellations and removals are recorded
