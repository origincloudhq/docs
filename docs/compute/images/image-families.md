---
id: images-image-families
title: Image families
description: How an image family resolves to its current platform-provided image, what its metadata tells you about upstream support, and what happens when one is withdrawn.
page_type: concept
parent: images
nav_order: 10
tags: [compute, images]
related: [images, instances-launch]
last_reviewed: 2026-11-03
---

# Image families

An image family is a stable name for a line of platform-provided images, such as `ubuntu-22-04-minimal`. A launch that names a family gets whichever image the platform has designated as current for it. A launch that names an image gets exactly that image.

Launch by family to pick up rebuilt images automatically. Launch by image to pin the image you tested against.

## Launching by family

Launch with the family's id in place of an image: `--image-family <family-id>` on `origin compute create-instance`, or `imageFamily` on the `launchInstance` mutation. Give exactly one of `--image` and `--image-family`. The launched instance's `image` names the public image the family resolved to.

To see which image a family currently resolves to, list the public images. Each one carries its `imageFamily` and, as `familyCurrent`, whether it is that family's current image:

```sh
origin compute list-public-images --zone eu-central1-az1
```

A family resolves separately per CPU architecture. With `X86_64` as the only architecture, a family resolves to one image.

A new image is published into a family first and designated current afterward, so a family can briefly have a newer image that isn't current yet. A family that has no current image refuses launches with "no image is currently published for this family".

## Family metadata

Read the families with the `imageFamilies` query or with the CLI:

```sh
origin compute list-image-families
```

The table names the fields as the `imageFamilies` query returns them. `list-image-families` prints the family's id as the last segment of its `name`, such as `imageFamilies/ubuntu-22-04-minimal`, `supportEndsAt` as `supportEndTime`, and also `available`, whether you can launch from the family right now.

| Field | Meaning |
|---|---|
| `slug` | The name to pass as `imageFamily`, for example `ubuntu-22-04-minimal`. |
| `vendor` | Who publishes the upstream release, for example `Canonical`. |
| `os` | The operating system the family tracks, for example `ubuntu`. |
| `osVersion` | The release, for example `22.04`. |
| `description` | A human-readable description. |
| `supportEndsAt` | When the upstream vendor stops supporting this release, if a date is known. |

`supportEndsAt` is advisory. No launch is refused on it, and running instances aren't affected. Treat it as notice to move to a newer family.

## Stable names and withdrawn families

A family is never renamed, and a name is never reused for a different line. A name in your scripts keeps meaning what it meant.

A family can be withdrawn when a newer line supersedes it. A withdrawn family:

- Drops out of `imageFamilies`. `list-image-families` still lists it, with `available: false`.
- Refuses launches by its name.
- Doesn't affect anything you're already running. The images published under it stay listed and can still be launched with `--image`.

## Related

- [Images](index.md)
- [Launch an instance](../instances/launch.md)
- [`list-image-families` reference](../reference/cli.md#list-image-families)
