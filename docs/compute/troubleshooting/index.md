---
id: troubleshooting
title: Troubleshoot Compute
nav_title: Troubleshooting
description: Fix common Compute problems - failed instances, refused launches and starts, impaired or unknown health, unsynchronized clocks, SSH failures and broken pod networking.
page_type: troubleshooting
parent: home
nav_order: 60
tags: [troubleshooting, compute, instances]
last_reviewed: 2026-11-04
---

# Troubleshoot Compute

Each section starts from what you see. The CLI prints an instance's status as `state` and its reason as `stateReason`; the GraphQL API calls them `status` and `statusReason`. For the meaning of every reason, see [Status reasons](../reference/status-reasons.md).

## Instance status is FAILED

**Symptom:** `origin compute get-instance` shows `state: FAILED` and a `stateReason`.

**Cause:** The host refused or never confirmed a start or a stop, or a volume, network interface or placement the instance needed failed. `FAILED` doesn't mean the guest is stopped.

**Resolution:**

1. Read `stateReason` and look it up in [Status reasons](../reference/status-reasons.md).
2. Fix anything the reason names, such as a quota or a full subnet.
3. Start the instance with `origin compute start-instance`, or terminate it with `origin compute delete-instance --yes`. Don't leave a `FAILED` instance sitting: it keeps its capacity, its volumes and its network interface, and a public IPv4 address on that interface stays billed until you terminate the instance. See [When a lifecycle operation fails](../instances/lifecycle.md#when-a-lifecycle-operation-fails).

## Launch refused with INSUFFICIENT_CAPACITY

**Symptom:** The launch or start fails with `INSUFFICIENT_CAPACITY` and a message such as `insufficient capacity for instance type gp1.core.16: no host has 16 vCPU and 65536 MiB memory free right now; retry later, or launch a smaller type`.

**Cause:** No machine has room for that instance type right now, or no machine serves its kind. This is a refusal, not a fault. Nothing was created.

**Resolution:**

1. Retry the same request later.
2. Or choose a smaller type, or a type of another kind. See [Instance types](../instances/instance-types.md).

## Launch refused because the URN is an image family's

**Symptom:** The `launchInstance` mutation fails with `BAD_REQUEST` and the message `invalid image urn: this is an image family's URN, not an image's; launch from the family with imageFamily: "<slug>"`.

**Cause:** The URN passed as `imageUrn` is an image family's URN. `imageUrn` takes an image's URN only.

**Resolution:**

1. Launch by family with the slug the message names, as `imageFamily`. With the CLI, use `--image-family <family-id>` on `origin compute create-instance`. See [Image families](../images/image-families.md).
2. Or, to pin one image, take it from `origin compute list-public-images`.

## Launch, start or type change refused with PRODUCT_UNAVAILABLE

**Symptom:** `create-instance`, `start-instance` or `update-instance --instance-type` fails with `PRODUCT_UNAVAILABLE`, naming an instance type or storage class.

**Cause:** The type or class is no longer offered, or isn't on sale. A stopped instance whose type was withdrawn can't start as that type.

**Resolution:**

1. List the types and pick one whose `available` is `true`:

   ```sh
   origin compute list-instance-types
   ```

