# Verulink Attestor Helm Chart

Helm chart for deploying Verulink Attestor service on Kubernetes.

## Quick Start

```bash
# Add the repository
helm repo add verulink https://venture23-aleo.github.io/verulink/
helm repo update

# Install with default values (production configuration)
helm install verulink-attestor verulink/verulink-attestor

# Install with environment-specific overrides
helm install verulink-attestor verulink/verulink-attestor -f values-dev.yaml
```

## Environment-Specific Values

This chart includes pre-configured values files for different environments:

- **values.yaml** - Base/default values
- **values-dev.yaml** - Development environment overrides
- **values-staging.yaml** - Staging environment overrides
- **values-prod.yaml** - Production environment overrides

### Using Environment-Specific Values

**Note:** `values.yaml` contains production defaults. Use environment-specific files to override for dev/staging:

```bash
# Development (overrides production defaults)
helm install verulink-attestor verulink/verulink-attestor \
  -f values.yaml \
  -f values-dev.yaml

# Staging (overrides production defaults)
helm install verulink-attestor verulink/verulink-attestor \
  -f values.yaml \
  -f values-staging.yaml

# Production (uses defaults from values.yaml)
helm install verulink-attestor verulink/verulink-attestor \
  -f values.yaml
```

### Environment Differences

| Feature | Development | Staging | Production (Default) |
|---------|------------|---------|---------------------|
| Storage | emptyDir (ephemeral) | PVC (20Gi, Delete) | PVC (100Gi, Retain) |
| Mode | dev | stag | prod |
| Workers | 10 | 10 | 20 |
| Log Retention | 14 days | 14 days | 30 days |
| Log Max Size | 100 MB | 100 MB | 200 MB |
| ServiceAccount | Disabled | Disabled | Enabled |
| RBAC | Disabled | Disabled | Enabled |

## Prerequisites

1. **Kubernetes Secrets**: Create the required secret before deployment:
   ```bash
   kubectl create secret generic attestor-secret \
     --from-literal=CA_MTLS_CERT="<base64>" \
     --from-literal=ATTESTOR_MTLS_CERT="<base64>" \
     --from-literal=ATTESTOR_MTLS_KEY="<base64>" \
     --from-literal=ALEO_PRIVATE_KEY="<key>" \
     --from-literal=BSC_PRIVATE_KEY="<key>" \
     --from-literal=BASE_PRIVATE_KEY="<key>" \
     --from-literal=ARBITRUM_PRIVATE_KEY="<key>" \
     --from-literal=ETHEREUM_PRIVATE_KEY="<key>" \
     --from-literal=SIGNING_SERVICE_USERNAME="<username>" \
     --from-literal=SIGNING_SERVICE_PASSWORD="<password>"
   ```

2. **StorageClass** (for staging/production): Ensure a StorageClass exists or configure the chart to create one.

## Configuration

### Required Values

Before deploying, you must configure:

1. **Chain Configurations**: Update chain IDs, contracts, node URLs, and wallet addresses
2. **Service URLs**: Configure collector service and metrics endpoints
3. **Secrets**: Reference the Kubernetes secret name
4. **Storage**: Choose storage type (emptyDir for dev, PVC for staging/prod)

See `values.yaml` for the complete configuration structure.

## Custom Values

You can override any value using `--set` or custom values files:

```bash
helm install verulink-attestor verulink/verulink-attestor \
  -f values-prod.yaml \
  --set chainService.name=my-attestor \
  --set storage.pvc.size=200Gi
```

## Upgrading

```bash
helm upgrade verulink-attestor verulink/verulink-attestor \
  -f values.yaml \
  -f values-prod.yaml
```

## Uninstalling

```bash
helm uninstall verulink-attestor
```

## Documentation

- [Kubernetes Deployment Guide](../../KUBERNETES_DEPLOYMENT_CHANGES.md)
- [StorageClass Guide](./STORAGECLASS_GUIDE.md)
