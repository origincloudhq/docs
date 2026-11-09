---
id: reference-price-list-api
title: Price list API
description: Reference for GET /v1/pricing, the public price list endpoint, with every response field, product family, header, and status code.
page_type: reference
parent: reference
nav_order: 10
tags: [reference, pricing, api]
last_reviewed: 2026-11-07
---

# Price list API

The price list endpoint returns the current list price of every billable product as JSON. It needs no authentication. For a walkthrough, see [Read the price list](../read-price-list.md).

## Request

```text
GET https://billing.origincloudapis.eu/v1/pricing
```

The endpoint takes no parameters. Optional request header:

| Header | Description |
|---|---|
| `If-None-Match` | An `ETag` from an earlier response. If the price list is unchanged, the response is `304 Not Modified` without a body. A strong form of the same tag, or `*`, also matches. |

## Response body

Example response (illustrative):

```json
{
  "currency": "EUR",
  "amounts_exclude_vat": true,
  "last_changed": "2026-09-10T08:00:00Z",
  "families": [
    {
      "family": "compute_instance",
      "prices": [
        {
          "product_key": "compute.gp1.core.2",
          "dimensions": { "instance_type": "gp1.core.2" },
          "unit_type": "seconds",
          "unit_count": 3600,
          "amount": "0.0250",
          "valid_from": "2026-09-01T00:00:00Z"
        }
      ]
    },
    {
      "family": "storage_snapshot",
      "prices": [
        {
          "product_key": "storage.snapshot",
          "unit_type": "gib_hours",
          "unit_count": 730,
          "amount": "0.05",
          "valid_from": "2026-09-01T00:00:00Z"
        }
      ]
    }
  ]
}
```

Top-level fields:

