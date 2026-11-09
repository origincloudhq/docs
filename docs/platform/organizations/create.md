---
id: organizations-create
title: Create an organization
description: Register an organization with its billing details in the console or the API, or create it from its name alone with the CLI and add the billing details later.
page_type: task
parent: organizations
nav_order: 10
tags: [organizations, billing, cli, api]
last_reviewed: 2026-11-03
---

# Create an organization

Create an organization to get an account your company's projects, members and billing live in. You can register it with its billing details in one step, or create it from its name alone and add the billing details afterwards.

## Before you begin

- An Origin Cloud user account. Any signed-in user can create an organization.
- To register with billing details: the postal address, the email address invoices go to, the person they're addressed to and, if the organization has one, a VAT identification number.
- The billing address's country is one of the 27 EU member states, given as an ISO 3166-1 alpha-2 code such as `DE` or `AT`. Outside Germany, invoicing is business to business only, so a VAT identification number is required for every country except `DE`.

## Register an organization

Registering creates the organization and stores the billing details on its default billing account, so it can be invoiced from the start. Register in the console, or with the `registerOrganisation` mutation in the `admin` namespace of the [GraphQL API](../access/api.md). The CLI has no command that takes billing details.

The mutation takes the organization's name, the billing address as a `billingAddress` object, the invoice email, the contact person and, where required, the VAT identification number. It answers with the organization, including its `orgId` and its `status`, `ACTIVE` or `PENDING_REVIEW`. For what each status means, see [Organization review status](review-status.md).

The request is refused, and nothing is created, if the invoice email isn't a valid email address, the country isn't supported, or a required VAT identification number is missing. The error is [`BAD_REQUEST`](../reference/errors.md#bad_request) and names the field: `invoice_email`, `country` or `vat_id`.

## Create an organization from its name alone

Use this path if someone else adds the billing details later.

1. Log in with the CLI. See [Use the CLI](../access/cli.md#log-in).

2. Create the organization:

   ```sh
   origin resourcemanager create-organization --display-name "Example GmbH"
   ```

   Example output (illustrative):

   ```json
   {
     "name": "organizations/0a1b2c3d4e5f",
     "urn": "urn:origin:cloud:admin::::0a1b2c3d4e5f",
     "displayName": "Example GmbH",
     "state": "PENDING_REVIEW",
     "createTime": "2026-11-03T09:12:44Z",
     "creator": "user:..."
   }
   ```

3. Note the organization's id, the last segment of its `name`: here `0a1b2c3d4e5f`. `origin resourcemanager` and `origin iam` commands take it as `--organization`.

4. Verify that the organization exists and read its state:

   ```sh
   origin resourcemanager get-organization --organization 0a1b2c3d4e5f
   ```

   `state` is `ACTIVE` or `PENDING_REVIEW`. See [Organization review status](review-status.md).

5. Add the billing details to its default billing account with the `updateBillingAccountProfile` mutation. Until then, the organization can't be invoiced. See [Billing](../billing/index.md#billing-details).

Both paths end in the same state; registering does it in one call.

## What happens when you create an organization

- You become the organization's Owner (`roles/owner`) and its billing administrator (`roles/billing/administrator`), both organization-wide. See [Billing access](../billing/billing-access.md).
- The organization gets a default billing account named `default`. When you register, it carries your billing details.
- The organization is either activated immediately or placed under review. You get an email that the registration was received, and another when it's approved or rejected. See [Organization review status](review-status.md).

## Next steps

- [Create a project](projects.md)
- [Add a payment method](../billing/payment-method.md)

## Related

- [`create-organization` reference](../reference/cli.md#create-organization)
- [Use the GraphQL API](../access/api.md)
