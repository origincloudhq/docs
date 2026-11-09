---
id: instances-change-type
title: Change an instance's type
nav_title: Change type
description: Change a stopped instance to a different instance type so it starts again with more or fewer vCPUs and memory, keeping its identity and volumes.
page_type: task
parent: instances
nav_order: 80
tags: [compute, instances, cli, api]
related: [instances-instance-types, instances-stop-start]
last_reviewed: 2026-11-03
---

# Change an instance's type

Change an instance's type to resize it, or to move it off a type that is no longer offered. Only the size changes. The instance keeps its name, its addresses and its volumes.

## Before you begin

- An instance that you stopped and that reads `STOPPED`. A `FAILED` instance still holds capacity on its machine, so you can't change its type. Start and stop it cleanly first, or terminate it.
- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- Free vCPU quota if the new type is larger. Growing is checked against the same vCPU quota as a launch. Shrinking never is. See [Limits](../../platform/reference/limits.md#compute).

## Change the type

1. Stop the instance if it's running. See [Stop and start an instance](stop-start.md).

2. Pick a type whose `available` is `true`:

   ```sh
   origin compute list-instance-types
   ```

3. Change the type:

   ```sh
   origin compute update-instance --instance <instance-id> \
     --instance-type gp1.core.4
   ```

   The command waits until the instance shows the new type, then prints it. Verify that its `instanceType` reads `instanceTypes/gp1.core.4`. The new type takes effect at the next start.

4. Start the instance:

   ```sh
   origin compute start-instance --instance <instance-id>
   ```

## Using the API

```graphql
mutation {
  compute {
    changeInstanceType(input: {
      instanceUrn: "<instance-urn>"
      instanceType: "gp1.core.4"
    }) {
      accepted
      message
    }
  }
}
```

## If this fails

- **`PRODUCT_UNAVAILABLE`**: the type you named is no longer offered. Pick one whose `available` is `true`. See [Instance types](instance-types.md#available-and-withdrawn-types).
- **Quota exceeded**: the larger type would take the organization or project past its vCPU limit. Choose a smaller type or request a higher limit.
- **`FAILED_PRECONDITION`**: the instance isn't `STOPPED`. Stop it first.
- **[`CONFLICT`](../../platform/reference/errors.md#conflict)**: another change of the instance's type landed while yours was being checked. Look at its type now, and send yours again if it is still not the one you want.

## Related

- [`update-instance` reference](../reference/cli.md#update-instance)
- [Instance types](instance-types.md)
