---
id: kubernetes-troubleshooting
title: Troubleshoot the Origin CSI driver
nav_title: Troubleshooting
description: Fix claims that stay Pending, pods stuck in ContainerCreating, refused attaches, PERMISSION_DENIED, missing disks and the per-node volume limit.
page_type: troubleshooting
parent: kubernetes
nav_order: 50
tags: [storage, kubernetes, troubleshooting, errors]
last_reviewed: 2026-11-27
---

# Troubleshoot the Origin CSI driver

Each section below describes one symptom, its cause, and how to resolve it. Most errors show up as events on the claim or the pod:

```sh
kubectl describe pvc <claim>
kubectl describe pod <pod>
```

The driver's own logs name the API's error and its correlation ID:

```sh
kubectl -n kube-system logs deployment/origincloud-csi-controller -c driver
kubectl -n kube-system logs daemonset/origincloud-csi-node -c driver
```

For the logs of the node plugin on one node, pick its pod with `kubectl -n kube-system get pods -l app.kubernetes.io/name=origincloud-csi-node -o wide`.

## Pod stuck in ContainerCreating

**Symptom:** A pod that uses a claim stays in `ContainerCreating`, and its events show `FailedAttachVolume` or `FailedMount`.

**Cause:** The volume couldn't be attached to the node's instance, or the node plugin couldn't mount it. The event's message says which.

