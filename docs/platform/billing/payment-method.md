---
id: billing-payment-method
title: Add a payment method
description: Add a card to a billing account on the payment provider's hosted page, confirm it, and check the payment method state so the account's projects can create billable resources.
page_type: task
parent: billing
nav_order: 10
tags: [billing, api]
last_reviewed: 2026-11-25
---

# Add a payment method

A project can create billable resources only once its billing account has a verified payment method. You enter the card on the payment provider's hosted page; card details never pass through Origin Cloud.

## Before you begin

- The organization ID and the ID of the project you want to unblock.
- The `roles/billing.administrator` or `roles/billing.user` role on the organization. Whoever created the organization has the first one. The Owner role alone isn't enough. See [Billing access](billing-access.md). To look up which billing account a project is charged to, you also need read access to the project, such as `roles/viewer`.
- A way to call the billing REST API, for example `curl` with your CLI token. See [Use the REST APIs](../access/api.md).

## When a payment method is needed

A billing account's `paymentMethod.state` is one of three values:

| `paymentMethod.state` | Meaning |
|---|---|
| `MISSING` | No verified payment method. Billable resources are refused. |
| `VERIFIED` | A payment method is on file and verified. |
| `NOT_REQUIRED` | Billing is arranged with Origin Cloud directly, and no payment method is needed. |

While the state is `MISSING`, these operations in the account's projects are refused with [`PAYMENT_METHOD_REQUIRED`](../reference/errors.md#payment_method_required):

- Launch an instance
- Create, import or grow a volume
- Create a snapshot
- Allocate a Floating IP
- Create a NAT gateway

Creating VPCs, subnets, security groups and other network configuration doesn't need a payment method, so you can set up your network first. The organization must also be `ACTIVE` for the operations above. See [Organization review status](../organizations/review-status.md).

## Add the payment method

The steps call the [billing REST API](rest-api.md) with `curl`. `origin id token --as-header --raw` prints the `Authorization` header with your CLI token.

1. Find the billing account the project is charged to:

   ```sh
   curl -sS https://billing.origincloudapis.eu/v1beta1/projects/<project-id>/billingInfo \
     -H "$(origin id token --as-header --raw)"
   ```

   The response's `billingAccount` is the account's full name, `//billing.origincloudapis.eu/organizations/<org-id>/billingAccounts/<billing-account-id>`. Its path part, `organizations/<org-id>/billingAccounts/<billing-account-id>`, is what the next requests take. Read the account to see its state:

   ```sh
   curl -sS https://billing.origincloudapis.eu/v1beta1/organizations/<org-id>/billingAccounts/<billing-account-id> \
     -H "$(origin id token --as-header --raw)"
   ```

   If `paymentMethod.state` is `VERIFIED` or `NOT_REQUIRED`, you're done.

2. Start the setup on that billing account:

   ```sh
   curl -sS -X POST \
     https://billing.origincloudapis.eu/v1beta1/organizations/<org-id>/billingAccounts/<billing-account-id>:startPaymentMethodSetup \
     -H "$(origin id token --as-header --raw)" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

   The response contains a `redirectUri`.

3. Open the `redirectUri` in your browser and enter the card details. When you finish, the page returns you to the Origin Cloud console.

4. Confirm the setup:

   ```sh
   curl -sS -X POST \
     https://billing.origincloudapis.eu/v1beta1/organizations/<org-id>/billingAccounts/<billing-account-id>:confirmPaymentMethodSetup \
     -H "$(origin id token --as-header --raw)" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

   The platform checks the result with the payment provider. Returning to the console alone proves nothing. The response is the billing account.

5. Verify that `paymentMethod.state` is `VERIFIED`. The response also shows the card brand and its last four digits.

   Example output (illustrative, other fields left out):

   ```json
   {
     "name": "organizations/<org-id>/billingAccounts/<billing-account-id>",
     "paymentMethod": {
       "state": "VERIFIED",
       "cardBrand": "visa",
       "cardLast4": "4242"
     }
   }
   ```

Every project charged to this billing account can now create billable resources. Send any request that was refused with `PAYMENT_METHOD_REQUIRED` again, unchanged.

## If the confirmation fails

Both calls fail with [`BAD_REQUEST`](../reference/errors.md#bad_request) in these cases, naming the billing account:

- **The checkout wasn't completed.** You left the hosted page before finishing, or the card was declined. Finish the hosted page, or start again from step 2.
- **No setup is in progress.** Nothing was started, or the setup was already confirmed. Read the billing account: if `paymentMethod.state` is `VERIFIED`, you're done.
- **The account needs no payment method.** Its state is `NOT_REQUIRED`.

Starting again always works and replaces any unfinished setup.

## Replace the payment method

Run the same steps on a billing account that is already `VERIFIED`. The new card replaces the old one when you confirm it. Until then, the old card stays in place.

## Related

- [Billing](index.md)
- [Billing access](billing-access.md)
- [`PAYMENT_METHOD_REQUIRED`](../reference/errors.md#payment_method_required)
