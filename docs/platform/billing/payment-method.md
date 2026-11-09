---
id: billing-payment-method
title: Add a payment method
description: Add a card to a billing account on the payment provider's hosted page, confirm it, and check paymentMethodStatus so the account's projects can create billable resources.
page_type: task
parent: billing
nav_order: 10
tags: [billing, api]
last_reviewed: 2026-11-03
---

# Add a payment method

A project can create billable resources only once its billing account has a verified payment method. You enter the card on the payment provider's hosted page; card details never pass through Origin Cloud.

## Before you begin

- The organization ID and the ID of the project you want to unblock.
- The `roles/billing/administrator` or `roles/billing/user` role on the organization. Whoever created the organization has the first one. The Owner role alone isn't enough. See [Billing access](billing-access.md). To look up which billing account a project is charged to, you also need read access to the project, such as `roles/viewer`.
- A way to call the GraphQL API, for example `curl` with your CLI token. See [Use the GraphQL API](../access/api.md).

## When a payment method is needed

A billing account's `paymentMethodStatus` is one of three values:

| `paymentMethodStatus` | Meaning |
|---|---|
| `NONE` | No verified payment method. Billable resources are refused. |
| `VERIFIED` | A payment method is on file and verified. |
| `NOT_REQUIRED` | Billing is arranged with Origin Cloud directly, and no payment method is needed. |

While the status is `NONE`, these operations in the account's projects are refused with [`PAYMENT_METHOD_REQUIRED`](../reference/errors.md#payment_method_required):

- Launch an instance
- Create, import or grow a volume
- Create a snapshot
- Allocate a Floating IP
- Create a NAT gateway

Creating VPCs, subnets, security groups and other network configuration doesn't need a payment method, so you can set up your network first. The organization must also be `ACTIVE` for the operations above. See [Organization review status](../organizations/review-status.md).

## Add the payment method

The steps send GraphQL requests with `curl`. Each request uses this pattern, with the request body on standard input:

```sh
curl -sS https://graph.origincloudapis.eu/graphql \
  -H "$(origin id token --as-header --raw)" \
  -H "Content-Type: application/json" \
  --data @- <<'EOF'
<request-body>
EOF
```

1. Find the billing account the project is charged to, and its current status:

   ```json
   {
     "query": "query($org: OrgId!, $p: ProjectId!) { admin { project(orgId: $org, projectId: $p) { billingAccountId } billingAccounts(input: {orgId: $org}) { billingAccountId displayName paymentMethodStatus } } }",
     "variables": { "org": "<org-id>", "p": "<project-id>" }
   }
   ```

   If the project's billing account is `VERIFIED` or `NOT_REQUIRED`, you're done.

2. Start the setup on that billing account:

   ```json
   {
     "query": "mutation($org: OrgId!, $ba: BillingAccountId!) { admin { startPaymentMethodSetup(input: {orgId: $org, id: $ba}) { redirectUrl } } }",
     "variables": { "org": "<org-id>", "ba": "<billing-account-id>" }
   }
   ```

   The response contains a `redirectUrl`.

3. Open the `redirectUrl` in your browser and enter the card details. When you finish, the page returns you to the Origin Cloud console.

4. Confirm the setup:

   ```json
   {
     "query": "mutation($org: OrgId!, $ba: BillingAccountId!) { admin { confirmPaymentMethodSetup(input: {orgId: $org, id: $ba}) { paymentMethodStatus paymentMethodBrand paymentMethodLast4 } } }",
     "variables": { "org": "<org-id>", "ba": "<billing-account-id>" }
   }
   ```

   The platform checks the result with the payment provider. Returning to the console alone proves nothing.

5. Verify that `paymentMethodStatus` is `VERIFIED`. The response also shows the card brand and its last four digits.

   Example output (illustrative):

   ```json
   {
     "data": {
       "admin": {
         "confirmPaymentMethodSetup": {
           "paymentMethodStatus": "VERIFIED",
           "paymentMethodBrand": "visa",
           "paymentMethodLast4": "4242"
         }
       }
     }
   }
   ```

Every project charged to this billing account can now create billable resources. Send any request that was refused with `PAYMENT_METHOD_REQUIRED` again, unchanged.

## If the confirmation fails

Both mutations fail with [`BAD_REQUEST`](../reference/errors.md#bad_request) naming `billing_account_id` in these cases:

- **The checkout wasn't completed.** You left the hosted page before finishing, or the card was declined. Finish the hosted page, or start again from step 2.
- **No setup is in progress.** Nothing was started, or the setup was already confirmed. Check `paymentMethodStatus`: if it's `VERIFIED`, you're done.
- **The account needs no payment method.** Its status is `NOT_REQUIRED`.

Starting again always works and replaces any unfinished setup.

## Replace the payment method

Run the same steps on a billing account that is already `VERIFIED`. The new card replaces the old one when you confirm it. Until then, the old card stays in place.

## Related

- [Billing](index.md)
- [Billing access](billing-access.md)
- [`PAYMENT_METHOD_REQUIRED`](../reference/errors.md#payment_method_required)
