---
id: vpcs-network-interfaces
title: Network interfaces
description: A network interface holds an instance's private IPv4 and IPv6 addresses in a subnet and carries its security groups. Learn how to create one, launch with it, and remove it.
page_type: concept
parent: vpcs
nav_order: 30
tags: [networking, vpc]
last_reviewed: 2026-11-03
---

# Network interfaces

A network interface holds an instance's private IPv4 and IPv6 addresses in one subnet. It also carries the security groups that filter the instance's traffic, and it's what a Floating IP is associated with.

## Create an interface, then launch with it

With the CLI, you create a network interface first and launch an instance with it:

1. Create the interface in a subnet. It takes the subnet's next free IPv4 and IPv6 addresses, and starts `AVAILABLE`, in no security group.

   ```sh
   origin network create-network-interface --subnet <subnet-id>
   ```

2. Associate one or more security groups with it. Until then the interface admits and sends nothing except replies to its own traffic and address resolution.

   ```sh
   origin network create-security-group-association \
     --network-interface <network-interface-id> \
     --security-group <security-group-id>
   ```

3. Launch the instance with `--network-interface <network-interface-id>`. See [Launch an instance](../../compute/instances/launch.md).

An interface's subnet decides the instance's subnet, and its security groups are the instance's. You can add and remove security group associations while the interface is attached; a running instance picks the change up within seconds. See [Change an interface's security groups](../traffic-control/security-groups.md#change-an-interfaces-security-groups).

When you terminate the instance, an interface you created is released: it's `AVAILABLE` again, with its addresses, security groups and Floating IP associations, ready for another instance. Delete it with `delete-network-interface --yes` when you no longer need it. Deleting a subnet deletes its unattached interfaces.

A launch through the GraphQL API's `launchInstance` creates the instance's interface itself, in the subnet it names or in the default VPC's subnet, and deletes that interface with the instance.

## Interface states

An interface's `state` shows whether it's in use:

**`AVAILABLE`**  
Not attached to anything.

**`ATTACHED`**  
In use. The `instance` field names the instance it's attached to.

`delete-network-interface` is refused while the interface is `ATTACHED`, and while a Floating IP is still associated with it. Remove the Floating IP's association first; see [Floating IPs](../internet-access/floating-ips.md#use-a-floating-ip).

## Source-address check

By default an instance can send only from its own interface's addresses. A packet leaving the instance is dropped at the interface unless it carries:

- the interface's MAC address, and
- the interface's private IPv4 or IPv6 address as its source. IPv6 traffic from a link-local address (`fe80::/10`) is also allowed, as is the unspecified address `::` for router solicitation and for duplicate address detection of the interface's own addresses.

ARP messages must name the interface's IPv4 address as their sender, or `0.0.0.0` for an address probe. IPv6 Neighbor Advertisements must name the interface's IPv6 address, or the link-local address formed from its MAC address (EUI-64, the Linux default), as their target. If the instance's operating system forms its link-local address another way, such as RFC 7217 stable-privacy addresses, other hosts on the subnet can't resolve that link-local address. IPv6 Router Advertisements and Redirects are dropped, so an instance that acts as an IPv6 router for others needs the check turned off. Frames that are not ARP, IPv4 or IPv6, including VLAN-tagged frames, are dropped.

A Floating IP is not one of these addresses and doesn't need to be: the translation to and from it happens outside the instance, so the instance always sends from its private address.

The check applies to everything the instance sends, including to other instances in the same subnet. With it on, anything that makes the instance send from an address its interface doesn't hold doesn't work:

- an address you add inside the instance's operating system
- forwarding traffic for other addresses, as a router or NAT instance does
- Kubernetes pod networking that routes pod addresses directly between nodes, such as flannel's `host-gw` backend
- a virtual IP shared between instances, with keepalived/VRRP, kube-vip or MetalLB in L2 mode

### Turning the check off

Every interface has a `sourceAddressCheck` setting, `true` unless you turn it off. Turn it off for an instance that legitimately sends from addresses its interface doesn't hold, such as the cases above. With the check off, the interface can send from any address. Its security groups still apply. A subnet's network ACL picks its egress rules by the packet's source address, so a packet sent from an address outside the subnet doesn't meet that subnet's egress rules. Internet access is decided the same way: a packet sent from another subnet's address is treated as that subnet's. With the check off, an instance in a private subnet can send to the internet from an address of a public subnet in its VPC (replies go to that subnet), so keep the check on for any instance that must stay private ([How internet access is decided](../internet-access/route-tables.md#how-internet-access-is-decided)).

Change it on an existing interface with `update-network-interface`, also while it's attached, or choose it when you create the interface with `create-network-interface --source-address-check false`:

```sh
origin network update-network-interface \
  --network-interface <network-interface-id> \
  --source-address-check false
```

A change reaches a running instance within seconds, in either direction; you don't need to stop and start it. Changing the setting needs the `network.interface.update` permission on the interface.

## Related

- [Security groups](../traffic-control/security-groups.md)
- [Floating IPs](../internet-access/floating-ips.md)
- [VPC and subnet addressing](addressing.md)
- [`create-network-interface` reference](../reference/cli.md#create-network-interface)
- [`update-network-interface` reference](../reference/cli.md#update-network-interface)
