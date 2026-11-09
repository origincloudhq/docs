---
id: reference-metrics
title: Metrics reference
nav_title: Metrics
description: Every metric Observability provides, with resource type, unit, and meaning, plus the REST and GraphQL query fields, limits, and errors.
page_type: reference
parent: reference
nav_order: 20
tags: [reference, observability, metrics, api, errors]
last_reviewed: 2026-11-03
---

# Metrics reference

The platform provides the seven metrics below, listed by resource type. Every metric is a counter that the platform reads every 30 seconds while the instance runs. To query them, see [Query metrics](../query-metrics.md); for how counters and statistics work, see [What is Origin Cloud Observability?](../index.md).

All counters start again from zero when an instance is stopped and started. `RATE` and `INCREASE` account for such a restart, so a data point never turns negative. `INCREASE` is extrapolated to the full period, so it can be a fractional number even for a byte counter.

## oc_compute_instance_cpu_seconds_total

**Resource type**  
Compute instance

**Unit**  
`seconds`

**Counts**  
The total CPU time the instance has consumed, summed over all its vCPUs.

**RATE**  
The average number of busy vCPUs during the period, in CPU seconds per second. `1.0` means one vCPU fully busy; the maximum is the instance type's vCPU count.

**INCREASE**  
The CPU seconds the instance consumed during the period.

## oc_network_interface_receive_bytes_total

**Resource type**  
Network interface

**Unit**  
`bytes`

**Counts**  
The total bytes the instance has received on the network interface.

**RATE**  
The average inbound throughput during the period, in bytes per second. Multiply by 8 for bits per second.

**INCREASE**  
The bytes received during the period.

## oc_network_interface_transmit_bytes_total

**Resource type**  
Network interface

**Unit**  
`bytes`

**Counts**  
The total bytes the instance has sent on the network interface.

**RATE**  
The average outbound throughput during the period, in bytes per second. Multiply by 8 for bits per second.

**INCREASE**  
The bytes sent during the period.

## oc_volume_read_bytes_total

**Resource type**  
Volume

**Unit**  
`bytes`

**Counts**  
The total bytes the instance has read from the volume while attached.

**RATE**  
The average read throughput during the period, in bytes per second.

**INCREASE**  
The bytes read during the period.

## oc_volume_write_bytes_total

**Resource type**  
Volume

**Unit**  
`bytes`

**Counts**  
The total bytes the instance has written to the volume while attached.

**RATE**  
The average write throughput during the period, in bytes per second.

**INCREASE**  
The bytes written during the period.

## oc_volume_read_ops_total

**Resource type**  
Volume

**Unit**  
`operations`

**Counts**  
The total read operations the instance has completed on the volume while attached. An operation can be any size; the guest operating system may merge or split reads before they reach the volume.

**RATE**  
The average read operations per second (read IOPS) during the period. Divide the `RATE` of `oc_volume_read_bytes_total` by this value for the average read size.

**INCREASE**  
The read operations completed during the period.

## oc_volume_write_ops_total

**Resource type**  
Volume

**Unit**  
`operations`

**Counts**  
The total write operations the instance has completed on the volume while attached. An operation can be any size; the guest operating system may merge or split writes before they reach the volume.

**RATE**  
The average write operations per second (write IOPS) during the period. Divide the `RATE` of `oc_volume_write_bytes_total` by this value for the average write size.

**INCREASE**  
The write operations completed during the period.

## REST request fields

`QueryTimeSeries` is `GET https://observability.origincloudapis.eu/v1beta1/projects/<project-id>/timeSeries:query`, with its fields as query parameters. The OpenAPI document of the API describes the same fields.

| Field | Type | Required | Description |
|---|---|---|---|
| `resource` | string | yes | Resource name of one compute instance (`projects/<project-id>/zones/<zone>/instances/<instance-id>`), volume (`.../volumes/<volume-id>`), or network interface (`.../networkInterfaces/<network-interface-id>`), in the project of the path. |
| `metrics` | string, repeated | yes | One or more metric names from this page. Each name returns one series, in the order given. Repeat the parameter for several. |
| `startTime` | RFC 3339 timestamp | yes | Start of the time window. The first data point is at `startTime`. Fractions of a second are ignored. |
| `endTime` | RFC 3339 timestamp | yes | End of the time window. Must not be earlier than `startTime`. |
| `period` | duration, such as `300s` | yes | Length of each period and spacing of the data points, in whole seconds, at least `1s`. Use at least `60s`, because each data point needs two values collected 30 seconds apart. |
| `statistic` | `RATE` or `INCREASE` | yes | `RATE` (average per-second increase over the period) or `INCREASE` (total increase over the period). |

## REST response fields

The response holds `timeSeries`, one series per requested metric.

| Field | Type | Description |
|---|---|---|
| `timeSeries.metric` | string | The metric name, as requested. |
| `timeSeries.resource` | string | The resource name, as requested. |
| `timeSeries.unit` | string | Unit of the underlying counter: `seconds`, `bytes`, or `operations`. A `RATE` value is this unit per second. |
| `timeSeries.points` | list | The data points in time order. Empty when the platform has no values for the window. |
| `timeSeries.points.endTime` | RFC 3339 timestamp | End of the period the data point covers. |
| `timeSeries.points.value` | number | The `RATE` or `INCREASE` for that period. |

