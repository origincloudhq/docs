---
id: billing-rest-api
title: Billing REST API
nav_title: REST API
description: The billing REST API's methods for billing accounts, project billing, payment methods, spend limits, cost reports and legal documents, with the permission each needs.
page_type: reference
parent: billing
nav_order: 30
tags: [billing, api, reference]
last_reviewed: 2026-11-15
---

# Billing REST API

The billing REST API answers at `https://billing.origincloudapis.eu`, the host the [price list](../../pricing/index.md) is on. It's a preview (`v1beta1`): names and fields may still change. Every request carries an access token, as for the GraphQL API, except the price list's and the legal documents'; see [Use the GraphQL API](../access/api.md#authenticate).

- A change's response carries an `Origin-Consistency-Token` header. Send it back with your next reads and they show the change; see [Read what you just changed](../access/api.md#read-what-you-just-changed).
- `CreateBillingAccount` takes an optional `requestId`, a UUID. A retry with the same `requestId` within 24 hours returns the account the first request created instead of creating another. The same `requestId` with a different request is refused with `CONFLICT`.
- A billing account is named `organizations/<org-id>/billingAccounts/<billing-account-id>`.
- A spend limit is named `organizations/<org-id>/billingAccounts/<billing-account-id>/spendLimit`. It exists for every billing account; one with no `limit` set is no spend limit.
- A request's path takes these names as they are. A reference in a request or a response is a full name, the host and the name: a project's billing account is `//billing.origincloudapis.eu/organizations/<org-id>/billingAccounts/<billing-account-id>`, a legal document version `//billing.origincloudapis.eu/legalDocuments/<document>/versions/<version>`, and a project in a cost report `//resourcemanager.origincloudapis.eu/projects/<project-id>`. A reference without the host is refused with `INVALID_ARGUMENT`.
- Who created a billing account (`creator`) and who accepted a legal document version (`accepter`) is the principal's full name on iam, such as `//iam.origincloudapis.eu/users/<user-id>` or `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>`.
- Cost reports take a period, `startTime` included and `endTime` left out, as RFC 3339 times, and `granularity` `HOURLY` or `DAILY` (the default). Every amount is a decimal string in EUR, before VAT.

Billing accounts need the billing permissions, which the Owner role doesn't include; see [Billing access](billing-access.md). Spend limits and usage need permissions the Owner role has.

