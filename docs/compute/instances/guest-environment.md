---
id: instances-guest-environment
title: Guest environment
description: What the platform sets up inside an instance at first boot - the login user and SSH key, time synchronization - and why each image needs its own machine-id.
page_type: concept
parent: instances
nav_order: 50
tags: [compute, instances, images]
related: [images, key-pairs, images-create]
last_reviewed: 2026-11-03
---

# Guest environment

At first boot, the platform hands the guest a short configuration through cloud-init. It creates the login user with your SSH key and points the guest's clock at the platform's time service. Everything else inside the guest comes from the image.

## Login user

Every instance has a login user: a non-root account with passwordless `sudo` and no password of its own. The public key of the instance's key pair is its only credential, so the login is `ssh <login-user>@<address>`.

The name comes from one of two places:

**The image's `defaultUser`**  
Every image carries one. The platform-provided images use `cloud`. When you create your own image you can set a different one. See [Images](../images/index.md).

**A `loginUser` override at launch**  
Set `--login-user` on `origin compute create-instance`, or `loginUser` on the `launchInstance` mutation, to use a different name for one instance without publishing an image for it.

A login user name is a POSIX user name: lowercase letters, digits, underscores and hyphens, at most 32 characters, starting with a letter or underscore, and not `root`.

Whichever applies, the instance reports it as `loginUser`. Read the name from the instance rather than from the image. It's fixed for the instance's life, even if the image is later deleted or its family moves on.

## Time synchronization

Instances keep their clocks synchronized without anything to install or open up. The platform serves time on the same address inside your subnet that answers DNS, and configures the guest's `systemd-timesyncd` to use it at first boot. An instance with no floating IP and no route to the internet still keeps accurate time.

A drifting clock surfaces late and looks unrelated: TLS certificates that seem expired or not yet valid, tokens rejected as stale, clustered software disagreeing about order, and logs that don't line up across instances. To confirm synchronization inside a running instance, run:

```sh
timedatectl
```

Expect `NTP service: active` and `System clock synchronized: yes`.

You can point the guest at your own time source instead, like on any Linux machine. Reaching a time server outside your VPC needs internet access, so an instance without a floating IP or a NAT gateway can only use the platform's. See [Internet access](../../network/internet-access/index.md).

### Host clock trust

The time an instance receives comes from the physical machine it runs on. If that machine's own clock isn't synchronized, the platform tells the guest so instead of passing bad time off as good. The guest then declines to sync and reports `System clock synchronized: no`.

That's the safe direction, but it means an unsynchronized clock can be a platform problem rather than yours. If `System clock synchronized: no` persists on an instance that uses the platform's time service, contact Origin Cloud support.

## Machine identity

A Linux instance's machine-id (`/etc/machine-id`) comes from its image. The platform-provided images ship it empty, so each instance generates its own on first boot.

An image you create from a volume contains the machine-id of the instance that volume belonged to. Every instance launched from that image starts with the same machine-id. Clear it before you snapshot the volume. For the steps, see [Create an image](../images/create.md).

Two instances that share a machine-id break in a way you're likely to hit. systemd derives the MAC address of virtual network devices from the machine-id, so same-named VXLAN devices on both instances get the same MAC address and can't exchange packets. That's what Kubernetes pod networking with VXLAN or Geneve encapsulation looks like when it fails this way. Run `cat /etc/machine-id` on both instances first.

## Related

- [Key pairs](../key-pairs/index.md)
- [Images](../images/index.md)
- [Launch an instance](launch.md)
- [Troubleshoot Compute](../troubleshooting/index.md)