## GraphQL query arguments

The `observability.metrics` query takes one `input` argument of type `MetricQueryInput`.

| Field | Type | Required | Description |
|---|---|---|---|
| `resourceUrn` | `Urn` | yes | URN of one compute instance, volume, or network interface. |
| `metricNames` | `[String!]` | yes | One or more metric names from this page. Each name returns one series, in the order given. |
| `from` | `DateTime` | yes | Start of the time window, as an RFC 3339 timestamp. The first data point is at `from`. |
| `to` | `DateTime` | yes | End of the time window, as an RFC 3339 timestamp. Must not be earlier than `from`. |
| `periodSeconds` | `Int` | yes | Length of each period and spacing of the data points, in seconds. Values below 1 count as 1. There's no maximum. Use at least 60, because each data point needs two values collected 30 seconds apart. |
| `statistic` | `MetricStatisticInput` | yes | `RATE` (average per-second increase over the period) or `INCREASE` (total increase over the period). |

A metric name that exists but belongs to another resource type returns a series without data points.

## GraphQL response fields

The query returns a list of `MetricSeries`, one per requested metric name.

| Field | Type | Description |
|---|---|---|
| `metricName` | `String` | The metric name, as requested. |
| `resourceUrn` | `Urn` | The resource the series belongs to. |
| `unit` | `String` | Unit of the underlying counter: `seconds`, `bytes`, or `operations`. A `RATE` value is this unit per second. |
| `dataPoints` | `[MetricDataPoint!]` | The data points in time order. Empty when the platform has no values for the window. |
| `dataPoints.timestamp` | `DateTime` | End of the period the data point covers. |
| `dataPoints.value` | `Float` | The `RATE` or `INCREASE` for that period. |

## Limits

| Limit | Value |
|---|---|
| Data points per query | 11,000, summed over all metrics in the query. Each metric contributes the window's length divided by the period, plus one: `(to - from) / periodSeconds + 1` in GraphQL. |
| Queries per minute | 60 per organization, the REST and GraphQL APIs together. Every admitted query counts. A GraphQL query that names an unknown metric is admitted and counts; the REST API refuses it before admission. |
| Concurrent queries | 4 per organization, the REST and GraphQL APIs together. |
| Query duration | 30 seconds. A query that runs longer is stopped and returns `SERVICE_UNAVAILABLE` (REST: `503 UNAVAILABLE`). |
| Data retention | 90 days. Older periods return no data points. |
| Collection interval | 30 seconds, while the instance runs. |

## REST errors

A REST error is a JSON body `{"error": {...}}` with the HTTP status, its `status` name, a `message`, and details. A refused field is named in a `BadRequest` detail by its JSON name, such as `startTime`.

| HTTP status | `status` | Cause | What to do |
|---|---|---|---|
| 400 | `INVALID_ARGUMENT` | A field is missing or invalid: a name in `metrics` that isn't on this page, a `resource` that isn't an instance, volume, or network interface in the project of the path, an `endTime` before `startTime`, a `period` that isn't whole seconds. | Correct the field the error names. |
| 401 | `UNAUTHENTICATED` | No access token, or an expired or invalid one. | Get a new token. See [Use the API](../../platform/access/api.md#authenticate). |
| 403 | `PERMISSION_DENIED` | You don't have `observability.metric.get` on the resource. | Ask for a role that includes it, such as Viewer. See [Roles](../../iam/roles.md). |
| 404 | `NOT_FOUND` | The project of the path doesn't exist. | Correct the project ID. |
| 409 | `FAILED_PRECONDITION` | The query exceeds the data point limit, the per-minute limit, or the concurrency limit. All three return the message `metric query rate limit exceeded; please retry later`. | Check that the query has at most 11,000 data points. If it does, wait a few seconds and retry. |
| 503 | `UNAVAILABLE` | The query didn't finish within 30 seconds, or metrics are temporarily unavailable. | Retry. If it keeps timing out, query a shorter window or fewer metrics. |

## Errors

GraphQL errors carry their code in `extensions.code`. For the general meaning of each code, see [Errors](../../platform/reference/errors.md).

| Code | Cause | What to do |
|---|---|---|
| [`BAD_REQUEST`](../../platform/reference/errors.md#bad_request) | A name in `metricNames` isn't one of the metrics on this page (message: ``metric `<name>` is not in the catalog``), or `resourceUrn` isn't a compute instance, volume, or network interface. | Correct the metric name or the URN. |
| [`FORBIDDEN`](../../platform/reference/errors.md#forbidden) | You don't have `observability.metric.get` on the resource. | Ask for a role that includes it, such as Viewer. See [Roles](../../iam/roles.md). |
| [`CONFLICT`](../../platform/reference/errors.md#conflict) | The query exceeds the data point limit, the per-minute limit, or the concurrency limit. All three return the message `metric query rate limit exceeded; please retry later`. | Check that the query has at most 11,000 data points. If it does, wait a few seconds and retry. |
| [`SERVICE_UNAVAILABLE`](../../platform/reference/errors.md#service_unavailable) | The query didn't finish within 30 seconds, or metrics are temporarily unavailable. | Retry. If it keeps timing out, query a shorter window or fewer metrics. |

A query that fails isn't billed.