| Method | HTTP | Does |
|---|---|---|
| `ListBillingAccounts`, `GetBillingAccount` | `GET /v1beta1/organizations/<org-id>/billingAccounts`, `GET /v1beta1/organizations/<org-id>/billingAccounts/<id>` | The organization's billing accounts, oldest first, with their billing details and `paymentMethod`. Needs `admin.billing_account.list` or `admin.billing_account.get`. |
| `CreateBillingAccount` | `POST /v1beta1/organizations/<org-id>/billingAccounts` | Creates a billing account. `displayName`, `billingAddress`, `invoiceEmail` and `contactPerson` are required, and `vatId` too for an address outside Germany. Once a legal document version is in force, `acceptedLegalDocuments` must name every version in force with its `sha256`, and `actsAsBusiness` must be `true`; see [Legal documents and acceptance](legal-documents.md). Needs `admin.billing_account.create`. |
| `UpdateBillingAccount` | `PATCH /v1beta1/organizations/<org-id>/billingAccounts/<id>?updateMask=<fields>` | Changes `displayName` or billing details. Only the fields in `updateMask` change; the account must still have complete billing details afterwards. Needs `admin.billing_account.update`. |
| `DeleteBillingAccount` | `DELETE /v1beta1/organizations/<org-id>/billingAccounts/<id>` | Deletes a billing account. Refused with `CONFLICT` for the default account, while a project is charged to it, and while it has a spend limit. Needs `admin.billing_account.delete`. |
| `StartPaymentMethodSetup` | `POST /v1beta1/organizations/<org-id>/billingAccounts/<id>:startPaymentMethodSetup` | Returns a `redirectUri`, the payment provider's page to open in a browser. Needs `admin.billing_account.update`. |
| `ConfirmPaymentMethodSetup` | `POST /v1beta1/organizations/<org-id>/billingAccounts/<id>:confirmPaymentMethodSetup` | Records the card entered on that page, once the payment provider confirms it, and returns the billing account. Needs `admin.billing_account.update`. |
| `GetProjectBillingInfo` | `GET /v1beta1/projects/<project-id>/billingInfo` | The billing account a project is charged to. Needs `admin.project.get`. |
| `UpdateProjectBillingInfo` | `PATCH /v1beta1/projects/<project-id>/billingInfo?updateMask=billingAccount` | Charges a project to another billing account of its organization. Needs `admin.project.attach`. |
| `ListProjectBillingInfo` | `GET /v1beta1/organizations/<org-id>/billingAccounts/<id>/projects` | The projects charged to a billing account. Needs `admin.billing_account.get`. |
| `GetSpendLimit` | `GET /v1beta1/organizations/<org-id>/billingAccounts/<id>/spendLimit` | The billing account's monthly `limit`, `alertThresholdsPercent` and `notificationEmails`. Needs `admin.spend_limit.get`. |
| `UpdateSpendLimit` | `PATCH /v1beta1/organizations/<org-id>/billingAccounts/<id>/spendLimit?updateMask=<fields>` | Sets the fields in `updateMask`. Leaving `limit` unset removes the spend limit with its thresholds and recipients. Needs `admin.spend_limit.update`. |
| `QueryProjectCost` | `GET /v1beta1/projects/<project-id>:queryCost?startTime=<time>&endTime=<time>` | A project's cost by service and product. Needs `admin.usage.list`. |
| `QueryOrganizationCost` | `GET /v1beta1/organizations/<org-id>:queryCost?startTime=<time>&endTime=<time>` | Every project's cost together, by service and product, and each project's total. Needs `admin.usage.list`. |
| `QueryBillingAccountCost` | `GET /v1beta1/organizations/<org-id>/billingAccounts/<id>:queryCost?startTime=<time>&endTime=<time>` | What was charged to the billing account. The calendar month's total is what its spend limit compares with `limit`. Needs `admin.spend_limit.get`. |
| `QueryProjectUsage` | `GET /v1beta1/projects/<project-id>:queryUsage?startTime=<time>&endTime=<time>` | The project's metered usage records that overlap the period. Needs `admin.usage.list`. |
| `GetPriceList` | `GET /v1/pricing` | The public price list. Needs no access token, and keeps its own field names and path; see [Price list API](../../pricing/reference/price-list-api.md). |
| `ListBillingCountries`, `GetBillingCountry` | `GET /v1beta1/billingCountries`, `GET /v1beta1/billingCountries/<code>` | The countries a billing address may be in, and which need a VAT identification number. Needs no permission. |
| `ListLegalDocuments`, `GetLegalDocument` | `GET /v1beta1/legalDocuments`, `GET /v1beta1/legalDocuments/<document>` | The published legal documents (`terms`, `dpa`, `sla`, `aup`, `subprocessors`, `toms`, `privacy`, `switching`, `shared-responsibility`), each with the version in force today (`currentVersion`) and the latest one published (`latestVersion`), and whether customers accept it (`acceptanceRequired`). Needs no access token. |
| `ListLegalDocumentVersions`, `GetLegalDocumentVersion` | `GET /v1beta1/legalDocuments/<document>/versions`, `GET /v1beta1/legalDocuments/<document>/versions/<version>` | A document's published versions, the latest first: `effectiveDate`, `changeClass` (`MATERIAL`, `NOTICE` or `EDITORIAL`), `changeSummary`, the text as `markdown` and `html`, its `sha256`, and its fixed web address `uri`. A published version never changes. Needs no access token. |
| `QueryLegalRequirements` | `GET /v1beta1/organizations/<org-id>/billingAccounts/<id>:queryLegalRequirements` | The legal document versions the billing account has yet to accept, each with its `sha256` and `changeSummary`. A requirement is `blocking` once the version is in force: until the account accepts it, creating or growing billable resources charged to it is refused; running resources are never affected. Needs `admin.billing_account.get`. |
| `AcceptLegalDocuments` | `POST /v1beta1/organizations/<org-id>/billingAccounts/<id>:acceptLegalDocuments` | Accepts versions for the billing account, all or none: each `versions` entry names a `legalDocumentVersion` and the `sha256` of the text you showed, which must be the version in force or one announced to take effect later; `actsAsBusiness` must be `true`. Accepting a version again returns the first acceptance. Needs `admin.billing_account.update`. |
| `ListLegalAcceptances`, `GetLegalAcceptance` | `GET /v1beta1/organizations/<org-id>/billingAccounts/<id>/legalAcceptances`, `GET .../legalAcceptances/<id>` | The billing account's acceptances, the latest first: the version and its `sha256`, who accepted (`accepter`) and when, `method` (`SIGNUP`, `CHANGE` or `MIGRATION`), and the legal entity as it was then (organization name, billing address, VAT ID). An acceptance never changes, and is kept after the billing account and the organization are deleted. Needs `admin.billing_account.get`. |
| `DownloadLegalDocumentVersion` | `GET /v1beta1/legalDocuments/<document>/versions/<version>:download` | The version as a PDF, the file itself rather than JSON; the version's `pdfUri`. Needs no access token. |

A billing account's `paymentMethod.state` is `MISSING`, `VERIFIED` or `NOT_REQUIRED`, the REST names of the GraphQL API's `NONE`, `VERIFIED` and `NOT_REQUIRED`; see [Add a payment method](payment-method.md#when-a-payment-method-is-needed). In the REST API a billing address names its country as `regionCode`.

A repeated `ConfirmPaymentMethodSetup` after one that succeeded is refused with `INVALID_ARGUMENT`, because no setup is in progress any more. Read the billing account to see whether it's `VERIFIED`.

## Related

- [Billing](index.md)
- [Add a payment method](payment-method.md)
- [Errors](../reference/errors.md)