2. For a stopped instance, change its type, then start it. See [Change an instance's type](../instances/change-type.md).

## GUEST_PRESENT is IMPAIRED

**Symptom:** The instance is `RUNNING`, but its health checks show `GUEST_PRESENT` as `IMPAIRED` and `availability` as `IMPAIRED`. The CLI prints them under `health`, the GraphQL API under `healthChecks`.

**Cause:** The machine carrying the instance is reachable and no longer runs it. Waiting won't bring it back.

**Resolution:**

1. Stop the instance with `origin compute stop-instance`, which waits until it reads `STOPPED`.
2. Start it again. It can start on any machine, with its volumes and addresses unchanged.

See [Instance health checks](../instances/health-checks.md#when-guest_present-is-impaired).

## Health checks show INSUFFICIENT_DATA

**Symptom:** Checks read `INSUFFICIENT_DATA` and `availability` reads `UNKNOWN`, often with `HOST_REACHABLE` as `IMPAIRED` first.

**Cause:** The platform has lost contact with the machine carrying the instance, so it can't observe the instance. It doesn't know whether the instance is still running. Right after launch, checks also read `INSUFFICIENT_DATA` until the first observation arrives.

**Resolution:**

1. Wait a few minutes. If the machine comes back, the checks return to `OK`.
2. If the machine failed, the platform records the instance as `STOPPED` with a reason in `stateReason`. Start it again. See [When the machine under an instance fails](../instances/host-failure.md).
3. If `HOST_REACHABLE` stays `IMPAIRED`, or the checks stay `INSUFFICIENT_DATA` on a running instance, contact Origin Cloud support. The `SYSTEM` category means there is nothing to fix inside the instance.

## System clock synchronized: no

**Symptom:** `timedatectl` inside the instance shows `System clock synchronized: no`.

**Cause:** Either the guest isn't using the platform's time service, or the physical machine's own clock isn't synchronized and the platform is telling the guest not to trust it.

**Resolution:**

1. Check that `NTP service: active` is shown. If it isn't, enable the guest's time service with `sudo timedatectl set-ntp true`.
2. If you pointed the guest at an external time server, check that the instance has internet access.
3. If the guest uses the platform's time service and the clock stays unsynchronized, contact Origin Cloud support.

See [Guest environment](../instances/guest-environment.md#time-synchronization).

## Can't connect over SSH

**Symptom:** `ssh` times out, or fails with `Permission denied (publickey)`.

**Cause:** The wrong user name or key, a security group that doesn't allow port 22, an instance with no public address, or a subnet with no route to the internet.

**Resolution:**

1. Check the user name. Use the instance's `loginUser` from `origin compute get-instance`, not `root`.
2. Check the key. Use the private key of the key pair the instance was launched with.
3. Check that a security group on the instance's network interface allows inbound TCP port 22 from your address. The default VPC's default group does, unless its rules were changed. A network interface with no security group admits nothing; list its groups with `origin network list-security-group-associations --network-interface <network-interface-id>`. See [Security groups](../../network/traffic-control/security-groups.md).
4. Check that the instance has a public address: a floating IP associated with its network interface, or one the platform assigned at launch. `origin network list-floating-ips` shows each floating IP's `address` and `networkInterface`. See [Floating IPs](../../network/internet-access/floating-ips.md).
5. In a VPC you created, check that the VPC has an Internet Gateway and the instance's subnet has a route table with a default route to it. See [Route tables](../../network/internet-access/route-tables.md).
6. Check that the instance is `RUNNING` and its `health.availability` is `AVAILABLE`.

## Pod networking broken between cloned instances

**Symptom:** Instances launched from your own image can't reach each other over VXLAN. Kubernetes pod networking with VXLAN or Geneve encapsulation fails between nodes, while the nodes reach each other directly.

**Cause:** The instances share one machine-id, inherited from the image. Their VXLAN devices then get the same MAC address and can't exchange packets.

**Resolution:**

1. Run `cat /etc/machine-id` on two affected instances. Identical output confirms the cause.
2. On each affected instance, generate a new machine-id and reboot:

   ```sh
   sudo rm -f /etc/machine-id /var/lib/dbus/machine-id
   sudo systemd-machine-id-setup
   sudo reboot
   ```

3. Fix the image so new instances don't inherit it. Clear the machine-id before you snapshot. See [Create an image](../images/create.md).

## Related

- [Status reasons](../reference/status-reasons.md)
- [Error codes](../../platform/reference/errors.md)
- [Troubleshoot storage](../../storage/troubleshooting/index.md)
- [Troubleshoot networking](../../network/troubleshooting/index.md)
