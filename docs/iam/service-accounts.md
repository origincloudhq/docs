---
id: service-accounts
title: Use service accounts
nav_title: Service accounts
description: Create a service account for CI and scripts, choose how it authenticates (federation first, a key as the last resort), and delete it to revoke it.
page_type: task
parent: home
nav_order: 50
tags: [iam, service-accounts, cli, api]
last_reviewed: 2026-11-21
---

# Use service accounts

A service account is a non-interactive identity for automation such as CI pipelines, scripts and infrastructure-as-code tools. It belongs to one organization and acts as its own principal: the member `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>` in the `origin iam` commands and the REST API, its `id` in the GraphQL API. Its access is checked exactly like a user's: it can do what its role bindings allow, and nothing else.

A service account never holds a password or a client secret. Software acts as it with an access token from the security token service, `https://sts.origincloudapis.eu`, which exchanges a proof for it: a CI job's own OIDC token, an instance's credential, or an assertion signed with one of the account's keys.

## Choose how the software authenticates

Pick the first of these that fits. Only the last stores a secret you have to keep.

1. **A CI job, or anything with an OIDC token of its own**, such as GitHub Actions, GitLab CI, HCP Terraform or a Kubernetes service account token: a `WORKLOAD` service account that [trusts the provider's tokens](#trust-a-ci-providers-tokens). See [Workload identity federation](workload-identity-federation.md).
2. **Software on an Origin Cloud instance**: launch the instance as a `WORKLOAD` service account. See [Run an instance as a service account](../compute/instances/service-account.md).
3. **You, running a tool on your own machine**, Terraform included: your own login, `origin id login`. See [Use the CLI](../platform/access/cli.md#log-in).
4. **Anything else**, such as a job on a server of your own with no identity provider: an `EXTERNAL` service account with a [key](#create-a-key). The key's private key is a long-lived secret: store it like one, and prefer any of the above.

Every service account has a type, set when it's created. It never changes.

| Type | Credential |
| --- | --- |
| `EXTERNAL` | A key, for software outside Origin Cloud that has no identity of its own to federate. The type a create uses when none is given. |
| `WORKLOAD` | No key, ever, so no copied credential authenticates as it. A CI job acts as it through a [federated credential](#trust-a-ci-providers-tokens), an instance through the instance's credential. Launching an instance as one needs `iam.service_account.act_as` on the organization, which [`roles/iam.service-account-user`](roles.md#rolesiamservice-account-user) grants. |

## Before you begin

- To create or delete a service account, its federated credentials or its keys: an org-wide `roles/owner` assignment.
- To list service accounts: an org-wide `roles/owner` or `roles/viewer` assignment.
- Your organization ID (`<org-id>`).

## Create a service account

1. Create the service account with a display name that tells you what uses it, and the type its credential needs.

   ```sh
   origin iam create-service-account --organization <org-id> --display-name ci-deploy --type WORKLOAD
   ```

   The output contains the service account's resource name, `organizations/<org-id>/serviceAccounts/<service-account-id>`, and its `member`. The account has no credential yet.

2. Grant the service account the roles it needs. A new service account holds no roles and can't do anything until you bind one. Use the `member` from the previous step.

   ```sh
   origin iam create-role-binding --organization <org-id> \
     --member //iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id> \
     --role //iam.origincloudapis.eu/roles/viewer \
     --project //resourcemanager.origincloudapis.eu/projects/<project-id>
   ```

   Grant the smallest role and scope that does the job. See [Assign and revoke roles](assign-roles.md).

3. Verify that the service account is listed with the state `ACTIVE`.

   ```sh
   origin iam list-service-accounts --organization <org-id>
   ```

4. Give it its credential: a [federated credential](#trust-a-ci-providers-tokens) for a `WORKLOAD` account, a [key](#create-a-key) for an `EXTERNAL` one. An instance needs neither.

## Create a key

A key is the credential of an `EXTERNAL` service account. The platform generates its key pair, an `ES256` (ECDSA P-256) key, returns the private key once, in a credentials file, and keeps only the public key. An account has at most 10 keys that aren't deleted. A `WORKLOAD` account never has one.

Whoever holds the credentials file acts as the service account. So creating a key needs `iam.service_account_key.create` and `iam.service_account.act_as` on the organization, which `roles/owner` holds. The CLI has no command for keys yet; call the REST API.

1. Create the key.

   ```sh
   curl -s -X POST \
     "https://iam.origincloudapis.eu/v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/keys" \
     -H "Authorization: Bearer $(origin id token --raw)" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

   The response is the key, with its `name` and, in this response only, its `credentialsFile`: a JSON document with these fields.

   | Field | Value |
   | --- | --- |
   | `type` | `service_account_key` |
   | `name` | The key's full name, `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>/keys/<key-id>` |
   | `service_account` | The service account's full name |
   | `algorithm` | `ES256` |
   | `private_key` | The private key, a PKCS 8 private key in PEM |
   | `sts_endpoint` | `https://sts.origincloudapis.eu`, where its assertions are exchanged |

   > **Important:** The private key is shown only once. Save the credentials file as it is, readable only by the software that uses it, or store it in your secret manager. No API returns it again; if you lose it, delete the key and create a new one.

2. Verify that the key is listed with the state `ACTIVE`. A listed key shows its `lastUseTime`, never its private key.

   ```sh
   curl -s \
     "https://iam.origincloudapis.eu/v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/keys" \
     -H "Authorization: Bearer $(origin id token --raw)"
   ```

### Get an access token with a key

The software signs a JWT assertion with the key's private key, naming the key and the service account, and exchanges it at the security token service for the account's access token, by default for 15 minutes. [Service account keys](reference/index.md#service-account-keys) lists the assertion's fields and shows the exchange:

```sh
curl -s https://sts.origincloudapis.eu/v1/token \
  -d grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer \
  -d assertion=<assertion>
```

The response is JSON with an `access_token` and its lifetime in seconds, `expires_in`. Send the token as a bearer token with each API request, or to the CLI as `ORIGINCLOUD_ACCESS_TOKEN`, and make a new assertion when it expires. Each assertion needs its own `jti`.

### Replace or delete a key

A key never expires and is never changed. To replace one, create the new key, move the software to its credentials file, check that the old key's `lastUseTime` stops moving, then delete the old key. An account's keys can overlap for as long as you need.

Deleting a key refuses its assertions from then on, and the access tokens already exchanged with it at their next API call. It stays readable, with the state `DELETED`. Deleting the service account deletes its keys.

```sh
curl -s -X DELETE \
  "https://iam.origincloudapis.eu/v1beta1/organizations/<org-id>/serviceAccounts/<service-account-id>/keys/<key-id>" \
  -H "Authorization: Bearer $(origin id token --raw)"
```

## Revoke a service account

Deleting a service account revokes it: it deletes its federated credentials and keys and removes every role binding it holds, in every organization and at every scope. From that moment, every exchange for a new access token is refused, and an access token issued before is refused on its next request.

Deleting is permanent. A deleted service account can't be reactivated or bound to a role again; create a new service account instead. It stays readable, with the state `DELETED`.

An organization can't be deleted while it has a service account that isn't deleted; delete its service accounts first. See [Delete an organization](../platform/organizations/projects.md#delete-an-organization).

1. Find the service account's ID with `list-service-accounts`.

2. Delete it. Deleting can't be undone, so the command needs `--yes`.

   ```sh
   origin iam delete-service-account --organization <org-id> \
     --service-account <service-account-id> --yes
   ```

   This needs only `roles/owner`. The account's role bindings are removed even when they include a role you don't hold yourself, such as a billing role.

3. Check that the service account has the state `DELETED` and a `deleteTime`. Deleted service accounts are listed only with `--show-deleted true`.

   ```sh
   origin iam get-service-account --organization <org-id> --service-account <service-account-id>
   ```

4. Run `list-role-bindings --member //iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>` and check that it lists no binding.

## Trust a CI provider's tokens

A `WORKLOAD` service account can trust the OIDC tokens of an identity provider outside Origin Cloud, such as the token GitHub Actions gives every job. That trust is a federated credential on the account. It names exactly:

- the token's issuer;
- the audience it must be issued for, `https://sts.origincloudapis.eu` unless you name another;
- the claims it must carry, each with exactly one value.

Software holding a matching token exchanges it for the service account's access token at the security token service, `https://sts.origincloudapis.eu`, so no secret is stored where it runs. [Workload identity federation](workload-identity-federation.md) explains how, and [Authenticate from GitHub Actions](github-actions.md) walks through it.

A federated credential is refused unless:

- **At least one condition names an identity that never changes.** For GitHub Actions' issuer, `https://token.actions.githubusercontent.com`, that is `repository_id` or `repository_owner_id`. For GitLab.com's, `https://gitlab.com`, it is `project_id` or `namespace_id`. For HCP Terraform's, `https://app.terraform.io`, it is `terraform_organization_id`. For any other issuer, it is `sub`. A repository's, project's or workspace's name alone isn't enough: a renamed one, or a new one created under an old name, would inherit the trust.
- **No value contains `*`.** Values are matched exactly, never as patterns.
- **The service account is an active `WORKLOAD` one.** An `EXTERNAL` account authenticates with a key.

Whoever matches a federated credential acts as the service account. So creating one needs `iam.service_account.create` and `iam.service_account.act_as` on the organization: the right to act as the account yourself. `roles/owner` holds both.

To change a federated credential, create the new one and delete the old; it is never updated. Deleting the service account deletes its federated credentials. Deleting a federated credential also stops the access tokens already exchanged through it, at their next API call.

```sh
origin iam create-federated-credential \
  --organization <org-id> \
  --service-account <service-account-id> \
  --display-name "deploy from main" \
  --issuer https://token.actions.githubusercontent.com \
  --condition repository_id=<repository-id> \
  --condition ref=refs/heads/main \
  --condition environment=production
```

`origin iam list-federated-credentials --organization <org-id> --service-account <service-account-id>` lists them; add `--show-deleted true` to include deleted ones. `origin iam delete-federated-credential --federated-credential <name>` deletes one.

## Using the API

In the REST API, these are `CreateServiceAccount`, `ListServiceAccounts`, `GetServiceAccount` and `DeleteServiceAccount`; for keys `CreateServiceAccountKey`, `ListServiceAccountKeys`, `GetServiceAccountKey` and `DeleteServiceAccountKey`; and for federated credentials `CreateFederatedCredential`, `ListFederatedCredentials`, `GetFederatedCredential` and `DeleteFederatedCredential`; see the [IAM reference](reference/index.md#rest-api). The GraphQL mutations are `createServiceAccount`, `revokeServiceAccount`, which takes the account's full name as `serviceAccount`, `createServiceAccountKey`, whose `credentialsFile` is the one-time credentials file, and `deleteServiceAccountKey`; an account's `id` is its member; the queries are `serviceAccounts` and `serviceAccountKeys`, all in the `iam` namespace. No response but a key's create carries its private key.

The type is the service account's `type` field in both APIs: set it in the create to make a `WORKLOAD` service account.

```graphql
mutation {
  iam {
    createServiceAccount(input: {
      organisation: "//resourcemanager.origincloudapis.eu/organizations/<org-id>"
      name: "nightly-backup"
      type: EXTERNAL
    }) {
      id
    }
  }
}
```

## Related

- [Access model](access-model.md)
- [Built-in roles](roles.md)
- [Workload identity federation](workload-identity-federation.md)
- [Authenticate from GitHub Actions](github-actions.md)
- [API access](../platform/access/api.md)
- [`create-service-account`](reference/cli.md#create-service-account) and [`delete-service-account`](reference/cli.md#delete-service-account) commands
- [Audit log](audit-log.md) – creation and revocation are recorded, and so is the removal of a revoked account's role assignments; so are the creation and deletion of federated credentials and keys, and every exchange through either
