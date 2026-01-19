# Kubernetes Deployment Guide

This guide covers the essential steps to deploy Verulink Attestor on Kubernetes.

---

## Prerequisites

1. **Kubernetes cluster access** - Verify with:
   ```bash
   make check-k8s-auth
   kubectl cluster-info
   ```

2. **Helm 3.x** installed
   ```bash
   helm version
   ```

---

## 1. Setup Kubernetes Secrets

The attestor requires secrets for mTLS certificates, private keys, and signing service credentials.

### Option A: Using Make Command (Recommended)

```bash
make upload-secrets
# Select option 3 (Kubernetes)
# Follow prompts for namespace and secret name
```

This will:
- Create namespace if needed
- Base64 encode certificates
- Create/update Kubernetes secret with all required keys

### Option B: Manual Creation

If creating manually, use this command:

```bash
kubectl create secret generic attestor-secret \
  --namespace=<your-namespace> \
  --from-literal=CA_MTLS_CERT="<base64_encoded_ca_cert>" \
  --from-literal=ATTESTOR_MTLS_CERT="<base64_encoded_attestor_cert>" \
  --from-literal=ATTESTOR_MTLS_KEY="<base64_encoded_attestor_key>" \
  --from-literal=ALEO_PRIVATE_KEY="<aleo_private_key>" \
  --from-literal=BSC_PRIVATE_KEY="<bsc_private_key>" \
  --from-literal=BASE_PRIVATE_KEY="<base_private_key>" \
  --from-literal=ARBITRUM_PRIVATE_KEY="<arbitrum_private_key>" \
  --from-literal=ETHEREUM_PRIVATE_KEY="<ethereum_private_key>" \
  --from-literal=SIGNING_SERVICE_USERNAME="<username>" \
  --from-literal=SIGNING_SERVICE_PASSWORD="<password>"
```

**Verify secret:**
```bash
kubectl get secret attestor-secret -n <namespace>
kubectl describe secret attestor-secret -n <namespace>
```

---

## 2. Configure Storage

### Default: emptyDir (Development/Testing)

The chart defaults to `emptyDir` storage, which is ephemeral and suitable for testing only.

```yaml
# In values.yaml
storage:
  type: emptyDir
```

⚠️ **Warning:** Data is lost when pods restart. Not suitable for production.

### Production: Persistent Volume Claim (PVC)

For production deployments, use PVC for persistent storage.

#### Step 1: Prepare StorageClass (if needed)

Check existing StorageClasses:
```bash
kubectl get storageclass
```

If you need to create one, see `attestor/attestor-chart/STORAGECLASS_GUIDE.md` or use:

```bash
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: attestor-storage-class
provisioner: ebs.csi.aws.com  # Adjust for your cloud provider
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF
```

#### Step 2: Configure PVC in values.yaml

```yaml
storage:
  type: pvc
  pvc:
    size: 10Gi  # Adjust based on your needs (e.g., "50Gi", "100Gi")
    storageClassName: "attestor-storage-class"  # Or use existing StorageClass
    accessModes:
      - ReadWriteOnce
```

**Note:** The chart will automatically create the PVC when `storage.type: pvc` is set.

---

## 3. Prepare Configuration Values

Before deploying, prepare your `values.yaml` file with all required configuration. Review `attestor/attestor-chart/values.yaml` for the complete structure.

### Required Variables

#### Attestor Configuration
```yaml
chainService:
  name: "dev_attestor_verulink_xyz"  # Your attestor name
  version: "1.0.1"
  mode: "dev"  # Options: "dev", "stag", "prod"
  db_dir: "/var/lib/attestor/dev"
```

#### Chain Configurations

**Aleo Chain:**
```yaml
chainService:
  chains:
    aleo:
      chain_id: "6694886634403"
      bridge_contract: "vlink_token_bridge_v9.aleo"
      node_url: "https://api.explorer.provable.com/v1|testnet"
      wallet_address: "aleo1..."  # Your Aleo wallet address
```

**Ethereum Chain:**
```yaml
    ethereum:
      chain_id: "27234042785"
      bridge_contract: "0x7440176A6F367D3Fad1754519bD8033EAF173133"
      node_url: "https://eth.llamarpc.com"
      start_height: 9847133  # Block height to start from
      filter_topic: "0x2ea0473a63d92d3182c86a6f05d1984a63782c7c58f5d32bb629fdf43388c1b0"
      wallet_address: "0x..."  # Your Ethereum wallet address
```

**BSC Chain:**
```yaml
    bsc:
      chain_id: "28556963657430695"
      bridge_contract: "0xdeEbcF78DfDa7494f9Bbe4Ca313C486D29F0EC56"
      node_url: "wss://base-sepolia-rpc.publicnode.com"
      start_height: 1
      filter_topic: "0x2ea0473a63d92d3182c86a6f05d1984a63782c7c58f5d32bb629fdf43388c1b0"
      wallet_address: "0x..."  # Your BSC wallet address
```

