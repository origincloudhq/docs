---
id: instances-stop-start
title: Stop and start an instance
description: Stop an instance to release its vCPU and memory while keeping its disks and addresses, and start it again later, possibly on another machine.
page_type: task
parent: instances
nav_order: 70
tags: [compute, instances, cli, api]
related: [instances-lifecycle, instances-change-type]
last_reviewed: 2026-11-03
---

# Stop and start an instance

Stop an instance when you don't need it running. A stopped instance accrues no compute usage, and it keeps its volumes, network interface and addresses. Start it again when you need it, the same instance, possibly on a different machine.

## Before you begin

- To stop: an instance in `RUNNING`.
- To start: an instance in `STOPPED` or `FAILED`.
- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).

> **Note:** A stopped instance's volumes are still billed. To stop paying for them, terminate the instance. See [Terminate an instance](terminate.md).

## Stop the instance

1. Stop the instance:

   ```sh
   origin compute stop-instance --instance <instance-id>
   ```

   The platform asks the guest operating system to shut down cleanly. A guest that hasn't shut down after 5 minutes is powered off. The instance passes through `STOPPING`, and the command waits until it reads `STOPPED`, then prints it.

2. Verify that `state` reads `STOPPED` in the output. If the stop fails, the command fails with the reason; `get-instance` then shows the instance `FAILED`, with the reason in `stateReason`.

Stopping an instance that is already stopped changes nothing. You can also shut the guest down from inside, with `sudo poweroff`. The instance then goes from `RUNNING` straight to `STOPPED`.

## Start the instance

1. Start the instance:

   ```sh
   origin compute start-instance --instance <instance-id>
   ```

   The instance passes through `PENDING`, and the command waits until it reads `RUNNING`, or `FAILED`, then prints it.

2. Verify that the guest is up. The instance's `health.availability` reads `AVAILABLE` once the platform has seen its network stack answer:

   ```sh
   origin compute get-instance --instance <instance-id>
   ```

   See [Instance health checks](health-checks.md).

Starting an instance that is already `RUNNING` changes nothing. A start is refused while the instance is `INITIALIZING`, because it starts on its own once its resources are ready, and while it is `STOPPING` or `SHUTTING_DOWN`.

To get control back without waiting, add `--no-wait` to either command, and wait for the operation it prints later with `origin compute wait-operation`. See [Wait for long-running operations](../../platform/access/cli.md#wait-for-long-running-operations).

## Using the API

The `startInstance` and `stopInstance` mutations take the instance URN:

```graphql
mutation {
  compute {
    stopInstance(input: { instanceUrn: "<instance-urn>" }) {
      accepted
      message
    }
  }
}
```

## If this fails

- **The start is refused with `PRODUCT_UNAVAILABLE`.** The instance's type is no longer offered. Change it to an available type, then start it. See [Change an instance's type](change-type.md).
- **The start is refused with `INSUFFICIENT_CAPACITY`.** A stopped instance is placed afresh when it starts, and no machine has room for its type right now. Retry later, or change it to a smaller type.
- **The instance ends up `FAILED`.** The command fails, and the instance's `stateReason`, which `get-instance` shows, says why. See [When a lifecycle operation fails](lifecycle.md#when-a-lifecycle-operation-fails).

## Related

- [`stop-instance` reference](../reference/cli.md#stop-instance)
- [`start-instance` reference](../reference/cli.md#start-instance)
- [Instance lifecycle](lifecycle.md)