| Field | Type | Description |
|---|---|---|
| `currency` | string | Always `EUR`. |
| `amounts_exclude_vat` | boolean | Always `true`. Every amount is net. VAT depends on your billing country and is added on the invoice. |
| `last_changed` | string | RFC 3339 timestamp, in UTC, of the most recent time a list price was set, changed, took effect, or ended. Use it for a "prices last updated" line. Absent only if nothing has ever been priced. |
| `families` | array | One entry per product family with at least one current price, in the order of [Product families](#product-families). A family without a current price is left out, and the field is absent when nothing is priced. |

Fields of each entry in `families`:

| Field | Type | Description |
|---|---|---|
| `family` | string | The family identifier, for example `compute_instance`. |
| `prices` | array | The current prices of the family, ordered by product key, with numbers compared as numbers. Instance types of one class run from smallest to largest. |

Fields of each entry in `prices`:

| Field | Type | Description |
|---|---|---|
| `product_key` | string | What the price bills, for example `compute.gp1.core.2`. Usage and cost reports use the same key. |
| `dimensions` | object | The parts of the product key, already split out: `instance_type` for `compute_instance`, `storage_class` for `storage_volume`. The field is absent when the family has no dimensions. |
| `unit_type` | string | The unit the price is per: `seconds`, `gib_hours`, `gb`, `metric_months`, `requests`, `samples`, or `queries`. |
| `unit_count` | integer | How many units `amount` is for. `3600` `seconds` is an hourly rate; `730` `gib_hours` is a rate per GiB for 730 hours. |
| `amount` | string | The price in euro for `unit_count` units, as a decimal string so no rounding is introduced. |
| `valid_from` | string | RFC 3339 timestamp, in UTC, from which the price applies. |
| `valid_until` | string | RFC 3339 timestamp, in UTC, at which the price is scheduled to end. Absent while no end is scheduled. |

The list contains only prices in effect at the time of the request. A future price appears once it takes effect. Prices agreed for a single organization never appear.

A priced product isn't necessarily available to order. Selecting a product that is priced but not on sale fails with [`PRODUCT_UNAVAILABLE`](../../platform/reference/errors.md#product_unavailable).

## Product families

The families appear in the following order. Traffic in `gb` is counted in decimal gigabytes (10^9 bytes).

| Family | Product key | Dimensions | Unit type |
|---|---|---|---|
| `compute_instance` | `compute.<instance_type>` | `instance_type` | `seconds` |
| `network_floating_ip` | `network.floating_ip` | – | `seconds` |
| `network_nat_gateway` | `network.nat_gateway` | – | `seconds` |
| `network_vpc_egress` | `network.vpc_egress` | – | `gb` |
| `network_vpc_ingress` | `network.vpc_ingress` | – | `gb` |
| `network_vpc_internal` | `network.vpc_internal` | – | `gb` |
| `storage_volume` | `storage.<storage_class>` | `storage_class` | `gib_hours` |
| `storage_snapshot` | `storage.snapshot` | – | `gib_hours` |
| `observability_custom_metric` | `observability.custom_metric` | – | `metric_months` |
| `observability_api_request` | `observability.api_request` | – | `requests` |
| `observability_ingested_sample` | `observability.ingested_sample` | – | `samples` |
| `dns_hosted_zone` | `dns.hosted_zone` | – | `seconds` |
| `dns_query` | `dns.query` | – | `queries` |

### compute_instance

The time an instance runs, priced per instance type. The product key is `compute.` followed by the instance type, for example `compute.gp1.core.2`. See [Instance types](../../compute/instances/instance-types.md).

### network_floating_ip

The time a Floating IP is allocated to your project. See [Floating IPs](../../network/internet-access/floating-ips.md).

### network_nat_gateway

The time a NAT gateway exists. The Floating IP that the gateway holds is billed separately under `network_floating_ip`. See [NAT gateways](../../network/internet-access/nat-gateways.md).

### network_vpc_egress

Traffic from a VPC to the internet, in decimal gigabytes.

### network_vpc_ingress

Traffic from the internet into a VPC, in decimal gigabytes.

### network_vpc_internal

Traffic routed between two subnets of the same VPC, in decimal gigabytes.

### storage_volume

The provisioned size of a volume for the time it exists, priced per storage class. The product key is `storage.` followed by the storage class: `storage.gp1`, `storage.st1`, or `storage.io1`. See [Storage classes](../../storage/volumes/storage-classes.md).

### storage_snapshot

The size of a snapshot's source volume for the time the snapshot exists. See [Snapshots](../../storage/snapshots/index.md).

### observability_custom_metric

A metric you submit yourself, for each month it's kept. Submitting your own metrics isn't supported, so nothing is billed under this family.

### observability_api_request

Each successful `observability.metrics` query, however many metrics or data points it returns. See [Query metrics](../../observability/query-metrics.md).

### observability_ingested_sample

Each value the platform collects for your instances, volumes, and network interfaces: one per metric and resource every 30 seconds while the instance runs. See [Metrics reference](../../observability/reference/metrics.md).

### dns_hosted_zone

The time a hosted zone exists, public or private, from its creation until it's deleted. A public zone pending verification or suspended counts too. See [DNS](../../dns/index.md#pricing).

### dns_query

The rate per query to a public zone, which applies once Origin's public name servers answer for public zones. Queries answered inside a VPC for a private zone aren't billed. See [DNS](../../dns/index.md#pricing).

## Response headers

| Header | Value |
|---|---|
| `ETag` | A weak tag for the response body, for example `W/"3f9a1c2b7d4e5f60"`. It changes whenever the body changes. |
| `Cache-Control` | `public, max-age=300`. A client or cache may reuse a fetched list for 5 minutes. A price change can take a few minutes to appear. |
| `Access-Control-Allow-Origin` | `*`. A web page on any origin can fetch the list from the browser. |
| `Last-Modified` | The time in `last_changed`, as an HTTP date. Absent when `last_changed` is `null`. |
| `Content-Type` | `application/json`, on `200` responses. |

In a browser, let the browser's HTTP cache revalidate the list. The `ETag` header isn't exposed to page scripts, and a script that sets `If-None-Match` itself triggers a CORS preflight request, which the endpoint doesn't support.

## Status codes

| Status | Meaning | What to do |
|---|---|---|
| `200 OK` | The body is the current price list. | – |
| `304 Not Modified` | The `If-None-Match` tag matches the current list. No body. | Keep using your copy. |
| `429 Too Many Requests` | Too many requests from your client address. The limit is per client address. | Wait and retry. A client that honors `Cache-Control` doesn't reach the limit. |
| `503 Service Unavailable` | The price list is temporarily unavailable. The response carries `Retry-After: 30` and the REST API's error body, with the status `UNAVAILABLE`; see [Errors](../../platform/reference/errors.md). | Retry after the number of seconds in `Retry-After`. |
