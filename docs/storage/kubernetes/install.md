---
id: kubernetes-install
title: Install the Origin CSI driver
nav_title: Install the driver
description: Install the Origin CSI driver on a Kubernetes cluster you run on Origin Cloud instances, with the nodes' service account and no stored credential.
page_type: task
parent: kubernetes
nav_order: 20
tags: [storage, kubernetes, service-accounts, iam]
related: [kubernetes-storage-classes, kubernetes-troubleshooting]
last_reviewed: 2026-11-28
---

# Install the Origin CSI driver

Install the driver from the manifests in its public repository, after giving the cluster's nodes a service account that may manage the project's volumes. The driver then provisions a Storage volume for every `PersistentVolumeClaim` of its `StorageClass`. For what it installs, see [Volumes for Kubernetes with the Origin CSI driver](index.md).

## Before you begin

- A Kubernetes cluster whose nodes are Origin Cloud instances, all in one project, with the kubelet's directory at `/var/lib/kubelet`, the default of most distributions.
- `kubectl` with access to the cluster as a cluster administrator. The install uses `kubectl apply -k`, which needs network access to `github.com` and to the image registries `ghcr.io` and `registry.k8s.io` from the nodes.
- `git` on the machine that runs `kubectl`. `kubectl apply -k` fetches a remote base, such as a GitHub URL, with `git`, and fails with `error: no 'git' program on path` without it. Minimal images, including the platform's Debian 12 minimal image, don't include it: on Debian or Ubuntu, `sudo apt-get install -y git`.
- The `origin` CLI, signed in as someone who can create a service account and role bindings in the organization and holds `iam.service_account.act_as`, which [`roles/iam.service-account-user`](../../iam/roles.md#rolesiamservice-account-user) grants. See [Use service accounts](../../iam/service-accounts.md).
- The project's id and its organization's id.

## Give the nodes a service account

The controller plugin authenticates as the service account of the instance it runs on. Kubernetes can move it to any node, so every node runs as the same service account.

1. Create a `WORKLOAD` service account for the cluster.

   ```sh
   origin iam create-service-account --organization <org-id> --display-name my-cluster-nodes --type WORKLOAD
   ```

   The output contains its `member`, `//iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>`.

2. Bind the built-in role `roles/pvs.csi-driver` to it on the cluster's project.

   ```sh
   origin iam create-role-binding --organization <org-id> \
     --member //iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id> \
     --role //iam.origincloudapis.eu/roles/pvs.csi-driver \
     --project //resourcemanager.origincloudapis.eu/projects/<project-id>
   ```

   The role allows exactly what the driver does: managing the project's volumes and snapshots, and attaching them to and detaching them from its instances. It can't launch, change or terminate an instance. See [`roles/pvs.csi-driver`](../../iam/roles.md#rolespvscsi-driver).

3. Run every node's instance as the service account. For a node you launch later, pass `--service-account` at launch instead.

   ```sh
   origin compute update-instance --project <project-id> --zone eu-central1-az1 \
     --instance <instance-id> \
     --service-account //iam.origincloudapis.eu/organizations/<org-id>/serviceAccounts/<service-account-id>
   ```

   A running instance takes the change without a restart. See [Run an instance as a service account](../../compute/instances/service-account.md).

Nothing else is needed: you create no key, and the cluster holds no `Secret` for the driver.

## Install the snapshot CRDs and the snapshot-controller

Snapshots need the `VolumeSnapshot` CRDs and the snapshot-controller from the Kubernetes CSI project. They are cluster-wide and many distributions install them already. Check first:

```sh
kubectl get crd volumesnapshotclasses.snapshot.storage.k8s.io
```

If the CRD isn't found, install both:

```sh
kubectl apply -k 'https://github.com/kubernetes-csi/external-snapshotter/client/config/crd?ref=v8.7.1'
kubectl apply -k 'https://github.com/kubernetes-csi/external-snapshotter/deploy/kubernetes/snapshot-controller?ref=v8.7.1'
```

Without them, the driver's `VolumeSnapshotClass` is refused and the controller's snapshotter container keeps restarting.

## Install the driver

The manifests are in the `deploy/` directory of [origincloudhq/csi-driver-origincloud](https://github.com/origincloudhq/csi-driver-origincloud). They install everything into `kube-system`, and each release tag installs that release's image, `ghcr.io/origincloudhq/csi-driver-origincloud:<version>`. The controller needs the project it creates volumes in, which you set in a kustomize overlay.

1. Create a directory for the overlay, such as `origin-csi/`, with this `kustomization.yaml`:

   ```yaml
   apiVersion: kustomize.config.k8s.io/v1beta1
   kind: Kustomization
   resources:
     - https://github.com/origincloudhq/csi-driver-origincloud/deploy?ref=v0.1.1
   configMapGenerator:
     - name: origincloud-csi-controller
       namespace: kube-system
       behavior: merge
       literals:
         - ORIGINCLOUD_PROJECT=<project-id>
   ```

   `ORIGINCLOUD_PROJECT` takes the project's id, not its full name. The overlay is also where you remove the default-class annotation, add tolerations or change resources.

2. Apply it and wait for both parts to be ready.

   ```sh
   kubectl apply -k origin-csi/
   kubectl -n kube-system rollout status deployment/origincloud-csi-controller
   kubectl -n kube-system rollout status daemonset/origincloud-csi-node
   ```

The install creates these objects:

| Object | Name |
|---|---|
| `CSIDriver` | `pvs.csi.origincloud.eu` |
| `Deployment` (controller plugin, one replica) | `origincloud-csi-controller` |
| `DaemonSet` (node plugin, on every node whatever its taints) | `origincloud-csi-node` |
| `ServiceAccount`s, `ClusterRole`s and bindings | `origincloud-csi-*` |
| `StorageClass`, the cluster's default | `origin-gp1` |
| `VolumeSnapshotClass`, the default | `origin-snapshots` |

Both plugins use the node's network (`hostNetwork`), because an instance's metadata service answers only the instance's own address. Their liveness probes listen on the node's ports `29652` (controller) and `29653` (node plugin); keep these free.

## Verify the installation

1. Create a claim and a pod that uses it:

   ```yaml
   apiVersion: v1
   kind: PersistentVolumeClaim
   metadata:
     name: data
   spec:
     accessModes: [ReadWriteOnce]
     resources:
       requests:
         storage: 10Gi
   ---
   apiVersion: v1
   kind: Pod
   metadata:
     name: data-test
   spec:
     containers:
       - name: app
         image: busybox:1.36
         command: ["sh", "-c", "echo hello > /data/hello && sleep 3600"]
         volumeMounts:
           - name: data
             mountPath: /data
     volumes:
       - name: data
         persistentVolumeClaim:
           claimName: data
   ```

   ```sh
   kubectl apply -f data-test.yaml
   ```

2. Wait until the pod runs and the claim is `Bound`.

   ```sh
   kubectl wait --for=condition=Ready pod/data-test --timeout=5m
   kubectl get pvc data
   ```

3. Find the volume in Storage. Its `csi.origincloud.eu/volume-name` tag holds the `VOLUME` name that `kubectl get pvc` printed.

   ```sh
   origin pvs list-volumes --project <project-id>
   ```

4. Delete the test. With the `Delete` reclaim policy, deleting the claim deletes the volume.

   ```sh
   kubectl delete -f data-test.yaml
   ```

If the pod stays `Pending` or `ContainerCreating`, see [Troubleshoot the Origin CSI driver](troubleshooting.md).

## Upgrade or remove the driver

To upgrade, change the `?ref=` in the overlay to the new release tag and apply it again. To remove the driver, delete the claims that use it first, so that their volumes are deleted, then run `kubectl delete -k origin-csi/`. Volumes left behind stay in Storage and are billed until you [delete them](../volumes/delete.md).

## Related

- [Storage classes and topology](storage-classes.md)
- [Snapshot and restore a persistent volume](snapshots.md)
- [Use service accounts](../../iam/service-accounts.md)
