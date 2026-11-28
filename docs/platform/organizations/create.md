---
id: organizations-create
title: Create an organization
description: Create an organization in the console, with the CLI or with the resource manager REST API, and add its billing details to its default billing account.
page_type: task
parent: organizations
nav_order: 10
tags: [organizations, billing, cli, api]
last_reviewed: 2026-11-25
---

# Create an organization

Create an organization to get an account your company's projects, members and billing live in. Create it from its name, then add the billing details so it can be invoiced.

## Before you begin

- An Origin Cloud user account. Any signed-in user can create an organization.
- For the billing details: the postal address, the email address invoices go to, the person they're addressed to and, if the organization has one, a VAT identification number.
- The billing address's country is one of the 27 EU member states, given as an ISO 3166-1 alpha-2 code such as `DE` or `AT`. Outside Germany, invoicing is business to business only, so a VAT identification number is required for every country except `DE`.

## Create an organization

1. Log in with the CLI. See [Use the CLI](../access/cli.md#log-in).

2. Create the organization:

   ```sh
   origin resourcemanager create-organization --display-name "Example GmbH"
   ```

   Example output (illustrative):

   ```json
   {
     "name": "organizations/0a1b2c3d4e5f",
     "displayName": "Example GmbH",
     "state": "PENDING_REVIEW",
     "createTime": "2026-11-03T09:12:44Z",
     "creator": "//iam.origincloudapis.eu/users/<user-id>"
   }
   ```

3. Note the organization's id, the last segment of its `name`: here `0a1b2c3d4e5f`. `origin resourcemanager` and `origin iam` commands take it as `--organization`.

4. Verify that the organization exists and read its state:

   ```sh
   origin resourcemanager get-organization --organization 0a1b2c3d4e5f
   ```

   `state` is `ACTIVE` or `PENDING_REVIEW`. See [Organization review status](review-status.md).

   With the REST API, the same call is `POST https://resourcemanager.origincloudapis.eu/v1beta1/organizations` with the body `{"displayName": "Example GmbH"}`. It returns the organization, as above. A retry with the same `requestId` (a UUID) in the body returns the organization the first request created.

5. Find the organization's default billing account: `ListBillingAccounts` lists the organization's accounts, and the default one has `defaultAccount: true`. Its `name` is `organizations/<org-id>/billingAccounts/<billing-account-id>`:

   ```sh
   curl -sS "https://billing.origincloudapis.eu/v1beta1/organizations/<org-id>/billingAccounts" \
     -H "$(origin id token --as-header --raw)"
   ```

6. Add the billing details to that account with the billing REST API's `UpdateBillingAccount`. Until then, the organization can't be invoiced. The billing address, invoice email, contact person and, outside Germany, the VAT identification number must all be set:

   ```sh
   curl -sS -X PATCH \
     "https://billing.origincloudapis.eu/v1beta1/organizations/<org-id>/billingAccounts/<billing-account-id>?updateMask=billingAddress,invoiceEmail,contactPerson,vatId" \
     -H "$(origin id token --as-header --raw)" \
     -H "Content-Type: application/json" \
     -d '{
       "billingAddress": {
         "street": "Example Street 1",
         "city": "Berlin",
         "postalCode": "10115",
         "regionCode": "DE"
       },
       "invoiceEmail": "invoices@example.com",
       "contactPerson": "Example Person"
     }'
   ```

   The request is refused with [`BAD_REQUEST`](../reference/errors.md#bad_request), and nothing changes, if the invoice email isn't a valid email address, the country isn't supported or a required VAT identification number is missing. See [Billing](../billing/index.md#billing-details). Once a version of Origin Cloud's legal documents is in force, the default account accepts them with `AcceptLegalDocuments`; see [Legal documents and acceptance](../billing/legal-documents.md#when-you-accept).

## What happens when you create an organization

- You become the organization's Owner (`roles/owner`) and its billing administrator (`roles/billing.administrator`), both organization-wide. See [Billing access](../billing/billing-access.md).
- The organization gets a default billing account named `default`, without billing details until you set them.
- The organization is either activated immediately or placed under review. You get an email that the registration was received, and another when it's approved or rejected. See [Organization review status](review-status.md).

## Next steps

- [Create a project](projects.md)
- [Add a payment method](../billing/payment-method.md)

## Related

- [`create-organization` reference](../reference/cli.md#create-organization)
- [Use the REST APIs](../access/api.md)
