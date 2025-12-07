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

## Configure Cloud Credentials

Before deploying, ensure your cloud credentials are properly configured.

### **AWS Credentials**

**Option 1: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=<your-access-key>
export AWS_SECRET_ACCESS_KEY=<your-secret-key>
export AWS_DEFAULT_REGION=us-east-1
```

**Option 2: AWS CLI Configure**
```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Default region, Output format
```

**Option 3: AWS Profile**
```bash
aws configure --profile <profile-name>
export AWS_PROFILE=<profile-name>
```

**Verify Configuration:**
```bash
aws sts get-caller-identity
# Should show your AWS account ID and user/role
```

---

### **GCP Credentials**

**Option 1: Interactive Login (User Account)**
```bash
gcloud auth login
# Opens browser for authentication
```

**Option 2: Service Account Key File**
```bash
gcloud auth activate-service-account --key-file=<path-to-key.json>
# Example: gcloud auth activate-service-account --key-file=gcpkey.json
```

**Set Active Project:**
```bash
gcloud config set project <project-id>
# Or extract from key file:
gcloud config set project $(cat gcpkey.json | jq -r .project_id)
```

**Verify Configuration:**
```bash
# Check active account
gcloud auth list
# Should show * next to active account

# Check active project
gcloud config get-value project
# Should show your project ID

# Verify access
gcloud projects describe $(gcloud config get-value project)
```

**Switch Between Accounts:**
```bash
# List all accounts
gcloud auth list

# Switch to specific account
gcloud config set account <account-email>

# Switch back to user account
gcloud auth login
```

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
### 3. **Setup venv**
```bash
make setup-venv
```
After `venv` is setup completely, activate the venv

```bash
source venv/bin/activate
```

### 4. **Deploy**

Full deployment **(first time or complete redeploy)**:

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
---
## Updating Attestor Configurations
### **Update Config**

Update chain service configuration parameters on staging_vars.yml:

```bash
make update ENV=staging
```

**What it does:**
- Pulls latest secrets
- Downloads updated config template from GitHub
- Updates `chain_config.yaml` only
- Restarts services (no image pull)
---

## Patch Attestor Docker Image

### 1. Update image tags in staging_vars.yml
```bash
docker_image_tag_sign: "staging-v2.0.1"
docker_image_tag_chain: "staging-v2.0.1"
```

### 2. Run patch
```bash
make patch ENV=staging
```

**What it does:**
- Updates `.env` file with new image tags
- Pulls new docker images
- Restarts services with new images

---
---

## Summary

| Command | Purpose | Changes |
|---------|---------|---------|
| `make upload-secrets` | Store secrets | Creates/updates secret in cloud |
| `make attach-instance-profile` | Grant VM access | Attaches IAM role/service account |
| `make setup-venv` | Setup venv | Installs Ansible |
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

