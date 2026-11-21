---
id: launch-templates-delete
title: Delete a launch template
description: Delete a launch template and every version of it with the compute REST API. Instances launched from it keep running.
page_type: task
parent: launch-templates
nav_order: 30
tags: [compute, launch-templates, api]
related: [launch-templates]
last_reviewed: 2026-11-21
---

# Delete a launch template

Deleting a launch template deletes every version of it and its tags. Instances launched from it keep running, and nothing else changes.

## Before you begin

- The `compute.launch_template.delete` permission on the template.
- An access token for the REST API. See [Use the API](../../platform/access/api.md).

## Delete the template

```sh
curl -s -X DELETE \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/launchTemplates/<launch-template-id>" \
  -H "Authorization: Bearer $(origin id token --raw)"
```

The template is gone once the request returns. A project can be deleted only once it has no launch templates left. To delete only one version, see [Delete a launch template version](versions-delete.md).

## Related

- [View launch templates](view.md)
- [Launch templates](index.md)
