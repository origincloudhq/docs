---
id: kubernetes-snapshots
title: Snapshot and restore a persistent volume
nav_title: Snapshot and restore
description: Take a snapshot of a persistent volume with a VolumeSnapshot, restore it into a new claim, and delete snapshots once nothing restored from them remains.
page_type: task
parent: kubernetes
nav_order: 30
tags: [storage, kubernetes, snapshots]
related: [snapshots, kubernetes-troubleshooting]
last_reviewed: 2026-11-27
---

# Snapshot and restore a persistent volume

A `VolumeSnapshot` of a claim takes a Storage [snapshot](../snapshots/index.md) of its volume, and a new claim whose `dataSource` names the `VolumeSnapshot` gets a new volume with the snapshot's data. The driver protects every snapshot it takes, because Storage creates a volume only from a protected snapshot. You don't protect or unprotect anything yourself.

## Before you begin

- The driver installed with the snapshot CRDs and the snapshot-controller; see [Install the Origin CSI driver](install.md#install-the-snapshot-crds-and-the-snapshot-controller).
- A bound claim of the driver, such as `data` from the installation check.

A snapshot is crash-consistent: it holds what was on the disk at that moment, like a power cut. For an application-consistent snapshot, stop writes or flush the application first.

## Take a snapshot

1. Create a `VolumeSnapshot` of the claim. Without `volumeSnapshotClassName`, the default class `origin-snapshots` is used.

   ```yaml
   apiVersion: snapshot.storage.k8s.io/v1
   kind: VolumeSnapshot
   metadata:
     name: data-snap-1
   spec:
     volumeSnapshotClassName: origin-snapshots
     source:
       persistentVolumeClaimName: data
   ```

   ```sh
   kubectl apply -f data-snap-1.yaml
   ```

2. Wait until it's ready to use. It is once the copy is complete and the snapshot is protected.

   ```sh
   kubectl wait --for=jsonpath='{.status.readyToUse}'=true volumesnapshot/data-snap-1 --timeout=10m
   ```

The snapshot is in the volume's zone and appears in `origin pvs list-snapshots`, with the name Kubernetes gave it, `snapshot-<uid>` after the `VolumeSnapshot`'s UID, in its `csi.origincloud.eu/snapshot-name` tag.

## Restore a snapshot into a new claim

1. Create a claim whose `dataSource` is the `VolumeSnapshot`, at least as large as the snapshot's `restoreSize`.

   ```yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: data-restored
   spec:
     accessModes: [ReadWriteOnce]
     resources:
       requests:
         storage: 10Gi
     dataSource:
       apiGroup: snapshot.storage.k8s.io
       kind: VolumeSnapshot
       name: data-snap-1
   ```

2. Use the claim in a pod that runs in the snapshot's zone. A volume is restored only in its snapshot's zone, so in a cluster with nodes in more than one zone, pin the pod there, for example with a node selector:

   ```yaml
   spec:
     nodeSelector:
       topology.pvs.csi.origincloud.eu/zone: eu-central1-az1
   ```

   If the pod is scheduled to a node in another zone, the restored volume can't attach to it, and the pod stays in `ContainerCreating`. Once the volume exists, its `PersistentVolume` keeps later pods in its zone.

Use the same `csi.storage.k8s.io/fstype` as the source claim's class: the node plugin never reformats a disk that holds another filesystem, and refuses to mount it.

Cloning a claim directly (a `dataSource` of kind `PersistentVolumeClaim`) isn't supported, because Storage has no clone. Take a snapshot and restore it instead.

## Delete snapshots

Delete a `VolumeSnapshot` with `kubectl delete volumesnapshot <name>`. With the class's `deletionPolicy: Delete`, the driver unprotects and deletes the Storage snapshot.

Two Storage rules decide when that can happen:

- **A snapshot can't be deleted while a volume restored from it exists.** Storage doesn't separate a restored volume from its snapshot. Until every claim restored from the snapshot is deleted, together with its volume, the `VolumeSnapshotContent` stays and Kubernetes retries the delete.
- **A volume can't be deleted while it has snapshots.** Deleting a claim whose volume has snapshots leaves its `PersistentVolume` in `Released`, with `VolumeFailedDelete` events, until you delete the snapshots; then the volume is deleted.

So clean up in this order: the restored claims, then the snapshots, then the source claim. See [Snapshot delete is refused](../troubleshooting/index.md#snapshot-delete-is-refused) for how Storage reports these rules.

## Related

- [Snapshots](../snapshots/index.md) – how Storage snapshots work
- [Snapshot states](../snapshots/snapshot-states.md)
- [Troubleshoot the Origin CSI driver](troubleshooting.md)
