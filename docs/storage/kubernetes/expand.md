---
id: kubernetes-expand
title: Expand a persistent volume
nav_title: Expand a volume
description: Grow a persistent volume of the Origin CSI driver by raising its claim's size; the volume and its filesystem grow while the pod keeps running.
page_type: task
parent: kubernetes
nav_order: 40
tags: [storage, kubernetes, volumes]
related: [volumes-resize]
last_reviewed: 2026-11-27
---

# Expand a persistent volume

Raise a claim's requested size to grow its volume. The driver grows the Storage volume, attached or not, and the node plugin then grows the filesystem (`ext4` or `xfs`) while the pod keeps running. Nothing needs to restart.

## Before you begin

- The claim's `StorageClass` has `allowVolumeExpansion: true`, as the installed `origin-gp1` does.
- Decide the new size carefully: **a volume never shrinks.** Kubernetes refuses a smaller request, and so does Storage.

## Expand the claim

1. Set the claim's requested size to the new size. The driver rounds it up to a whole GiB.

   ```sh
   kubectl patch pvc data -p '{"spec":{"resources":{"requests":{"storage":"20Gi"}}}}'
   ```

2. Wait for the claim's capacity to show the new size.

   ```sh
   kubectl get pvc data -w
   ```

   The `CAPACITY` column changes once the filesystem has grown. While a pod uses the claim, this happens without the pod noticing. If no pod uses it, the volume grows at once and the filesystem grows the next time a pod mounts it.

3. Check the size inside the pod.

   ```sh
   kubectl exec data-test -- df -h /data
   ```

A claim with `volumeMode: Block` gets the larger disk and no filesystem change; growing what is on it is up to you.

## If the expansion fails

The claim's events (`kubectl describe pvc data`) name the error:

- `never shrinks`: the requested size is smaller than the volume. Ask for at least its current size.
- A quota error: the larger volume exceeds the project's Storage quota. See [Request refused because a quota is exceeded](../troubleshooting/index.md#request-refused-because-a-quota-is-exceeded).
- `didn't grow`: Storage accepted the resize but couldn't apply it, and the volume keeps its old size and data. Kubernetes retries; see [Resize reports RESIZE_FAILED](../troubleshooting/index.md#resize-reports-resize_failed).

## Related

- [Resize a volume](../volumes/resize.md) – how Storage resizes a volume
- [Storage classes and topology](storage-classes.md)
- [Troubleshoot the Origin CSI driver](troubleshooting.md)
