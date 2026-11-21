---
id: launch-templates-create
title: Create a launch template
description: Create a launch template from a recipe with the compute REST API. The recipe becomes the template's version 1, which is its default.
page_type: task
parent: launch-templates
nav_order: 10
tags: [compute, launch-templates, api]
related: [launch-templates-how-it-works, instances-launch]
last_reviewed: 2026-11-21
---

# Create a launch template

Create a launch template to keep a recipe for your instances in a project. The recipe you send becomes the template's version 1, and its default.

## Before you begin

- A project, and the `compute.launch_template.create` permission on it.
- The full names of what the recipe names: a key pair, and an image or an image family. See [Launch an instance](../instances/launch.md) for every field of a recipe.
- An access token for the REST API, such as `origin id token --raw`. See [Use the API](../../platform/access/api.md).

## Create the template

1. Send the template as the request body, with the recipe as its `launchTemplateData`. Name the template with the `origin:name` tag:

   ```sh
   curl -s -X POST \
     "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates" \
     -H "Authorization: Bearer $(origin id token --raw)" \
     -H "Content-Type: application/json" \
     -d '{
       "launchTemplateData": {
         "instanceType": "//compute.origincloudapis.eu/instanceTypes/gp1.core.2",
         "imageFamily": "//compute.origincloudapis.eu/imageFamilies/<family>",
         "keyPair": "//compute.origincloudapis.eu/projects/<project-id>/keyPairs/<key-pair-id>",
         "bootVolume": {"sizeGib": 40},
         "networkInterfaces": [{"spec": {}}]
       },
       "tags": {"origin:name": "web"}
     }'
   ```

   The response is the template. Its `defaultVersion` and `latestVersion` are `1`, and its `launchTemplateData` is the recipe as you sent it.

   A name of the wrong type, or of another project, is refused with `BAD_REQUEST` naming the field, and nothing is created. Whether what the recipe names exists, and is in a zone you launch in, is checked at launch. See [How launch templates work](how-it-works.md#what-is-checked-and-when).

2. Note the template's `name`. Its full name is `//compute.origincloudapis.eu/` followed by that `name`.

To make a create safe to retry, send a UUID as `requestId` in the query string. A repeat with the same id returns the first request's template instead of creating a second one.

## Change its tags

A template's tags and its default version are the only things you can change; to change the recipe, [create a version](versions-create.md) and [make it the default](versions-default.md). The recipe's own `tags` are the instances':

```sh
curl -s -X PATCH \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates/<launch-template-id>?updateMask=tags" \
  -H "Authorization: Bearer $(origin id token --raw)" \
  -H "Content-Type: application/json" \
  -d '{"tags": {"origin:name": "web-v2"}}'
```

This needs `compute.launch_template.update` on the template.

## Related

- [View launch templates](view.md)
- [Create a launch template version](versions-create.md)
- [Delete a launch template](delete.md)
