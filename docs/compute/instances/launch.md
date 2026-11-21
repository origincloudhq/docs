---
id: instances-launch
title: Launch an instance
description: Launch a virtual machine with the CLI or the API - choose an image, instance type, key pair and network interface - and log in over SSH.
page_type: task
parent: instances
nav_order: 60
tags: [compute, instances, cli, api]
related: [instances-instance-types, instances-lifecycle, reference-cli]
last_reviewed: 2026-11-21
---

# Launch an instance

Launch an instance to get a running Linux machine you can log in to over SSH. You choose what it boots from, its size, its key pair, and the network interface that places it on the network.

## Before you begin

- An organization that is approved and has a valid payment method, and a project to launch into. See [Organizations](../../platform/organizations/index.md) and [Add a payment method](../../platform/billing/payment-method.md).
- The `origin` CLI, logged in, with a default project and zone. See [Use the CLI](../../platform/access/cli.md#set-a-default-project-zone-and-region).
- A key pair in the project. See [Create a key pair](../key-pairs/create.md).
- A subnet in your default zone to launch into, and a security group in its VPC that admits the traffic you need, such as SSH. Your project's [default VPC](../../network/vpcs/default-vpc.md) has both once the platform has created it. Otherwise, build a VPC first; see [Create a VPC and subnets](../../network/vpcs/create.md).
- Free quota for one more instance and its vCPUs, and for its root disk. See [Limits](../../platform/reference/limits.md#compute).

## How a launch fits together

An instance's network interface is a resource of its own: you create it in a subnet, open it with a security group, and name it at launch. It keeps its addresses for the instance's whole life, and stays when the instance is terminated.

With the API, you can instead launch from a recipe that holds the interface's spec, and the launch creates the interface for you. See [Launch from a recipe with the API](#launch-from-a-recipe-with-the-api).

```mermaid
flowchart LR
  accTitle: Steps of a launch with the CLI
  accDescr: Create a network interface in a subnet, associate a security group with it, launch the instance with the interface, the image, the instance type and the key pair, and optionally associate a floating IP with the interface for a public address.
  nic[Create a network interface in a subnet] --> sg[Associate a security group]
  sg --> launch[Create the instance with the interface]
  launch --> fip["Associate a floating IP (optional)"]
  fip --> ssh[Log in over SSH]
```

## Choose what to launch

1. Choose an instance type whose `available` is `true`:

   ```sh
   origin compute list-instance-types
   ```

   For what the fields mean, see [Instance types](instance-types.md).

2. Choose an image. List the platform-provided images in your zone, and your project's own:

   ```sh
   origin compute list-public-images --zone eu-central1-az1
   origin compute list-images --zone eu-central1-az1
   ```

   To launch the current image of a family instead, note the family's `name` from `origin compute list-image-families`, and use `--image-family //compute.origincloudapis.eu/<family-name>` in place of `--image` in the launch below. See [Image families](../images/image-families.md).

## Create the network interface

1. Find the subnet and the security group. List the VPCs of your default region, then the subnets and security groups of the one to launch into:

   ```sh
   origin network list-vpcs
   origin network list-subnets --vpc //network.origincloudapis.eu/projects/<project>/regions/<region>/vpcs/<vpc-id> --zone eu-central1-az1
   origin network list-security-groups --vpc //network.origincloudapis.eu/projects/<project>/regions/<region>/vpcs/<vpc-id>
   ```

   The default VPC reads `projectDefault: true`, and its default security group `vpcDefault: true`. The default security group admits SSH, HTTP, HTTPS and ICMP from anywhere. See [Security groups](../../network/traffic-control/security-groups.md).

2. Create a network interface in the subnet, and note its `name` from the output:

   ```sh
   origin network create-network-interface --subnet //network.origincloudapis.eu/projects/<project>/zones/<zone>/subnets/<subnet-id>
   ```

   The interface gets the subnet's next free IPv4 and IPv6 addresses. It admits and sends nothing until a security group opens it.

3. Open the interface with the security group:

   ```sh
   origin network create-security-group-association \
     --network-interface <network-interface-id> \
     --security-group //network.origincloudapis.eu/projects/<project>/regions/<region>/securityGroups/<security-group-id>
   ```

   Repeat this step for each further group. An interface admits the traffic any of its groups allows. For more on interfaces, see [Network interfaces](../../network/vpcs/network-interfaces.md).

## Launch the instance

1. Launch the instance with the interface:

   ```sh
   origin compute create-instance \
     --instance-type //compute.origincloudapis.eu/instanceTypes/gp1.core.2 \
     --image-family //compute.origincloudapis.eu/imageFamilies/<family-id> \
     --key-pair //compute.origincloudapis.eu/projects/<project>/keyPairs/<key-pair-id> \
     --network-interface //network.origincloudapis.eu/projects/<project>/zones/<zone>/networkInterfaces/<network-interface-id> \
     --tag origin:name=web-1
   ```

   Each flag that names another resource takes its full name: its service's host, such as `//compute.origincloudapis.eu/`, followed by the `name` its list or create command prints.

   The instance passes through `INITIALIZING` and `PENDING`. The command waits until it reads `RUNNING`, then prints it. If the launch fails, the command fails with the reason; the instance still exists as `FAILED`, with the reason in `stateReason`. See [Status reasons](../reference/status-reasons.md).

2. Add the options you need. Each is optional:

   | Option | Use it to |
   |---|---|
   | `--image <image>` | Launch a specific image instead of a family's current one, by its full name: a public image's is `//compute.origincloudapis.eu/zones/<zone>/images/<image-id>`, one of your own `//compute.origincloudapis.eu/projects/<project>/zones/<zone>/images/<image-id>`. Give exactly one of `--image` and `--image-family`. |
   | `--boot-volume size_gib=<size>,storage_class=//pvs.origincloudapis.eu/storageClasses/<class>` | Make the root disk bigger than the image, or pick its storage class. Either key can be left out. See [Instance storage](../instance-storage/index.md) and [Storage classes](../../storage/volumes/storage-classes.md). |
   | `--login-user <name>` | Override the image's default user. See [Guest environment](guest-environment.md#login-user). |
   | `--tag <KEY=VALUE>` | Tag the instance; `--tag origin:name=web-1` names it. Repeat it for more tags. See [Tags](../../platform/tags.md). |
   | `--no-wait` | Print the launch's operation at once instead of waiting. Wait for it later with `origin compute wait-operation --operation <operation-name>`. See [Wait for long-running operations](../../platform/access/cli.md#wait-for-long-running-operations). |

3. Find the instance's private addresses. The instance's `interfaceAddresses` lists each network interface with its `ipv4Address` and `ipv6Address`:

   ```sh
   origin compute get-instance --instance <instance-id>
   ```

   `list-instances` shows the same for every instance. See [Network interfaces](../../network/vpcs/network-interfaces.md).

## Give the instance a public address

An instance launched with an interface you created gets no public address of its own, even in a subnet whose auto-assign public IP setting is on. To reach it from the internet, associate a floating IP with its interface. Its subnet's route table also needs a default route to an internet gateway, as the default VPC's has.

1. Allocate a floating IP, and note its `name` and `address`:

   ```sh
   origin network create-floating-ip
   ```

2. Associate it with the instance's network interface:

   ```sh
   origin network create-floating-ip-association \
     --floating-ip <floating-ip-id> \
     --network-interface //network.origincloudapis.eu/projects/<project>/zones/<zone>/networkInterfaces/<network-interface-id>
   ```

See [Floating IPs](../../network/internet-access/floating-ips.md).

## Log in

Verify that you can log in, as the instance's `loginUser`, with the private key of the key pair:

```sh
ssh -i <private-key-file> <login-user>@<public-address>
```

One of the interface's security groups must allow inbound TCP port 22 from your address. The default VPC's default security group allows SSH from anywhere. In a VPC you created, the subnet also needs a route to the internet gateway; see [Create a VPC and subnets](../../network/vpcs/create.md#build-a-network-that-reaches-the-internet).

## Launch from a recipe with the API

A launch can also take a recipe of the instance: its type, image or image family, key pair, and optionally its login user, boot volume, service account, tags, and network interface. Where the recipe gives the interface as a spec, a subnet and security groups, the launch creates the interface for the instance. You don't create one beforehand.

Send the recipe as `launchTemplateData` to the `:launch` method of the zone's instances:

```sh
curl -s -X POST \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/zones/eu-central1-az1/instances:launch" \
  -H "Authorization: Bearer $(origin id token --raw)" \
  -H "Content-Type: application/json" \
  -d '{
    "launchTemplateData": {
      "instanceType": "//compute.origincloudapis.eu/instanceTypes/gp1.core.2",
      "imageFamily": "//compute.origincloudapis.eu/imageFamilies/<family>",
      "keyPair": "//compute.origincloudapis.eu/projects/<project-id>/keyPairs/<key-pair-id>",
      "bootVolume": {"sizeGib": 40},
      "tags": {"origin:name": "web-1"},
      "networkInterfaces": [{
        "spec": {
          "subnet": "//network.origincloudapis.eu/projects/<project-id>/zones/eu-central1-az1/subnets/<subnet-id>",
          "securityGroups": ["//network.origincloudapis.eu/projects/<project-id>/regions/eu-central1/securityGroups/<security-group-id>"]
        }
      }]
    }
  }'
```

The answer is the launch's operation, done once the instance is `RUNNING`, as for a launch with an interface you created.

Each entry of `networkInterfaces` holds exactly one of these, and a recipe holds at most one entry:

| Entry | What the launch does |
|---|---|
| `spec` | Creates an interface in `subnet`, in the security groups of `securityGroups`. Without a `subnet`, it uses your project's default subnet, and creates the [default VPC](../../network/vpcs/default-vpc.md) and its subnet the first time a launch needs them. A default subnet gives the interface a public address. Without `securityGroups`, the interface gets its VPC's default security group. |
| `networkInterface` | Takes the existing interface of that full name, which must be free and in the instance's project and zone. It brings its own subnet and security groups. |

A recipe with no `networkInterfaces` launches with one interface, as from an empty `spec`.

An interface created from a spec belongs to its instance. It is deleted when you terminate the instance. An instance that ends `FAILED` keeps it, so starting the instance again can use it. An existing interface you named is only released when the instance is terminated, and stays.

A launch refused before the instance exists creates no instance and no interface. A refusal names the recipe's field, such as `launchTemplateData.networkInterfaces[0].spec.subnet`.

## Using the GraphQL API

The `launchInstance` mutation takes the project, the image, instance type, key pair and boot volume; the project, the image, the key pair and the subnet are named by their full resource names. Without a subnet, it launches into your project's default subnet, and the platform creates the default VPC the first time a launch needs it; see [Default VPC](../../network/vpcs/default-vpc.md). It also accepts `imageFamily` in place of `image`, which launches the image currently designated for that family. Set exactly one of the two. See [Image families](../images/image-families.md).

```graphql
mutation {
  compute {
    launchInstance(input: {
      project: "//resourcemanager.origincloudapis.eu/projects/<project-id>"
      imageFamily: "<family-slug>"
      instanceType: "gp1.core.2"
      keyPair: "//compute.origincloudapis.eu/projects/<project-id>/keyPairs/<key-pair-id>"
      bootVolume: { sizeInGib: 40 }
    }) {
      id
      status
      loginUser
    }
  }
}
```

## If the launch is refused

A refused launch creates nothing and costs nothing.

- **`INSUFFICIENT_CAPACITY`**: no machine has room for this type right now. The message names the type and what was short. Retry later or launch a smaller type. See [`INSUFFICIENT_CAPACITY`](../../platform/reference/errors.md#insufficient_capacity).
- **`PRODUCT_UNAVAILABLE`**: the instance type or storage class isn't offered. Pick one whose `available` is `true`. See [`PRODUCT_UNAVAILABLE`](../../platform/reference/errors.md#product_unavailable).
- **Quota**: the launch would take the organization or project past an instance, vCPU or storage limit. The error names the quota. See [Limits](../../platform/reference/limits.md#compute).
- **Root disk too small**: the boot volume's `size_gib` is smaller than the image. The error names the smallest size that works.
- **Network interface in use or elsewhere**: the interface is attached to another instance, or isn't in the instance's project and zone. Create a new one in a subnet of the instance's zone, or launch from a recipe with an interface spec.
- **Subnet full**: the subnet of an interface spec has no free address left. Name another subnet of the zone.
- **Subnet or security group elsewhere**: a spec's subnet isn't in the instance's project and zone, or one of its security groups isn't in the instance's project and region.

For other problems, see [Troubleshoot Compute](../troubleshooting/index.md).

## Next steps

- [Attach a volume](../instance-storage/attach-detach.md)
- [Associate a floating IP](../../network/internet-access/floating-ips.md)
- [Stop and start an instance](stop-start.md)

## Related

- [`create-instance` reference](../reference/cli.md#create-instance)
- [`create-network-interface` reference](../../network/reference/cli.md#create-network-interface)
- [Instance lifecycle](lifecycle.md)
