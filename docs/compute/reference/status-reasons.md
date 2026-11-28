---
id: reference-status-reasons
title: Status reasons
description: Every text an instance can report in stateReason when it is FAILED, was stopped by the platform or crashed, with what each means and what to do next.
page_type: reference
parent: reference
nav_order: 20
tags: [reference, compute, instances, troubleshooting]
related: [instances-lifecycle, instances-host-failure]
last_reviewed: 2026-11-26
---

# Status reasons

An instance's status reason says why it is in its current status. `origin compute get-instance` and `list-instances`, and the REST API, return it as `stateReason`, next to `state`.

It's set in two cases:

- Every `FAILED` instance carries one.
- A `STOPPED` instance carries one when the platform stopped it because its machine failed, or when its operating system crashed. A `STOPPED` instance you stopped yourself, that shut itself down, or that the platform stopped to move it to another machine carries none.

For every other status it's empty, and starting the instance clears it. A reason starts with one of the fixed texts below. Some texts are followed by a colon and a detail, such as a quota refusal you can act on. A reason never contains raw host errors, file paths or machine names. If the reason isn't enough to act on, contact Origin Cloud support and quote the instance's full name, such as `//compute.origincloudapis.eu/projects/<project>/zones/<zone>/instances/<instance-id>`.

The texts are listed in the order an instance can meet them: launch, start, stop, a crash, and machine failure.

## A volume could not be created

**Text:** `a volume this instance needs could not be created`, optionally followed by `: <detail>`.

**Status:** `FAILED`

**Meaning:** A volume the launch creates, such as the root disk, could not be created. A detail you can act on is appended, for example `a volume this instance needs could not be created: invalid input on field quota: volume storage quota exceeded`.

If storage can't create the volume for a moment, for example while the platform's key service restarts, the platform asks again for up to two minutes. Only then does the launch fail, with the detail `storage was unavailable`.

**What to do:** For a quota detail, free volume storage or request a higher limit. Then terminate the instance and launch again. For `storage was unavailable`, wait a few minutes before you launch again.

## A volume could not be attached

**Text:** `a volume this instance needs could not be attached`, optionally followed by `: <detail>`.

**Status:** `FAILED`

**Meaning:** A volume exists but couldn't be handed to the instance, for example `a volume this instance needs could not be attached: volume is not available`.

**What to do:** Act on the detail, then start the instance or terminate it.

## The network interface could not be created

**Text:** `the network interface this instance needs could not be created`, optionally followed by `: <detail>`.

**Status:** `FAILED`

**Meaning:** The launch couldn't create the instance's network interface. The launch call returned the instance before this happened, so the reason shows only here. The detail says why:

- A subnet with no free addresses: another launch took the subnet's last address at the same moment. A subnet that is already full refuses the launch instead, and no instance is created.
- `no public IPv4 address is free in zone <zone>`: the subnet gives every instance launched into it a public address, and the zone has none free. The interface isn't created without its address.
- A public IP quota refusal: the same subnet setting, with your organization's or project's public IP quota used up.

**What to do:** Terminate the instance. Launch again into a subnet with free addresses, or later once a public address is free, or into a subnet that doesn't assign public addresses. For a quota refusal, release a Floating IP you no longer need. See [VPC addressing](../../network/vpcs/addressing.md) and [Default VPC](../../network/vpcs/default-vpc.md#auto-assigned-public-ips).

## The instance could not be placed

**Text:** `this instance could not be placed on a machine to start on`, optionally followed by `: <detail>`.

**Status:** `FAILED`

**Meaning:** The instance finished preparing its resources but had no machine to start on, and none could be found. The detail usually names the capacity shortfall, for example `no host has capacity for an instance of this type`.

**What to do:** Start the instance again later, or terminate it and launch a smaller type.

## The instance could not be started on its host

**Text:** `the instance could not be started on its host`

**Status:** `FAILED`

**Meaning:** The machine the instance was placed on refused to start it.

**What to do:** Start the instance again, or terminate it.

## The start operation failed

**Text:** `the operation failed (ERR_INSTANCE_START)`

**Status:** `FAILED`

**Meaning:** The host reported an error while carrying out the start.

**What to do:** Start the instance again, or terminate it.

## The stop operation failed

**Text:** `the operation failed (ERR_INSTANCE_STOP)`

**Status:** `FAILED`

**Meaning:** The host reported an error while carrying out a stop or a termination's shutdown. The guest may still be running.

**What to do:** Start the instance to return it to the normal lifecycle and stop it again, or terminate it.

## The operation failed

**Text:** `the operation failed`

**Status:** `FAILED`

**Meaning:** The host reported an error without a classification.

**What to do:** Start the instance again, or terminate it.

## The host did not confirm the start

**Text:** `the instance's host did not confirm that it started`

**Status:** `FAILED`

**Meaning:** The instance's machine is reachable but didn't confirm a start, after the platform sent it three times over about 30 minutes. The guest may be running.

**What to do:** Start the instance again, or terminate it.

## The host did not confirm the stop

**Text:** `the instance's host did not confirm that it stopped`

**Status:** `FAILED`

**Meaning:** The instance's machine is reachable but didn't confirm a stop or a termination's shutdown, after the platform sent it three times over about 30 minutes. The guest may still be running.

**What to do:** Start the instance to return it to the normal lifecycle and stop it again, or terminate it.

## The operating system crashed

**Text:** `the instance's operating system crashed, and the instance stopped; start it again to bring it back`

**Status:** `STOPPED`

**Meaning:** The guest's kernel panicked, or the guest crashed in another way the platform detects. The instance stopped; its machine is fine. A crash while a stop you asked for is under way carries no reason.

**What to do:** Start the instance again. If it keeps crashing, look in the guest's own logs from the boot that crashed for the cause, such as a kernel panic message, if its logs are kept across reboots (`journalctl -k -b -1` on a system with a persistent journal).

## The machine failed

**Text:** `the machine this instance was running on failed, and the instance went down with it; start it again to bring it back`

**Status:** `STOPPED`

**Meaning:** The machine under the running instance restarted, and the platform proved it. The guest didn't survive. See [When the machine under an instance fails](../instances/host-failure.md).

**What to do:** Start the instance when you want it back.

## The machine was taken out of service

**Text:** `the machine this instance was running on failed and has been taken out of service; the instance went down with it, and starting it again will place it on another machine`

**Status:** `STOPPED`

**Meaning:** The machine under the instance failed and didn't come back, and the platform took it out of service. See [When the machine under an instance fails](../instances/host-failure.md).

**What to do:** Start the instance when you want it back. It starts on another machine with its volumes and addresses unchanged.
