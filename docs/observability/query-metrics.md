---
id: query-metrics
title: Query metrics
description: Query the CPU, network, or volume metrics of one resource over a time window with the REST API, and choose the period and statistic.
page_type: task
parent: home
nav_order: 20
tags: [observability, metrics, api]
last_reviewed: 2026-11-25
---

# Query metrics

Get a series of data points for one compute instance, volume, or network interface, with the REST API's `QueryTimeSeries` method. You choose the metrics, the time window, the length of each period, and whether each data point is a per-second rate or a total increase. The limits are in the [Metrics reference](reference/metrics.md#limits).

## Before you begin

- The `origin` CLI, logged in, with a default project: the project that holds the resource you want metrics for. See [Use the CLI](../platform/access/cli.md#set-a-default-project-zone-and-region).
- Permission `observability.metric.get` on the resource. The built-in Owner and Viewer roles include it. See [Roles](../iam/roles.md).
- An access token for the API. The examples get one from the `origin` CLI with `origin id token`. See [Use the REST APIs](../platform/access/api.md).

## Choose the window and the period

The query returns one data point per period, starting at the start of the window, so the number of data points per metric is the window's length divided by the period, plus one.

- Use a period of at least 60 seconds. The platform collects a value every 30 seconds, and each data point needs two collected values inside its period; a shorter period often returns no data points.
- Keep the total number of data points, across all metrics in the query, at or below 11,000. For example, one metric over 7 days at a 300-second period is 2,017 data points.
- Start the window at a multiple of the period (for example, a full hour) so data points line up with clock times.

Pick the metric names for the resource's type: an instance has `oc_compute_instance_cpu_seconds_total`; a volume has four metrics and a network interface two. See [Metrics reference](reference/metrics.md).

## Query metrics with the REST API

1. Find the full name of the resource: its service's host followed by its `name` field, such as `//compute.origincloudapis.eu/projects/<project-id>/zones/eu-central1-az1/instances/<instance-id>`. An instance is on `//compute.origincloudapis.eu/`, a volume on `//pvs.origincloudapis.eu/` and a network interface on `//network.origincloudapis.eu/`. Each command lists the project's resources of one kind, in every zone, with their `name`:

   ```sh
   origin compute list-instances
   origin pvs list-volumes
   origin network list-network-interfaces
   ```

2. Send a `GET` request to the `timeSeries:query` method of the project that holds the resource. This example asks for the CPU use of an instance as a per-second rate, in 5-minute periods, over 15 minutes:

   ```sh
   curl -sS -G \
     "https://observability.origincloudapis.eu/v1beta1/projects/<project-id>/timeSeries:query" \
     -H "$(origin id token --as-header --raw)" \
     --data-urlencode "resource=//compute.origincloudapis.eu/projects/<project-id>/zones/eu-central1-az1/instances/<instance-id>" \
     --data-urlencode "metrics=oc_compute_instance_cpu_seconds_total" \
     --data-urlencode "startTime=2026-10-03T10:00:00Z" \
     --data-urlencode "endTime=2026-10-03T10:15:00Z" \
     --data-urlencode "period=300s" \
     --data-urlencode "statistic=RATE"
   ```

   To ask for several metrics, repeat `metrics`.

3. Check the response. It contains one series per metric, in the order you asked for them. Each point's `endTime` is the end of the period it covers.

   Example output (illustrative):

   ```json
   {
     "timeSeries": [
       {
         "metric": "oc_compute_instance_cpu_seconds_total",
         "resource": "//compute.origincloudapis.eu/projects/<project-id>/zones/eu-central1-az1/instances/<instance-id>",
         "unit": "seconds",
         "points": [
           { "endTime": "2026-10-03T10:00:00Z", "value": 0.12 },
           { "endTime": "2026-10-03T10:05:00Z", "value": 0.48 },
           { "endTime": "2026-10-03T10:10:00Z", "value": 1.73 },
           { "endTime": "2026-10-03T10:15:00Z", "value": 0.51 }
         ]
       }
     ]
   }
   ```

If the request fails, look up its HTTP status and `error.status` in [REST errors](reference/metrics.md#rest-errors). Every field is described in [REST request fields](reference/metrics.md#rest-request-fields).

## Empty series and billing

A series with no data points means the platform has no values for that resource and metric in the window. Common reasons are an instance that was stopped, a volume or network interface that wasn't attached to a running instance, a metric name that belongs to another resource type, or a window older than the 90 days the platform keeps metrics.

> **Note:** Each successful query is billed as one request, however many metrics or data points it returns. A rejected query isn't billed. See [observability_api_request](../pricing/reference/price-list-api.md#observability_api_request).

## Related

- [Metrics reference](reference/metrics.md) – every metric, field, limit, and error.
- [What is Origin Cloud Observability?](index.md) – how counters, `RATE`, and `INCREASE` work.
- [Use the REST APIs](../platform/access/api.md) – authenticating against the API.
