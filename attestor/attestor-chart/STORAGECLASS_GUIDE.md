# StorageClass Creation Guide

## Option 1: Create StorageClass Manually with kubectl

### Basic StorageClass (GP3 - Recommended)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: attestor-storage-class
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

**Apply it:**
```bash
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: attestor-storage-class
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF
```

### StorageClass with Encryption

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: attestor-storage-class-encrypted
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  fsType: ext4
  encrypted: "true"
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

### StorageClass with Custom IOPS (for high-performance workloads)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: attestor-storage-class-high-iops
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  fsType: ext4
  iops: "3000"        # IOPS (3000-16000 for gp3)
  throughput: "125"   # Throughput in MiB/s (125-1000 for gp3)
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

### StorageClass with Retain Policy (for data persistence)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: attestor-storage-class-retain
provisioner: ebs.csi.aws.com
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Retain  # Volumes won't be deleted when PVC is deleted
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
```

## Option 2: Create StorageClass via Helm Chart

1. **Update `values.yaml`:**

```yaml
storage:
  type: pvc
  createStorageClass: true
  storageClassName: "attestor-storage-class"
  provisioner: "ebs.csi.aws.com"
  reclaimPolicy: "Delete"
  volumeBindingMode: "WaitForFirstConsumer"
  allowVolumeExpansion: true
  parameters:
    type: gp3
    fsType: ext4
  pvc:
    size: 50Gi
    storageClassName: "attestor-storage-class"
    accessModes:
      - ReadWriteOnce
```

2. **Deploy:**
```bash
helm upgrade verulink-attestor . -n verulink-attestor
```

## StorageClass Parameters Explained

### Provisioner Options:
- `ebs.csi.aws.com` - AWS EBS CSI driver (recommended, modern)
- `kubernetes.io/aws-ebs` - Legacy AWS EBS provisioner

### Volume Types (for AWS EBS):
- `gp3` - General Purpose SSD (recommended, cost-effective)
- `gp2` - General Purpose SSD (legacy)
- `io1` - Provisioned IOPS SSD (high performance)
- `io2` - Provisioned IOPS SSD (latest generation)
- `st1` - Throughput Optimized HDD
- `sc1` - Cold HDD

### Reclaim Policy:
- `Delete` - Volume is deleted when PVC is deleted (default)
- `Retain` - Volume is retained when PVC is deleted (for data safety)

### Volume Binding Mode:
- `Immediate` - Volume is created immediately
- `WaitForFirstConsumer` - Volume is created when pod is scheduled (recommended for multi-AZ)

### Parameters:
- `type` - EBS volume type (required)
- `fsType` - Filesystem type (ext4, xfs, etc.)
- `encrypted` - Enable encryption ("true" or "false")
- `iops` - IOPS for gp3/io1/io2 volumes
- `throughput` - Throughput in MiB/s for gp3 volumes

## Verify StorageClass

```bash
# List all storage classes
kubectl get sc

# Describe a specific storage class
kubectl describe sc attestor-storage-class
```

## Use Existing StorageClass

If you want to use an existing storage class (like `ebs-gp3-sc`), just reference it in your PVC:

```yaml
storage:
  type: pvc
  pvc:
    size: 50Gi
    storageClassName: "ebs-gp3-sc"  # Use existing storage class
    accessModes:
      - ReadWriteOnce
```
