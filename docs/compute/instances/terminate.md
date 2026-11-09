---
id: instances-terminate
title: Terminate an instance
description: Terminate an instance permanently, and learn which of its volumes, network interfaces and addresses are deleted and which stay with you.
page_type: task
parent: instances
nav_order: 90
tags: [compute, instances, cli, api]
related: [instances-lifecycle]
last_reviewed: 2026-11-04
---

# Terminate an instance

Terminate an instance when you no longer need it. Termination is permanent and stops all billing for the instance and the volumes its launch created.

## Before you begin

- Copy off any data you need from the instance's root disk. The root disk and every other volume the launch created are deleted with the instance, and there is no option to keep them.
- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- Detach any volume you want to keep using elsewhere, or let termination release it. Volumes you attached yourself are never deleted. See [Attach and detach volumes](../instance-storage/attach-detach.md).

> **Important:** Termination can't be undone. The instance and its root disk are gone for good.

## Terminate the instance

1. Terminate the instance. The command refuses to run without `--yes`:

   ```sh
   origin compute delete-instance --instance <instance-id> --yes
   ```

   You can terminate an instance in any state. A `FAILED` instance is terminated without waiting for its machine to confirm the guest is gone. Until you terminate it, a `FAILED` instance keeps every resource it holds; terminating it releases them as the table below describes. The instance passes through `SHUTTING_DOWN` while its resources are released, normally for a few seconds, and the command waits until it reads `TERMINATED`, then prints it.

Terminating is safe to repeat. If you aren't sure an earlier attempt went through, run the command again. Terminating an instance that is already `TERMINATED` changes nothing.

## What happens to the instance's resources

| Resource | On termination |
|---|---|
| Root disk and other launch-created volumes | Deleted. |
| Volumes you attached yourself | Detached and `AVAILABLE` again. Not deleted. |
| Network interface you named at launch | Released and `AVAILABLE` again, keeping its addresses and the Floating IPs you associated with it. Not deleted. Delete it with `origin network delete-network-interface` when you no longer need it. |
| Network interface the platform created at launch | Deleted, with any public address the platform assigned to it automatically. This applies to instances launched without naming an interface, through the GraphQL API. |
| Floating IP you allocated yourself | Disassociated. It stays allocated to you until you release it. See [Floating IPs](../../network/internet-access/floating-ips.md). |

A launch-created volume that has a snapshot can't be deleted, so it stays `AVAILABLE` and billed after the instance terminates. Its `retentionNote` says why. Delete the snapshots, then the volume. See [Delete a volume](../../storage/volumes/delete.md).

If something else can't be released, the instance still reaches `TERMINATED` and stops costing you anything. The attachment for that resource keeps naming it and says it could not be released.

A terminated instance stays in `list-instances` for 2 hours, then drops out of the list. You can still read it with `get-instance` for a day after it was terminated.

## Using the API

```graphql
mutation {
  compute {
    terminateInstance(input: { instanceUrn: "<instance-urn>" }) {
      accepted
      message
    }
  }
}
```

## Related

- [`delete-instance` reference](../reference/cli.md#delete-instance)
- [Instance lifecycle](lifecycle.md)
