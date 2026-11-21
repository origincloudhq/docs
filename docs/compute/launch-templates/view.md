---
id: launch-templates-view
title: View launch templates
description: List a project's launch templates or read one with the compute REST API, each with its default version's recipe and its version numbers.
page_type: task
parent: launch-templates
nav_order: 20
tags: [compute, launch-templates, api]
related: [launch-templates]
last_reviewed: 2026-11-21
---

# View launch templates

List a project's launch templates, or read one by its name.

## Before you begin

- The `compute.launch_template.list` permission on the project to list, or `compute.launch_template.get` on the template to read one.
- An access token for the REST API. See [Use the API](../../platform/access/api.md).

## List a project's templates

```sh
curl -s \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates" \
  -H "Authorization: Bearer $(origin id token --raw)"
```

The response's `launchTemplates` lists them oldest first. When there are more than fit a page, pass the response's `nextPageToken` as `pageToken` for the next one.

## Read one template

```sh
curl -s \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates/<launch-template-id>" \
  -H "Authorization: Bearer $(origin id token --raw)"
```

A template shows:

- `launchTemplateData`: the recipe of its default version.
- `defaultVersion` and `latestVersion`: the numbers of its default and newest versions.
- `version` and `versionCreateTime`: the number of the version whose recipe it shows, its default, and when that version was created.
- `createTime` and `creator`: when and by whom it was created.
- `tags`: its own tags.

To read another version, or every version, see [View launch template versions](versions-view.md).

A template that doesn't exist, or is in another project, is `NOT_FOUND`. A template you just created may take a moment to be listed; a read that sends the `Origin-Consistency-Token` its create answered with waits for it.

## Related

- [Create a launch template](create.md)
- [How launch templates work](how-it-works.md)
