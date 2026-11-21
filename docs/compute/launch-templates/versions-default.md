---
id: launch-templates-versions-default
title: Set a launch template's default version
description: Make another version a launch template's default with the compute REST API, so launches that name no version use it.
page_type: task
parent: launch-templates
nav_order: 50
tags: [compute, launch-templates, api]
related: [launch-templates-how-it-works, launch-templates-versions-create]
last_reviewed: 2026-11-21
---

# Set a launch template's default version

The default version is the one a launch uses when it names no version, and the one the template shows under its bare name. It changes only when you set it.

## Before you begin

- The `compute.launch_template.update` permission on the template.
- The number of a version the template has. See [View launch template versions](versions-view.md).
- An access token for the REST API. See [Use the API](../../platform/access/api.md).

## Set the default

Update the template with `defaultVersion` in the update mask:

```sh
curl -s -X PATCH \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates/<launch-template-id>?updateMask=default_version" \
  -H "Authorization: Bearer $(origin id token --raw)" \
  -H "Content-Type: application/json" \
  -d '{"defaultVersion": 3}'
```

The response is the template with `defaultVersion` set, showing that version's `launchTemplateData`. No version's recipe changes.

A number the template has no version for, such as a deleted one, is refused with `BAD_REQUEST` on `launchTemplate.defaultVersion`, and the default stays.

To change the tags in the same request, use `updateMask=tags,default_version`. With `updateMask=*`, the tags are replaced and a `defaultVersion` of `0` or none leaves the default as it is.

## Related

- [Delete a launch template version](versions-delete.md)
- [How launch templates work](how-it-works.md#versions)
