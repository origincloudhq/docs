---
id: read-price-list
title: Read the price list
description: Fetch the public price list with curl, revalidate it with a conditional request, and turn a price into an hourly or monthly cost.
page_type: task
parent: home
nav_order: 20
tags: [pricing, api]
last_reviewed: 2026-10-28
---

# Read the price list

Fetch the current list prices to estimate what a resource costs, or to show prices on your own site. The price list is public, so you need no account or access token.

## Before you begin

- `curl` to send the requests.
- Optional: `jq` to filter the JSON response.

## Fetch the price list

1. Request the price list and include the response headers:

   ```sh
   curl -si https://billing.origincloudapis.eu/v1/pricing
   ```

   The example shows one family only.

   Example output (illustrative):

   ```text
   HTTP/2 200
   content-type: application/json
   etag: W/"3f9a1c2b7d4e5f60"
   cache-control: public, max-age=300
   access-control-allow-origin: *
   last-modified: Thu, 10 Sep 2026 08:00:00 GMT

   {"currency":"EUR","amounts_exclude_vat":true,"last_changed":"2026-09-10T08:00:00Z","families":[{"family":"compute_instance","prices":[{"product_key":"compute.gp1.core.2","dimensions":{"instance_type":"gp1.core.2"},"unit_type":"seconds","unit_count":3600,"amount":"0.0250","valid_from":"2026-09-01T00:00:00Z"}]}]}
   ```

2. Note the `etag` value. You use it in the next section to check for changes without downloading the list again.

3. Optional: list the prices of one family. This command prints each instance type with its price:

   ```sh
   curl -s https://billing.origincloudapis.eu/v1/pricing \
     | jq -r '.families[]
       | select(.family == "compute_instance")
       | .prices[]
       | "\(.product_key) \(.amount) EUR per \(.unit_count) \(.unit_type)"'
   ```

   Example output (illustrative):

   ```text
   compute.gp1.core.2 0.0250 EUR per 3600 seconds
   compute.gp1.core.4 0.0500 EUR per 3600 seconds
   ```

If a family you expect is missing, it has no current price. For every field in the response, see [Price list API](reference/price-list-api.md).

## Check for changes with a conditional request

1. Send the `etag` value from your last response in an `If-None-Match` header:

   ```sh
   curl -si https://billing.origincloudapis.eu/v1/pricing \
     -H 'If-None-Match: W/"3f9a1c2b7d4e5f60"'
   ```

2. Check the status code. `304 Not Modified` with no body means the price list hasn't changed, and you keep using your copy. `200` returns the new list with a new `etag`.

   Example output (illustrative):

   ```text
   HTTP/2 304
   etag: W/"3f9a1c2b7d4e5f60"
   cache-control: public, max-age=300
   access-control-allow-origin: *
   last-modified: Thu, 10 Sep 2026 08:00:00 GMT
   ```

You can reuse a fetched list for 5 minutes without asking again, as `cache-control: public, max-age=300` allows. A price change can take a few minutes to appear.

## Calculate a cost from a price

Every price is `amount` euro per `unit_count` of `unit_type`, without VAT. Divide `amount` by `unit_count` to get the price of one unit, then multiply by the units you use.

1. Calculate an hourly rate for a price in `seconds`. For `compute.gp1.core.2` with `amount` `"0.0250"` and `unit_count` `3600`:

   ```text
   0.0250 / 3600 * 3600 seconds = 0.0250 EUR per hour
   ```

2. Calculate a monthly estimate by multiplying the hourly rate by the hours in the month. For 730 hours:

   ```text
   0.0250 EUR per hour * 730 hours = 18.25 EUR
   ```

3. Calculate a storage cost for a price in `gib_hours` by multiplying the size by the hours. For `storage.gp1` with `amount` `"0.08"` and `unit_count` `730`, a 100 GiB volume kept for 730 hours costs:

   ```text
   0.08 / 730 * (100 GiB * 730 hours) = 8.00 EUR
   ```

4. Verify the result against your usage and cost reports, which use the same product keys.

> **Tip:** Read `amount` as a decimal string, not a floating-point number, to avoid rounding errors in your calculation.

## Related

- [Price list API](reference/price-list-api.md) – every field, family, header, and status code.
- [Billing](../platform/billing/index.md) – how your organization is invoiced.
