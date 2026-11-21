---
id: reference
title: Compute reference
nav_title: Reference
description: Complete reference material for Compute - every origin compute command and its options, and every reason an instance can report for its status.
page_type: reference
parent: home
nav_order: 50
tags: [reference, compute]
last_reviewed: 2026-11-21
---

# Compute reference

These pages list everything of one kind. For explanations, follow the links back to the concept pages.

## Pages

**[`origin compute` commands](cli.md)**  
Every `origin compute` command with its options.

**[Status reasons](status-reasons.md)**  
Every text an instance can report as its reason, in `stateReason` (CLI) or `statusReason` (GraphQL API), what it means and what to do.

## Names

An instance's, image's, key pair's and volume attachment's `name` is its relative name, such as `projects/<project>/zones/<zone>/instances/<instance-id>`; the commands that act on one take it, or its id. Its full name is `//compute.origincloudapis.eu/` followed by its `name`. Every reference to another resource is a full name, both in what the CLI and REST API take and in what they show: an instance's `instanceType`, `image`, `imageFamily`, `keyPair`, `networkInterfaces`, `serviceAccount` and `bootVolume`, the same fields of a launch's recipe (`launchTemplateData`) with its interface specs' `subnet` and `securityGroups`, an image's block devices' `sourceSnapshot`, a public image's `imageFamily`, a volume attachment's `volume`, and an operation's `target`. A relative name or an id there is refused with `BAD_REQUEST`. `creator` is the full name of the principal that created the resource, such as `//iam.origincloudapis.eu/users/<user-id>`.

## Shared reference

- [Error codes](../../platform/reference/errors.md) – the error codes every API call can return
- [Limits](../../platform/reference/limits.md#compute) – Compute quotas
- [Global CLI options](../../platform/reference/cli.md#global-options)