**Resolution:**
1. Read the pod's events and find the message in the sections below: [Attach refused](#attach-refused-because-the-volume-is-on-another-node), [another zone](#attach-refused-because-the-volume-is-in-another-zone), [`PERMISSION_DENIED`](#requests-refused-with-permission_denied), or [the disk doesn't show up](#the-disk-doesnt-show-up-on-the-node).
2. Check that the node plugin runs on the pod's node: `kubectl -n kube-system get pods -l app.kubernetes.io/name=origincloud-csi-node -o wide`. A node without it can't mount the driver's volumes.
3. Check the attachment Kubernetes asked for: `kubectl get volumeattachment` lists each volume's node and whether it's `ATTACHED`.

## Attach refused because the volume is on another node

**Symptom:** The pod's events show `FailedAttachVolume` with `volume <volume> is attached to another node: <attachment>`.

**Cause:** A volume attaches to one instance at a time, and it's still attached to the node the claim's previous pod ran on. This usually lasts only until Kubernetes has detached it there. It lasts longer when that node is down, because the old pod is never confirmed gone.

**Resolution:**
1. Wait a few minutes: once the old pod is gone, Kubernetes detaches the volume and attaches it to the new node.
2. If the old node is down for good, delete its `Node` object, or, if the node may come back, mark it out of service so Kubernetes detaches its volumes:

   ```sh
   kubectl taint nodes <old-node> node.kubernetes.io/out-of-service=nodeshutdown:NoExecute
   ```

   Remove the taint once the node is back.
3. Don't detach the volume yourself in Storage while Kubernetes still records the attachment.

## Attach refused because the volume is in another zone

**Symptom:** The pod's events show `FailedAttachVolume` with `a volume attaches only in its own zone`.

**Cause:** The pod was scheduled to a node in another zone than the volume's. A volume never moves between zones. This happens when a class uses `volumeBindingMode: Immediate`, when a restored claim's first pod ran outside the snapshot's zone, or when a node lacks the zone label.

**Resolution:**
1. Check the nodes' zones: `kubectl get nodes -L topology.pvs.csi.origincloud.eu/zone`. Every node needs a value; a node without one doesn't run the node plugin.
2. Delete the pod so the scheduler places it again; the `PersistentVolume`'s node affinity keeps it in the volume's zone. For a restored claim, pin the pod to the snapshot's zone; see [Snapshot and restore a persistent volume](snapshots.md#restore-a-snapshot-into-a-new-claim).
3. Keep `volumeBindingMode: WaitForFirstConsumer` in the classes you create. See [Storage classes and topology](storage-classes.md#topology-zones).

## Requests refused with PERMISSION_DENIED

**Symptom:** Claims stay `Pending`, or pods stay in `ContainerCreating`, and the events or the controller's log show `PERMISSION_DENIED` or `UNAUTHENTICATED`.

**Cause:** The controller plugin authenticates as the service account of the instance it runs on. `PERMISSION_DENIED` means that service account doesn't hold [`roles/pvs.csi-driver`](../../iam/roles.md#rolespvscsi-driver) on the project the driver is set to. `UNAUTHENTICATED`, or a log line saying the metadata service gave no credential, means that instance runs as no service account.

**Resolution:**
1. Find the controller's node: `kubectl -n kube-system get pods -l app.kubernetes.io/name=origincloud-csi-controller -o wide`.
2. Check that the node's instance shows the service account: `origin compute get-instance --instance <instance-id>` and its `serviceAccount`. If it's empty, set it; see [Give the nodes a service account](install.md#give-the-nodes-a-service-account). Set it on every node, because the controller can move.
3. Check the role binding: `origin iam list-role-bindings --organization <org-id> --member <service-account-member>` must list `roles/pvs.csi-driver` with the project the overlay's `ORIGINCLOUD_PROJECT` names, or org-wide.
4. Kubernetes retries on its own once the access is right.

## The disk doesn't show up on the node

**Symptom:** The volume is attached (`kubectl get volumeattachment` shows `ATTACHED`), but the pod's events show `FailedMount` with a `NOT_FOUND` error for the volume's disk.

**Cause:** The node plugin finds a volume's disk by the volume's id, as `/dev/disk/by-id/virtio-<volume-id>` or through the disk serials in `/sys/block/*/serial`, and waits up to 30 seconds for a freshly attached disk to appear. The guest hasn't shown the disk within that time.

**Resolution:**
1. Wait: Kubernetes retries the mount, and a slow guest usually catches up.
2. On the node, list the disks: `ls -l /dev/disk/by-id/ | grep virtio-vol-`. If the volume's disk isn't there, check the attachment in Storage with `origin compute list-volume-attachments --instance <instance-id>`.
3. If the attachment is `ATTACHED` and the guest still shows no disk, delete the pod so Kubernetes detaches and attaches the volume again. If that doesn't help, contact support with the volume's name and the correlation ID from the driver's log.

## Mount refused because the disk holds another filesystem

**Symptom:** The pod's events show `FailedMount` with `FAILED_PRECONDITION`, naming a filesystem or a partition table on the disk.

**Cause:** The node plugin creates a filesystem only on an empty disk. It never formats a disk that holds a filesystem other than the class's `csi.storage.k8s.io/fstype`, or a partition table. This happens when a claim restored from a snapshot uses a class with another filesystem.

**Resolution:** Restore the snapshot into a claim whose class has the source's filesystem. See [Storage classes and topology](storage-classes.md#parameters).

## Pod Pending because the node has too many volumes

**Symptom:** A pod stays `Pending`, and its events say the nodes exceed their maximum volume count.

**Cause:** A node takes at most 24 of the driver's volumes: an instance has 26 disk slots, and the boot disk and a slot the platform reserves take two.

**Resolution:** Spread the pods over more nodes, or add nodes in the volumes' zone. The scheduler places the pod once a node has room.

## Claim stays Pending

**Symptom:** A claim stays `Pending` after a pod that uses it was scheduled, and its events show `ProvisioningFailed`.

**Cause:** The driver couldn't create the volume. The event names the reason: an unknown or misspelled class parameter (`INVALID_ARGUMENT`), the project's Storage quota (`RESOURCE_EXHAUSTED`), a refusal such as `PRODUCT_UNAVAILABLE` or `PAYMENT_METHOD_REQUIRED` (`FAILED_PRECONDITION`), or [`PERMISSION_DENIED`](#requests-refused-with-permission_denied).

**Resolution:**
1. For a parameter error, fix the `StorageClass`; see [Parameters](storage-classes.md#parameters). A class's parameters can't be changed, so delete and recreate it.
2. For a Storage refusal, see [Troubleshoot storage](../troubleshooting/index.md), which explains each one.
3. A claim with no pod stays `Pending` on purpose: `WaitForFirstConsumer` creates the volume only for a scheduled pod.

## The controller keeps restarting

**Symptom:** The `origincloud-csi-controller` pod restarts. The `driver` container's log says `the project must be a project id`, or the `csi-snapshotter` container exits.

**Cause:** The overlay doesn't set `ORIGINCLOUD_PROJECT` to the project's id; or the `VolumeSnapshot` CRDs aren't installed.

**Resolution:**
1. Set the project as [Install the driver](install.md#install-the-driver) shows, and apply the overlay again.
2. Install the snapshot CRDs and the snapshot-controller; see [Install the snapshot CRDs and the snapshot-controller](install.md#install-the-snapshot-crds-and-the-snapshot-controller).

## A deleted claim's volume isn't deleted

**Symptom:** After you delete a claim, its `PersistentVolume` stays in `Released` with `VolumeFailedDelete` events, and the volume stays in Storage.

**Cause:** A volume can't be deleted while it has snapshots, or while it's still attached.

**Resolution:**
1. Delete the `VolumeSnapshot`s of the claim, after deleting any claim restored from them. See [Delete snapshots](snapshots.md#delete-snapshots).
2. Kubernetes retries, and deletes the volume once nothing holds it.

## A VolumeSnapshot isn't deleted

**Symptom:** After you delete a `VolumeSnapshot`, its `VolumeSnapshotContent` stays, and the Storage snapshot with it.

**Cause:** A volume restored from the snapshot still exists. Storage doesn't separate a restored volume from its snapshot, so it refuses to unprotect the snapshot.

**Resolution:** Delete the claims restored from the snapshot. Kubernetes retries, and deletes the snapshot once their volumes are gone.

## Related

- [Troubleshoot storage](../troubleshooting/index.md)
- [Error codes](../../platform/reference/errors.md)
- [Install the Origin CSI driver](install.md)
