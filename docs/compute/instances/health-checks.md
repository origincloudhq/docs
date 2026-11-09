---
id: instances-health-checks
title: Instance health checks
nav_title: Health checks
description: What each instance health check observes, how results combine into availability, and how the category tells you whether a problem is yours to fix.
page_type: concept
parent: instances
nav_order: 30
tags: [compute, instances]
related: [instances-lifecycle, instances-host-failure]
last_reviewed: 2026-10-19
---

# Instance health checks

`status` tells you what was asked for or confirmed. Health checks tell you what the platform can observe right now. You need both: an instance whose machine has become unreachable is still `RUNNING`, because nothing stopped it. Read `healthChecks` on an instance for a result per check and an `availability` summary.

```graphql
query {
  compute {
    instance(instanceUrn: "<instance-urn>") {
      status
      healthChecks {
        availability
        checks { kind category status since }
      }
    }
  }
}
```

`since` is when the check entered its current result. It's `null` while nothing has observed the check.

## Checks

Every check is always present in `checks`. A check with nothing to report says so rather than being left out.

| `kind` | `category` | What it observes |
|---|---|---|
| `HOST_REACHABLE` | `SYSTEM` | Whether the platform can reach the machine carrying the instance. |
| `DOMAIN_STATE` | `INSTANCE` | What the machine reports about the virtual machine. `OK` only when it reports the virtual machine running. Paused or crashed reads `IMPAIRED`. |
| `NETWORK_REACHABLE` | `INSTANCE` | Whether the guest's network stack answers. See [Network reachability](#network-reachability). |
| `GUEST_AGENT` | `INSTANCE` | A report from an agent inside the guest. Always `NOT_APPLICABLE`, because the platform's images ship no such agent. |
| `GUEST_PRESENT` | `INSTANCE` | Whether the machine carrying the instance still has it. See [When GUEST_PRESENT is IMPAIRED](#when-guest_present-is-impaired). |

New kinds can appear in the enum. Ignore a kind your client doesn't recognize rather than failing on it.

## Results

Each check reports one of four results:

**`OK`**  
The check ran and the instance passed.

**`IMPAIRED`**  
The check ran and the instance failed it.

**`INSUFFICIENT_DATA`**  
The platform could not tell, most often because the machine carrying the instance has stopped reporting. Treat it as unknown, not as healthy.

**`NOT_APPLICABLE`**  
The check doesn't apply. Every check reads `NOT_APPLICABLE` while the instance is `STOPPING`, `STOPPED`, `SHUTTING_DOWN` or `TERMINATED`, because there is no guest to observe.

A result that isn't refreshed for 120 seconds goes back to `INSUFFICIENT_DATA`. The platform doesn't keep showing a value it can no longer confirm.

## Availability

`availability` combines the checks into one value for a listing:

| `availability` | When |
|---|---|
| `IMPAIRED` | At least one check is `IMPAIRED`. |
| `UNKNOWN` | No check is `IMPAIRED`, and at least one is `INSUFFICIENT_DATA`. |
| `NOT_APPLICABLE` | Every check is `NOT_APPLICABLE`. |
| `AVAILABLE` | Every other case: no check is `IMPAIRED` or `INSUFFICIENT_DATA`, and at least one is `OK`. |

`NOT_APPLICABLE` doesn't hold the summary down, so a healthy running instance reads `AVAILABLE` even though `GUEST_AGENT` is `NOT_APPLICABLE`. `INSUFFICIENT_DATA` does, so the summary never rounds an unknown up to `AVAILABLE`.

## Categories

The category on each check tells you who has to act:

**`SYSTEM`**  
The platform underneath your instance. There is nothing to fix inside the instance. If it persists, contact Origin Cloud support.

**`INSTANCE`**  
Your instance's own operating system and network configuration. Waiting won't fix it.

If you only read `availability`, you lose this distinction. Read the checks when the summary isn't `AVAILABLE`.

## Network reachability

`NETWORK_REACHABLE` never reports an instance unhealthy only because it's quiet. Traffic the guest sends counts as proof it's alive. When the guest has sent nothing, the platform asks it directly with an IPv6 neighbor solicitation, which the guest's kernel answers without any agent. The check reads `IMPAIRED` only after three consecutive probes go unanswered, about 90 seconds of silence.

The check tells you the guest's operating system and network stack are up. It doesn't tell you your application is. A crashed service inside a healthy guest doesn't show up here. Use your own monitoring for that.

## When the machine stops reporting

When the platform loses contact with the machine carrying your instance, `HOST_REACHABLE` reads `IMPAIRED`. The instance-level checks stop being refreshed and read `INSUFFICIENT_DATA` within 120 seconds. Once the reachability result itself ages out, every check reads `INSUFFICIENT_DATA` and `availability` reads `UNKNOWN`.

Read that as "the platform has lost sight of this instance", not "this instance has stopped". The platform can't tell which, and it doesn't claim either. The instance's `status` stays `RUNNING`. For what happens if the machine has failed, see [When the machine under an instance fails](host-failure.md).

## When GUEST_PRESENT is IMPAIRED

`GUEST_PRESENT` reading `IMPAIRED` means the machine carrying your instance is up and reporting, and your instance is no longer running on it. That differs from an `IMPAIRED` `DOMAIN_STATE`, which describes a virtual machine that still exists but isn't running properly.

The platform reports it only after the machine has given a complete account of what it runs and left your instance out for 60 seconds. A machine that's merely unreachable never produces it. In the same state, `HOST_REACHABLE` reads `OK`.

This is the one check that asks you to act. The instance's `status` stays `RUNNING`, because nobody asked for anything else. Stop the instance and start it again. The stop completes quickly, since there is nothing left to shut down. The start can place the instance on any machine, with its volumes, network interface and addresses unchanged. To automate this, poll `healthChecks` and act on `GUEST_PRESENT: IMPAIRED`.

## Related

- [Instance lifecycle](lifecycle.md)
- [When the machine under an instance fails](host-failure.md)
- [Stop and start an instance](stop-start.md)
- [Troubleshoot Compute](../troubleshooting/index.md)
