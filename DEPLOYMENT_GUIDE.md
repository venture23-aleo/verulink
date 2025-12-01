# Verulink Attestor Deployment Guide

## Prerequisites

### Setup Ansible Inventory

Create or edit the inventory file for your environment:

**Location:** `scripts/ansible/inventories/<env>/hosts.yml`

**Example for staging:**
```yaml
---
# Staging Environment Inventory
all:
  hosts:
    staging-attestor-01:
      ansible_host: <ip-address-of-vm>
      ansible_user: ubuntu
      ansible_ssh_private_key_file: <path-to-private-key>
  vars:
    env: staging
    infrastructure_provider: aws  # Options: aws or gcp
    deployment_type: docker  # Options: docker or k8s
    region: us-east-1  # AWS region (e.g., us-east-1) or GCP region (e.g., us-central1)
    ansible_user: ubuntu
    gcp_project: <gcp-project-id>  # Required if infrastructure_provider is gcp
```

**For devnet:** Use `scripts/ansible/inventories/dev/hosts.yml` with `env: devnet`  
**For production:** Use `scripts/ansible/inventories/prod/hosts.yml` with `env: mainnet`

**Required Variables:**
- `ansible_host`: VM IP address or hostname
- `ansible_ssh_private_key_file`: Path to SSH private key for VM access
- `infrastructure_provider`: `aws` or `gcp`
- `gcp_project`: GCP project ID (required for GCP)

---

## Quick Start

### 1. **Upload Secrets to Cloud Secret Manager**

```bash
make upload-secrets
```

**Secret JSON Format** (if creating manually):

```json
{
  "mtls": {
    "ca_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "attestor_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "attestor_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  },
  "signing_service": {
    "bsc_private_key": "0x...",
    "bsc_wallet_address": "0x...",
    "ethereum_private_key": "0x...",
    "ethereum_wallet_address": "0x...",
    "aleo_private_key": "APrivateKey1...",
    "aleo_wallet_address": "aleo1...",
    "signing_service_username": "admin",
    "signing_service_password": "password"
  }
}
```

**Note:** Make sure the secret can be accessed from the VM.

---

### 2. **Attach Instance Profile / Service Account to VM**

**AWS:**
```bash
make attach-instance-profile
# Select: 1) AWS
# Enter: EC2 Instance ID, IAM Role name
```

**GCP:**
```bash
make attach-instance-profile
# Select: 2) GCP
# Enter: Project ID, VM Name, Zone
# Note: If secret is in different project, enter secret's project when prompted
```


---

### 3. **Deploy**

Full deployment (first time or complete redeploy):

```bash
make deploy ENV=staging DEPLOYMENT_TYPE=docker
```

**What it does:**
- Installs Docker
- Pulls secrets from Secret Manager
- Downloads and renders config files
- Sets up mTLS certificates
- Starts services

---

### 4. **Update Config**

Update chain service configuration only:

```bash
make update ENV=staging
```

**What it does:**
- Pulls latest secrets
- Downloads updated config template from GitHub
- Updates `chain_config.yaml` only
- Restarts services (no image pull)

**When to use:** Config changes (chain settings, URLs, etc.)

---

### 5. **Patch (Update Docker Images)**

Quick docker image version update:

```bash
# 1. Update image tags in staging_vars.yml
docker_image_tag_sign: "staging-v2.0.1"
docker_image_tag_chain: "staging-v2.0.1"

# 2. Run patch
make patch ENV=staging
```

**What it does:**
- Updates `.env` file with new image tags
- Pulls new docker images
- Restarts services with new images

**When to use:** New code release, image version update

---

## Summary

| Command | Purpose | Changes |
|---------|---------|---------|
| `make upload-secrets` | Store secrets | Creates/updates secret in cloud |
| `make attach-instance-profile` | Grant VM access | Attaches IAM role/service account |
| `make deploy ENV=staging` | Full deployment | Everything (first time) |
| `make update ENV=staging` | Update config | `chain_config.yaml` only |
| `make patch ENV=staging` | Update images | `.env` + docker images |

---

### Verify Deployment

```bash
# Check services are running
ssh -i <key> ubuntu@<vm-ip>
docker compose -f ~/verulink_attestor/compose.yml ps

# Check logs
docker compose -f ~/verulink_attestor/compose.yml logs -f
```

