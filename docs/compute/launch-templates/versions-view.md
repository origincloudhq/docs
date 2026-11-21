---
id: launch-templates-versions-view
title: View launch template versions
description: List a launch template's versions, or read one by its number, @default or @latest, with the compute REST API.
page_type: task
parent: launch-templates
nav_order: 45
tags: [compute, launch-templates, api]
related: [launch-templates-how-it-works, launch-templates-view]
last_reviewed: 2026-11-21
---

# View launch template versions

List every version of a launch template, or read one of them.

## Before you begin

- The `compute.launch_template.get` permission on the template.
- An access token for the REST API. See [Use the API](../../platform/access/api.md).

## List a template's versions

```sh
curl -s \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates/<launch-template-id>:listVersions" \
  -H "Authorization: Bearer $(origin id token --raw)"
```

The response's `launchTemplates` holds the template at each of its versions, newest first. Each is named with its version's number, such as `…/launchTemplates/<launch-template-id>@3`, and shows that version's `launchTemplateData`, `version` and `versionCreateTime`, beside the template's `defaultVersion`, `latestVersion` and `tags`. A deleted version isn't listed. When there are more than fit a page, pass the response's `nextPageToken` as `pageToken` for the next one.

## Read one version

Read the template with a suffix after its name that picks the version:

| Suffix | Version |
|---|---|
| `@<number>`, such as `@3` | that version |
| `@default` | the default version |
| `@latest` | the newest version the template has |
| none | the default version, under the template's bare name |

```sh
curl -s \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates/<launch-template-id>@latest" \
  -H "Authorization: Bearer $(origin id token --raw)"
```

With a suffix, the response is named with the number of the version it shows: `@latest` and `@default` answer with `@3` when that is the version they pick. Without one, it is the template under its bare name, as [View launch templates](view.md) shows.

A version the template doesn't have, such as one that was deleted, is `NOT_FOUND`. A version you just created may take a moment to show; a read that sends the `Origin-Consistency-Token` its create answered with waits for it.

## Related

- [Create a launch template version](versions-create.md)
- [How launch templates work](how-it-works.md#versions)