**Base Chain:**
```yaml
    base:
      chain_id: "443067135441324596"
      bridge_contract: "0x1e12776edb78A5473964cF257E825991ad501533"
      node_url: "wss://base-sepolia-rpc.publicnode.com"
      start_height: 35024380
      filter_topic: "0x2ea0473a63d92d3182c86a6f05d1984a63782c7c58f5d32bb629fdf43388c1b0"
      wallet_address: "0x..."  # Your Base wallet address
```

**Arbitrum Chain:**
```yaml
    arbitrum:
      chain_id: "438861435819683566"
      bridge_contract: "0x2E8e59559F3F0e1b49484F5f5C7d30b0017b543b"
      node_url: "wss://arbitrum-sepolia.drpc.org"
      start_height: 224887156
      filter_topic: "0x2ea0473a63d92d3182c86a6f05d1984a63782c7c58f5d32bb629fdf43388c1b0"
      wallet_address: "0x..."  # Your Arbitrum wallet address
```

#### Service Configuration

**Signing Service:**
```yaml
chainService:
  signing_service:
    host: "signingservice"  # Service name (default)
    port: 8080
    endpoint: "/sign"
    scheme: "http"
    username: "aleo"  # Must match SIGNING_SERVICE_USERNAME in secret
    password: "chain"  # Must match SIGNING_SERVICE_PASSWORD in secret
```

**Collector Service:**
```yaml
chainService:
  collector_service:
    uri: "https://aleomtls.venture23.xyz/"  # Your collector service URL
    collector_wait_dur: "1h"
```

**Metrics (Prometheus):**
```yaml
chainService:
  metrics:
    host: "https://pushgateway-aleomtls.venture23.xyz/"  # Your pushgateway URL
    job_name: "dev-push-gateway"  # Your job name
```

#### Docker Images
```yaml
image:
  chain:
    repository: "venture23/verulink-attestor-chain"
    tag: "v2.0.2"  # Use appropriate version
  sign:
    repository: "venture23/verulink-attestor-sign"
    tag: "v2.0.2"  # Use appropriate version
```

#### Secret Reference
```yaml
secrets:
  existingSecretName: "attestor-secret"  # Must match the secret created in step 1
```

#### ServiceAccount & RBAC (Optional but Recommended)
```yaml
serviceAccount:
  create: true
  name: "verulink-attestor-sa"

rbac:
  create: true
```

---

## 4. Deploy with Helm

### Add Helm Repository (if using published chart)
```bash
helm repo add verulink https://venture23-aleo.github.io/verulink/
helm repo update
```

### Install/Upgrade Chart

**Option 1: Using published chart**
```bash
helm upgrade --install verulink-attestor verulink/verulink-attestor \
  --namespace <your-namespace> \
  --create-namespace \
  -f values.yaml
```

**Option 2: Using local chart**
```bash
helm upgrade --install verulink-attestor ./attestor/attestor-chart \
  --namespace <your-namespace> \
  --create-namespace \
  -f values.yaml
```

### Verify Deployment
```bash
# Check pods
kubectl get pods -n <namespace>

# Check services
kubectl get svc -n <namespace>

# Check PVC (if using PVC storage)
kubectl get pvc -n <namespace>

# View logs
kubectl logs -f deployment/chainservice -n <namespace>
kubectl logs -f deployment/signingservice -n <namespace>
```

---

## Quick Reference: Values.yaml Structure

The complete `values.yaml` structure includes:

- `chainService.*` - Chain configurations, service settings, logging
- `secrets.existingSecretName` - Kubernetes secret name
- `storage.*` - Storage type and PVC configuration
- `image.*` - Docker image repositories and tags
- `serviceAccount.*` - ServiceAccount configuration
- `rbac.*` - RBAC configuration

**See `attestor/attestor-chart/values.yaml` for all available options and defaults.**

---

## Security Features

1. **ServiceAccount** - Dedicated service account for pods (if enabled)
2. **RBAC** - Minimal read-only permissions to secrets/configmaps (if enabled)
3. **Secret Verification** - Deployment checks for required secrets before proceeding
4. **Network Policies** - Optional network policies for pod-to-pod communication

---

## Troubleshooting

### Secret Not Found
```bash
# Verify secret exists
kubectl get secret attestor-secret -n <namespace>

# Check secret keys
kubectl describe secret attestor-secret -n <namespace>
```

### PVC Not Created
```bash
# Check StorageClass exists
kubectl get storageclass

# Check PVC status
kubectl get pvc -n <namespace>
kubectl describe pvc attestor-storage -n <namespace>
```

### Pods Not Starting
```bash
# Check pod events
kubectl describe pod <pod-name> -n <namespace>

# Check logs
kubectl logs <pod-name> -n <namespace>
```

---

## Summary Checklist

Before deploying, ensure:

- [ ] Kubernetes cluster access verified (`make check-k8s-auth`)
- [ ] Secrets created in Kubernetes (`make upload-secrets` or manual)
- [ ] Storage configured (emptyDir for dev, PVC for production)
- [ ] `values.yaml` prepared with all required variables
- [ ] Chain configurations updated (chain IDs, contracts, node URLs, wallet addresses)
- [ ] Service URLs configured (collector, metrics)
- [ ] Docker image tags specified
- [ ] Namespace created or will be created during deployment
