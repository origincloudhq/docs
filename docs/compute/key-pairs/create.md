---
id: key-pairs-create
title: Create a key pair
description: Import the public half of an SSH key you already have, or have the platform generate a key pair and save its private key from the one response that carries it.
page_type: task
parent: key-pairs
nav_order: 10
tags: [compute, key-pairs, cli, api]
related: [key-pairs, instances-launch]
last_reviewed: 2026-11-03
---

# Create a key pair

Create a key pair before you launch an instance. Import a key you already have, or have the platform generate one.

## Before you begin

- A project to create the key pair in. Key pairs belong to one project.
- The `origin` CLI, logged in, with a default project. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).

Both ways use `origin compute create-key-pair`: with `--public-key`, it imports that key; without it, the platform generates one. The platform assigns the key pair's id. Name it with the `origin:name` tag, which the console shows. See [Tags](../../platform/tags.md).

## Import an existing key

1. If you don't have a key yet, create one locally:

   ```sh
   ssh-keygen -t ed25519 -f ~/.ssh/origin-cloud
   ```

2. Import its public half. Pass the full OpenSSH public key line:

   ```sh
   origin compute create-key-pair \
     --public-key "$(cat ~/.ssh/origin-cloud.pub)" \
     --tag origin:name=my-key
   ```

   A key with an unsupported type, or more than one line, is refused.

3. Note the key pair's `name` from the output. Its last segment is the id a launch takes as `--key-pair`. To list the project's key pairs:

   ```sh
   origin compute list-key-pairs
   ```

## Generate a key pair

1. Generate the key pair, and save its private key to a file only you can read, in the same command:

   ```sh
   origin compute create-key-pair --tag origin:name=my-key \
     | (umask 077; jq -r .privateKey > ~/.ssh/origin-cloud)
   ```

   The response's `privateKey` is an `ssh-ed25519` private key in OpenSSH format, and the `origin:name` tag is also the key's comment. The CLI says on standard error that the private key is shown this once.

   > **Important:** The private key is returned only in this response. The platform doesn't store it and can't show it again. If you lose it, delete the key pair and create a new one. A repeat of the same request with `--request-id` can't return it either.

2. Verify that the key pair is listed, and note its `name`:

   ```sh
   origin compute list-key-pairs
   ```

## Using the API

The `importKeyPair` and `generateKeyPair` mutations take the same inputs. Request `privateKey` in the `generateKeyPair` selection, or you can't get it later:

```graphql
mutation {
  compute {
    generateKeyPair(input: { projectUrn: "<project-urn>", name: "my-key" }) {
      urn
      publicKey
      privateKey
    }
  }
}
```

## Next steps

- [Launch an instance](../instances/launch.md) with the key pair

## Related

- [`create-key-pair` reference](../reference/cli.md#create-key-pair)
- [Key pairs](index.md)
