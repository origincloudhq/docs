---
id: launch-templates-versions-create
title: Create a launch template version
description: Add a version to a launch template with a new recipe using the compute REST API. It gets the next number and becomes the latest version; the default stays.
page_type: task
parent: launch-templates
nav_order: 40
tags: [compute, launch-templates, api]
related: [launch-templates-how-it-works, launch-templates-versions-default]
last_reviewed: 2026-11-21
---

# Create a launch template version

Add a version to a launch template when its recipe should change. The template keeps every earlier version as it was, and its default version stays the same until you [set the default](versions-default.md).

## Before you begin

- A launch template, and the `compute.launch_template.update` permission on it.
- The recipe for the new version. It takes the same fields as the recipe you [create a template](create.md) with.
- An access token for the REST API. See [Use the API](../../platform/access/api.md).

## Create the version

1. Send the recipe as `launchTemplateData` to the template's `:createVersion` method:

   ```sh
   curl -s -X POST \
     "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates/<launch-template-id>:createVersion" \
     -H "Authorization: Bearer $(origin id token --raw)" \
     -H "Content-Type: application/json" \
     -d '{
       "launchTemplateData": {
         "instanceType": "//compute.origincloudapis.eu/instanceTypes/gp1.core.4",
         "imageFamily": "//compute.origincloudapis.eu/imageFamilies/<family>",
         "keyPair": "//compute.origincloudapis.eu/projects/<project-id>/keyPairs/<key-pair-id>"
       }
     }'
   ```

   The response is the template at the new version. Its `name` ends in `@` and the version's number, such as `projects/<project-id>/launchTemplates/<launch-template-id>@2`. Its `version` and `latestVersion` are that number, and `launchTemplateData` is the recipe as you sent it. `defaultVersion` hasn't changed.

   The recipe is checked as it is when you create a template: a name of the wrong type, or of another project, is refused with `BAD_REQUEST` naming the field, such as `launchTemplateData.keyPair`, and no version is created.

2. To launch from the new version when a launch names no version, [make it the default](versions-default.md).

A new version's number is one past the highest number the template has ever given, so a deleted version's number is never used again. A template holds at most 100 versions. Creating one more is refused with `FAILED_PRECONDITION`; delete a version first.

## Related

- [View launch template versions](versions-view.md)
- [How launch templates work](how-it-works.md#versions)
