---
id: launch-templates-versions-delete
title: Delete a launch template version
description: Delete one version of a launch template with the compute REST API. The default version can't be deleted, and a deleted version's number is never used again.
page_type: task
parent: launch-templates
nav_order: 55
tags: [compute, launch-templates, api]
related: [launch-templates-how-it-works, launch-templates-versions-default]
last_reviewed: 2026-11-21
---

# Delete a launch template version

Delete a version you no longer launch from. The template and its other versions stay. To delete the whole template, see [Delete a launch template](delete.md).

## Before you begin

- The `compute.launch_template.update` permission on the template. Deleting a version changes the template; it doesn't delete it.
- The number of the version. It can't be the default version: [make another one the default](versions-default.md) first.
- An access token for the REST API. See [Use the API](../../platform/access/api.md).

## Delete the version

Name the version by its number after `@`:

```sh
curl -s -X DELETE \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates/<launch-template-id>@2:deleteVersion" \
  -H "Authorization: Bearer $(origin id token --raw)"
```

The version is gone once the request returns. Deleting one that is already gone succeeds too.

- Deleting the default version is refused with `FAILED_PRECONDITION`, and nothing changes.
- Only a number names a version to delete: `@default` and `@latest` are refused with `BAD_REQUEST`.
- When you delete the newest version, `latestVersion` becomes the highest number left. The next version you create still gets a new number: a deleted version's number is never used again.

## Related

- [View launch template versions](versions-view.md)
- [How launch templates work](how-it-works.md#versions)
