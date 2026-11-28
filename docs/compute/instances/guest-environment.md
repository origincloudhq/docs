---
id: instances-guest-environment
title: Guest environment
description: What the platform sets up inside an instance - the login user and SSH key, its network configuration, time synchronization - and why each image needs its own machine-id.
page_type: concept
parent: instances
nav_order: 50
tags: [compute, instances, images]
related: [images, key-pairs, images-create]
last_reviewed: 2026-11-26
---

# Guest environment

At first boot, the platform hands the guest a short configuration through cloud-init. It creates the login user with your SSH key and points the guest's clock at the platform's time service. Everything else inside the guest comes from the image.

cloud-init reads that configuration over the network, from the [instance metadata service](../reference/metadata-service.md#boot-configuration). The instance's firmware carries the system serial number `ds=nocloud-net;s=http://169.254.169.254/nocloud/`, which tells cloud-init's NoCloud datasource where to look, so the instance has no configuration disk. The image needs cloud-init with the NoCloud datasource, which the platform-provided images and the common distributions' cloud images include.

An instance started before the platform served its configuration this way still has a small cloud-init seed disk. It keeps the disk until it's stopped and started, and then boots without it.

## Login user

Every instance has a login user: a non-root account with passwordless `sudo` and no password of its own. The public key of the instance's key pair is its only credential, so the login is `ssh <login-user>@<address>`.

The name comes from one of two places:

**The image's `defaultUser`**  
Every image carries one. The platform-provided images use `cloud`. When you create your own image you can set a different one. See [Images](../images/index.md).

**A `loginUser` override at launch**  
Set `--login-user` on `origin compute create-instance`, or `loginUser` in [a recipe through the API](../instances/launch.md#launch-from-a-recipe-with-the-api), to use a different name for one instance without publishing an image for it.

A login user name is a POSIX user name: lowercase letters, digits, underscores and hyphens, at most 32 characters, starting with a letter or underscore, and not `root`.

Whichever applies, the instance reports it as `loginUser`. Read the name from the instance rather than from the image. It's fixed for the instance's life, even if the image is later deleted or its family moves on.

## Network configuration

An instance gets its network configuration over DHCP, from a server on your subnet that answers only your instance's own interfaces. cloud-init sets the instance's first network interface to use DHCP for IPv4 and IPv6, and the image's own configuration decides about any other interface. An instance that asks for an IPv4 address by DHCP gets:

- the interface's private IPv4 address and the subnet's prefix length
- the subnet's gateway as the default route
- a route to `169.254.169.254` on the interface itself
- the subnet's DNS resolver, which also serves time, and the search domain `internal`
- the hostname `ip-<a>-<b>-<c>-<d>.internal`, built from the private IPv4 address

The route to `169.254.169.254` is what lets cloud-init reach its configuration, before anything in the guest is set up. The address is the interface's for as long as the instance runs: a lease lasts a day and renews twice a day, and the DHCP server never hands out any other address.

The interface's IPv6 address is available the same way, over DHCPv6. The subnet's router advertisements tell the instance to ask DHCPv6 for its address, and the server answers with the interface's private IPv6 address. The IPv6 default route and the subnet's prefix come from the router advertisements, not from DHCPv6. The DHCPv6 server hands out no DNS resolver: the resolver is the IPv4 one above. Like the IPv4 lease, the IPv6 address stays the interface's for as long as the instance runs. Its lifetime is a day, and it renews twice a day.

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
