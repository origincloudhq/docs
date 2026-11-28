---
id: reference
title: Compute reference
nav_title: Reference
description: Complete reference material for Compute - every origin compute command and its options, every reason an instance can report for its status, and the metadata service's paths.
page_type: reference
parent: home
nav_order: 50
tags: [reference, compute]
last_reviewed: 2026-11-26
---

# Compute reference

These pages list everything of one kind. For explanations, follow the links back to the concept pages.

## Pages

**[`origin compute` commands](cli.md)**  
Every `origin compute` command with its options.

**[Status reasons](status-reasons.md)**  
Every text an instance can report as its reason, in `stateReason`, what it means and what to do.

**[Instance metadata service](metadata-service.md)**  
Every path the metadata service at `169.254.169.254` answers on an instance, and what it returns.

## REST API

The Compute API answers at `https://compute.origincloudapis.eu`. It's a preview (`v1beta1`): names and fields may still change. Requests and responses are JSON with lower camel case field names, such as `instanceType`. Every request carries an access token; see [Use the REST APIs](../../platform/access/api.md). A method that changes a resource returns a long-running operation. Instances, volume attachments and images are zonal, such as `/v1beta1/projects/<project-id>/zones/<zone>/instances`; key pairs and launch templates belong to a project, such as `/v1beta1/projects/<project-id>/keyPairs`.

## Names

An instance's, image's, key pair's, launch template's and volume attachment's `name` is its relative name, such as `projects/<project>/zones/<zone>/instances/<instance-id>`; the commands that act on one take it, or its id. A launch template's version is named with `@` and its number after the template's name, `projects/<project>/launchTemplates/<launch-template-id>@3`, and a read also takes `@default` and `@latest` there. Its full name is `//compute.origincloudapis.eu/` followed by its `name`. Every reference to another resource is a full name, both in what the CLI and REST API take and in what they show: an instance's `instanceType`, `image`, `imageFamily`, `keyPair`, `networkInterfaces`, `serviceAccount` and `bootVolume`, the same fields of a launch's recipe (`launchTemplateData`) with its interface specs' `subnet` and `securityGroups`, an image's block devices' `sourceSnapshot`, a public image's `imageFamily`, a volume attachment's `volume`, an operation's `target`, a launch's `launchTemplate` and an instance's `launchTemplate`. A launch template version's full name carries its `@` suffix after the full name, `//compute.origincloudapis.eu/projects/<project>/launchTemplates/<launch-template-id>@3`. A relative name or an id there is refused with `BAD_REQUEST`. `creator` is the full name of the principal that created the resource, such as `//iam.origincloudapis.eu/users/<user-id>`.

## Shared reference

- [Error codes](../../platform/reference/errors.md) – the error codes every API call can return
- [Limits](../../platform/reference/limits.md#compute) – Compute quotas
- [Global CLI options](../../platform/reference/cli.md#global-options)
