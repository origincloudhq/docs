---
id: launch-templates-launch
title: Launch an instance from a launch template
description: Launch an instance from a launch template's version, by its number, @default or @latest, and override some of its fields for that launch only.
page_type: task
parent: launch-templates
nav_order: 60
tags: [compute, launch-templates, instances, api]
related: [launch-templates-how-it-works, instances-launch, launch-templates-versions-view]
last_reviewed: 2026-11-21
---

# Launch an instance from a launch template

Launch an instance from the recipe a launch template keeps, instead of sending the whole recipe with the launch. You can change some of the recipe's fields for one launch, and the template stays as it is.

## Before you begin

- A launch template in the project you launch into. See [Create a launch template](create.md).
- The `compute.launch_template.get` permission on the template, and the `compute.instance.launch` permission on the project. A recipe with a service account also needs `iam.service_account.act_as` on the organization, as any launch with one does.
- An access token for the REST API. See [Use the API](../../platform/access/api.md).

## Launch from a template

Send the template's full name as `launchTemplate` to the `:launch` method of the instances of the zone to launch in. A suffix after the name picks the version:

| `launchTemplate` | Version launched |
|---|---|
| `//compute.origincloudapis.eu/projects/<project-id>/launchTemplates/<launch-template-id>` | the default version |
| the same, with `@default` | the default version |
| the same, with `@latest` | the newest version the template has |
| the same, with `@<number>`, such as `@3` | that version |

```sh
curl -s -X POST \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/zones/eu-central1-az1/instances:launch" \
  -H "Authorization: Bearer $(origin id token --raw)" \
  -H "Content-Type: application/json" \
  -d '{
    "launchTemplate": "//compute.origincloudapis.eu/projects/<project-id>/launchTemplates/<launch-template-id>@latest"
  }'
```

`@default` and `@latest` pick the version they name when the launch is made. A version created or a default set afterwards doesn't change the instance.

The answer is the launch's operation, done once the instance is `RUNNING`, as for a launch from a recipe. The launch does what the version's recipe says, such as creating a network interface from its spec. See [Launch from a recipe with the API](../instances/launch.md#launch-from-a-recipe-with-the-api).

## Override fields for one launch

Send `launchTemplateData` beside `launchTemplate` with only the fields to change. Each field you set replaces the version's for this launch. A field you leave out or empty keeps the version's, so an override can't clear a field of the version.

```sh
curl -s -X POST \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/zones/eu-central1-az1/instances:launch" \
  -H "Authorization: Bearer $(origin id token --raw)" \
  -H "Content-Type: application/json" \
  -d '{
    "launchTemplate": "//compute.origincloudapis.eu/projects/<project-id>/launchTemplates/<launch-template-id>@3",
    "launchTemplateData": {
      "instanceType": "//compute.origincloudapis.eu/instanceTypes/gp1.core.4",
      "tags": {"origin:name": "web-2"}
    }
  }'
```

Most fields replace the version's one by one. These replace more than themselves:

| Field you set | What it replaces |
|---|---|
| `image` or `imageFamily` | both of the version's `image` and `imageFamily`, so the launch names exactly one |
| `bootVolume.sizeGib`, `bootVolume.storageClass` | each the version's own; the one you leave out stays |
| `tags` | all of the version's tags |
| `networkInterfaces` | all of the version's interfaces |

The template's version doesn't change: reading it afterwards shows the recipe it had. To keep a change for later launches, [create a version](versions-create.md) with it.

## See which template an instance came from

An instance launched from a template shows it in `launchTemplate`, the full name of the version with the number the launch used, such as `//compute.origincloudapis.eu/projects/<project-id>/launchTemplates/<launch-template-id>@3` for a launch that named `@latest` when version 3 was the newest:

```sh
curl -s \
  "https://compute.origincloudapis.eu/v1beta1/projects/<project-id>/zones/eu-central1-az1/instances/<instance-id>" \
  -H "Authorization: Bearer $(origin id token --raw)"
```

The instance keeps it when the version or the template is deleted later. An instance launched without a template has no `launchTemplate`.

## If the launch is refused

- **`NOT_FOUND`**: the template doesn't exist, or doesn't have the version you named, such as one that was deleted.
- **`BAD_REQUEST` on `launchTemplate`**: the name isn't the full name of a launch template, or the template is another project's than the one you launch into.
- **`FORBIDDEN`**: you lack `compute.launch_template.get` on the template, or `compute.instance.launch` on the project.
- **A field of the recipe**: what the version and your overrides name together is checked as a launch from a recipe is. A version whose image, key pair or subnet has since been deleted, or isn't in the zone you launch in, is refused naming that field, such as `launchTemplateData.keyPair`. Override the field, or create a version that names one that exists.

For the other refusals, see [Launch an instance](../instances/launch.md#if-the-launch-is-refused).

## Related

- [How launch templates work](how-it-works.md)
- [View launch template versions](versions-view.md)
- [Launch an instance](../instances/launch.md)
