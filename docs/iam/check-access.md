---
id: check-access
title: Check access
description: Look up who you are and which roles you hold, list the platform's permissions, and test which permissions you hold on a project or organization.
page_type: task
parent: home
nav_order: 60
tags: [iam, roles, cli, api]
last_reviewed: 2026-11-26
---

# Check access

You can check access before you act instead of handling a permission error afterward. This is useful in automation that needs to know whether a call will succeed, and when you investigate why a request was refused.

## Before you begin

- To see your own profile, your own role bindings and the list of permissions, and to test your own permissions: any signed-in user. A service account can do all of it except read a profile, which it doesn't have.
- To list another member's role bindings: `iam.member.list` on the organization, which `roles/owner`, `roles/viewer` and `roles/iam.editor` grant org-wide.

## Check who you are

Show your own profile. Others bind a role to you as the `member` it shows, your full name.

```sh
origin iam get-user --user me
```

Example output (illustrative):

```json
{
  "name": "users/3f6e1c2a-8b4d-4e5f-9a1b-2c3d4e5f6a7b",
  "member": "//iam.origincloudapis.eu/users/3f6e1c2a-8b4d-4e5f-9a1b-2c3d4e5f6a7b",
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
origin iam list-role-bindings --organization <org-id> --member //iam.origincloudapis.eu/users/<user-id>
```

Leave out `--member` to list every binding in the organization. The organization's list also holds its pending bindings: invitations to an email address without an account, with `state` `PENDING` and the address as `member`, `user:<email>`. They grant nothing until someone signs up with the address and verifies it. Your own list, `--organization -`, holds only your active bindings. See [Pending role bindings](assign-roles.md#pending-role-bindings) and [Manage organization members](manage-members.md#list-members-and-pending-role-bindings).

## Find a permission key

List every permission the platform checks, with what it allows.

```sh
origin iam list-permissions
```

For the permissions each role grants, see [Built-in roles](roles.md).

## Check your permissions on a project or organization

1. Pick the permissions a task needs, by key, and the project or organization it acts on. Asking about the project answers for each of its resources as far as your bindings without a list go; for a binding [limited to a list of resources](access-model.md#bindings-limited-to-a-list-of-resources), ask about the resource itself: add `--full-resource-name` with its full name, as in step 2.

2. Ask which of them you hold. Repeat `--permission` for each key, up to 100.

   ```sh
   origin iam test-iam-permissions --resource projects/<project-id> \
     --permission compute.instance.launch \
     --permission network.vpc.create
   ```

   To ask about one resource of the project, as a request on that resource is decided, name it too. The answer then also counts the bindings that list it:

   ```sh
   origin iam test-iam-permissions --resource projects/<project-id> \
     --full-resource-name <full name of the resource> \
     --permission <permission key>
   ```

3. Read the result: it lists the permissions you hold there. A request that needs a permission missing from the list would be refused with [`FORBIDDEN`](../platform/reference/errors.md#forbidden).

A permission held on the organization counts for each of its projects; one held on a project counts only there. A key the catalog doesn't name is never held. To test a service account's permissions, run the command with its credential; see [Run commands as a service account](../platform/access/cli.md#run-commands-as-a-service-account). See [How a request is authorized](access-model.md#how-a-request-is-authorized).

## Using the API

In the REST API, these are `GetUser`, `ListRoleBindings`, `ListPermissions` and `TestIamPermissions`; see the [IAM reference](reference/index.md#rest-api). For example, to test which of two permissions you hold on a project:

```sh
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://iam.origincloudapis.eu/v1beta1/projects/<project-id>:testIamPermissions" \
  -d '{"permissions": ["compute.instance.launch", "network.vpc.create"]}'
```

To test your permissions on one resource of the project, as a request on that resource is decided, add its full name as `fullResourceName`. The answer then counts the bindings that list the resource as well as those on its organization or project. A name outside the project or organization you ask about, or of a kind of resource a binding can't list, is refused with [`BAD_REQUEST`](../platform/reference/errors.md#bad_request); for any other kind, asking about its project gives the same answer.

```sh
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  "https://iam.origincloudapis.eu/v1beta1/projects/<project-id>:testIamPermissions" \
  -d '{"permissions": ["<permission>"], "fullResourceName": "<full name of a resource in the project>"}'
```

## Related

- [Access model](access-model.md)
- [Built-in roles](roles.md)
- [`origin iam` commands](reference/cli.md)
