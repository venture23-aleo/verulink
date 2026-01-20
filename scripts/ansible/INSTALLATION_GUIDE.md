# Verulink Attestor - Fresh Installation Guide

This guide provides step-by-step instructions for installing Verulink Attestor in different environments (devnet, staging, mainnet) using Ansible.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Pre-Installation Checklist](#pre-installation-checklist)
4. [Installation Steps](#installation-steps)
5. [Environment-Specific Configuration](#environment-specific-configuration)
6. [Verification](#verification)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### 1. Local Machine Requirements
- **Ansible**: Version 2.9+ installed
- **Python**: Version 3.6+ with required packages
- **SSH Access**: SSH key pair for accessing target servers
- **Cloud CLI**: AWS CLI or GCP CLI (depending on infrastructure provider)
- **Cloud Credentials**: Service account keys or IAM credentials

### 2. Target Server Requirements
- **OS**: Ubuntu 20.04+ or similar Debian-based Linux
- **SSH Access**: Root or sudo access
- **Network**: Internet connectivity for downloading Docker images
- **Resources**: Minimum 2 CPU cores, 4GB RAM, 20GB disk space

### 3. Required Information
Before starting, gather the following:
- [ ] Aleo wallet address and private key
- [ ] BSC/EVM wallet address and private key
- [ ] mTLS certificates (CA cert, attestor cert, attestor key) - base64 encoded
- [ ] Signing service username and password
- [ ] Collector service URL
- [ ] Prometheus pushgateway URL (optional)
- [ ] Attestor name (format: `<env>_attestor_verulink_<company>`)

---

## Environment Setup

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd verulink/scripts/ansible
```

### Step 2: Configure Inventory
Create or update the inventory file for your environment:

**For Devnet** (`inventories/dev/hosts.yml`):
```yaml
all:
  hosts:
    devnet-attestor-01:
      ansible_host: <your-server-ip>
      ansible_user: ubuntu
      ansible_ssh_private_key_file: ~/.ssh/your-key.pem
  vars:
    env: devnet
    infrastructure_provider: aws  # or gcp
    deployment_type: docker  # or k8s
    region: us-east-1  # AWS region or GCP region
    ansible_user: ubuntu
```

**For Staging** (`inventories/staging/hosts.yml`):
```yaml
all:
  hosts:
    staging-attestor-01:
      ansible_host: <your-server-ip>
      ansible_user: ubuntu
      ansible_ssh_private_key_file: ~/.ssh/your-key.pem
  vars:
    env: staging
    infrastructure_provider: aws  # or gcp
    deployment_type: docker  # or k8s
    region: us-east-1
    ansible_user: ubuntu
```

**For Mainnet/Production** (`inventories/prod/hosts.yml`):
```yaml
all:
  hosts:
    mainnet-attestor-01:
      ansible_host: <your-server-ip>
      ansible_user: ubuntu
      ansible_ssh_private_key_file: ~/.ssh/your-key.pem
  vars:
    env: mainnet
    infrastructure_provider: aws  # or gcp
    deployment_type: docker  # or k8s
    region: us-east-1
    ansible_user: ubuntu
```

### Step 3: Configure Environment Variables
Edit the environment-specific variables file:

**For Devnet** - Edit `devnet_vars.yml`:
```yaml
# Attestor Configuration
attestor_name: "devnet_attestor_verulink_<yourCompanyIdentifier>"
mode: "dev"

# Aleo Chain Configuration
aleo_chain_id: "6694886634403"
aleo_wallet_address: "<your_aleo_wallet_address>"
aleo_bridge_contract: "vlink_token_bridge_v6.aleo"
aleo_node_url: "https://api.explorer.provable.com/v1|testnet"
aleo_private_key: "<your_aleo_private_key>"

# BSC Chain Configuration
bsc_chain_id: "422842677857"  # BSC Testnet
bsc_wallet_address: "<your_evm_wallet_address>"
bsc_bridge_contract: "0x2E8e59559F3F0e1b49484F5f5C7d30b0017b543b"
bsc_node_url: "wss://base-sepolia-rpc.publicnode.com"
bsc_filter_topic: "0x2ea0473a63d92d3182c86a6f05d1984a63782c7c58f5d32bb629fdf43388c1b0"
bsc_start_height: 1
bsc_private_key: "<your_evm_private_key>"

# Signing Service Configuration
signing_service_username: "<your_signing_service_username>"
signing_service_password: "<your_signing_service_password>"

# Collector Service Configuration
collector_service_url: "<collector_service_url>"
ca_certificate_base64: "<ca_certificate_base64>"
attestor_certificate_base64: "<attestor_certificate_base64>"
attestor_key_base64: "<attestor_key_base64>"

# Docker Image Tags
docker_image_tag_sign: "devnet-v2.0.0-beta1"
docker_image_tag_chain: "devnet-v2.0.0-beta1"
deployment_environment: "dev"

# Secret names (for AWS)
mtls_secret_name: "dev/verulink/attestor/mtls"
signingservice_secret_name: "dev/verulink/attestor/signingservice"

# For GCP, use:
# mtls_secret_name: "dev_verulink_attestor_mtls"
# signingservice_secret_name: "dev_verulink_attestor_signingservice"
```

**For Staging** - Edit `staging_vars.yml`:
```yaml
# Similar structure as devnet, but with staging values
attestor_name: "stg_attestor_verulink_<yourCompanyIdentifier>"
mode: "stage"
# ... (see staging_vars.yml for full template)
```

**For Mainnet** - Edit `mainnet_vars.yml`:
```yaml
# Similar structure, but with production values
attestor_name: "mainnet_attestor_verulink_<yourCompanyIdentifier>"
mode: "prod"
# ... (see mainnet_vars.yml for full template)
```

### Step 4: Configure Cloud Provider

#### For AWS:
1. Ensure AWS credentials are configured:
   ```bash
   aws configure
   # Or set environment variables:
   export AWS_ACCESS_KEY_ID=<your-key>
   export AWS_SECRET_ACCESS_KEY=<your-secret>
   export AWS_DEFAULT_REGION=us-east-1
   ```

2. Ensure the target server has IAM role with permissions for:
   - `secretsmanager:CreateSecret`
   - `secretsmanager:UpdateSecret`
   - `secretsmanager:DescribeSecret`
   - `secretsmanager:GetSecretValue`

#### For GCP:
1. Place service account key file:
   ```bash
   cp /path/to/verulink-attestor-sa.json scripts/ansible/
   ```

2. Ensure service account has permissions:
   - `secretmanager.secrets.create`
   - `secretmanager.secrets.update`
   - `secretmanager.versions.add`
   - `secretmanager.versions.access`

---

## Pre-Installation Checklist

Before running the deployment, verify:

- [ ] Inventory file is configured with correct server IPs
- [ ] SSH keys are accessible and have correct permissions (`chmod 600`)
- [ ] Environment variables file is updated with all required values
- [ ] All placeholders (`<...>`) are replaced with actual values
- [ ] mTLS certificates are base64 encoded
- [ ] Private keys are properly formatted (no extra whitespace)
- [ ] Cloud provider credentials are configured
- [ ] Network connectivity to target server is working
- [ ] Target server has sufficient resources

---

## Installation Steps

### Step 1: Run Prerequisites Check
Verify all prerequisites are met:

```bash
cd scripts/ansible
ansible-playbook playbooks/prereq-check.yml -i inventories/<env>/hosts.yml \
  -e "@<env>_vars.yml"
```

Replace `<env>` with `dev`, `staging`, or `prod`.

**Expected Output:**
- ✅ Cloud CLI installed
- Cloud authentication verified
- Secrets can be accessed/created
- All required variables are defined

### Step 2: Deploy Verulink Attestor
Run the deployment playbook:

```bash
ansible-playbook playbooks/deploy.yml -i inventories/<env>/hosts.yml \
  -e "@<env>_vars.yml" \
  -e "overwrite_secret=true"
```

**What this does:**
1. **cloud_common**: Installs GCP/AWS CLI if needed
2. **prechecks**: Validates cloud access and prerequisites
3. **secrets**: Stores mTLS and signing service secrets in Secret Manager
4. **config**: Downloads and renders configuration files, deploys mTLS certificates
5. **docker** (or **k8s**): Installs Docker/Compose and starts services

**Deployment Time:** Approximately 5-10 minutes depending on network speed.

### Step 3: Monitor Deployment
Watch the Ansible output for any errors. The playbook will:
- Show progress for each role
- Display debug information for secret checks
- Report any failures immediately

### Step 4: Verify Installation
After deployment completes, verify the services:

```bash
# SSH into the target server
ssh -i ~/.ssh/your-key.pem ubuntu@<server-ip>

# Check Docker containers
docker ps

# Check container logs
docker logs verulink-chain
docker logs verulink-sign

# Check if services are running
docker compose -f ~/verulink_attestor/compose.yml ps
```

---

## Environment-Specific Configuration

### Devnet Environment
- **Branch**: `develop`
- **Chain IDs**: Testnet values
- **Image Tags**: `devnet-v*.*.*`
- **Mode**: `dev`
- **Secret Names**: `dev/verulink/attestor/*`

### Staging Environment
- **Branch**: `ci/ansible-deployment`
- **Chain IDs**: Testnet values
- **Image Tags**: `staging-v*.*.*`
- **Mode**: `stage`
- **Secret Names**: `stg/verulink/attestor/*`

### Mainnet/Production Environment
- **Branch**: `main`
- **Chain IDs**: Mainnet values
- **Image Tags**: `v*.*.*` (no prefix)
- **Mode**: `prod`
- **Secret Names**: `prod/verulink/attestor/*`

---

## Verification

### 1. Check Services Status
```bash
# On target server
cd ~/verulink_attestor
docker compose ps

# Expected output:
# verulink-sign    Up
# verulink-chain  Up
```

### 2. Check Logs
```bash
# Signing service logs
docker logs verulink-sign --tail 50

# Chain service logs
docker logs verulink-chain --tail 50

# Look for:
# - No error messages
# - "Service started" or similar success messages
# - Connection to Aleo/BSC nodes established
```

### 3. Check Configuration Files
```bash
# Verify config files exist
ls -la ~/verulink_attestor/
# Should see:
# - chain_config.yaml
# - sign_config.yaml
# - secrets.yaml
# - .env
# - compose.yml
# - .mtls/ (directory with certificates)

# Verify mTLS certificates
ls -la ~/verulink_attestor/.mtls/
# Should see:
# - ca.crt
# - <attestor_name>.crt
# - <attestor_name>.key
```

### 4. Check Secrets in Cloud
**AWS:**
```bash
aws secretsmanager describe-secret \
  --secret-id "<env>/verulink/attestor/mtls" \
  --region us-east-1
```

**GCP:**
```bash
gcloud secrets describe <env>_verulink_attestor_mtls \
  --project=<gcp-project>
```

### 5. Test Service Health
```bash
# Check if signing service is responding
curl http://localhost:8080/health

# Check chain service (if exposed)
# Should return healthy status
```

---

## Troubleshooting

### Common Issues

#### 1. SSH Connection Failed
**Problem**: Cannot connect to target server
**Solution**:
- Verify SSH key permissions: `chmod 600 ~/.ssh/your-key.pem`
- Check security group/firewall rules
- Verify server IP address is correct
- Test SSH connection manually first

#### 2. Cloud Authentication Failed
**Problem**: Cannot authenticate with AWS/GCP
**Solution**:
- For AWS: Verify IAM credentials or instance role
- For GCP: Check service account key file exists and is valid
- Verify cloud CLI is installed: `aws --version` or `gcloud --version`

#### 3. Secrets Already Exist
**Problem**: Secret creation fails because secret already exists
**Solution**:
- Set `overwrite_secret: true` in playbook vars
- Or manually delete existing secrets first
- Or use update playbook instead

#### 4. Docker Installation Failed
**Problem**: Docker installation fails
**Solution**:
- Check internet connectivity on target server
- Verify apt repositories are accessible
- Check for sufficient disk space
- Review Ansible output for specific error

#### 5. Configuration Template Not Found
**Problem**: Cannot download config template from GitHub
**Solution**:
- Verify branch name is correct for environment
- Check GitHub URL is accessible
- Verify network connectivity
- Check if branch exists in repository

#### 6. mTLS Certificate Errors
**Problem**: Certificate validation fails
**Solution**:
- Verify certificates are base64 encoded correctly
- Check certificate format (PEM)
- Ensure certificate names match attestor_name
- Verify certificate files have correct permissions (0600)

#### 7. Services Not Starting
**Problem**: Docker containers fail to start
**Solution**:
- Check container logs: `docker logs <container-name>`
- Verify configuration files are valid YAML
- Check environment variables in `.env` file
- Verify all required files exist
- Check disk space and memory

### Getting Help

1. **Check Logs**: Always check container logs first
2. **Run Prereq Check**: Run `prereq-check.yml` to validate setup
3. **Verbose Mode**: Run with `-vvv` for detailed output:
   ```bash
   ansible-playbook playbooks/deploy.yml -i inventories/<env>/hosts.yml \
     -e "@<env>_vars.yml" -vvv
   ```
4. **Test Individual Roles**: You can run specific roles using tags (if implemented)

---

## Post-Installation

### 1. Set Up Monitoring
- Configure Prometheus metrics (if using)
- Set up log aggregation
- Configure alerts

### 2. Backup Configuration
- Backup environment variables file (securely)
- Document attestor name and configuration
- Save SSH keys securely

### 3. Update Documentation
- Document any custom configurations
- Note any deviations from standard setup
- Record any issues encountered

---

## Quick Reference

### Deployment Commands

```bash
# Devnet
ansible-playbook playbooks/deploy.yml -i inventories/dev/hosts.yml \
  -e "@devnet_vars.yml" -e "overwrite_secret=true"

# Staging
ansible-playbook playbooks/deploy.yml -i inventories/staging/hosts.yml \
  -e "@staging_vars.yml" -e "overwrite_secret=true"

# Mainnet
ansible-playbook playbooks/deploy.yml -i inventories/prod/hosts.yml \
  -e "@mainnet_vars.yml" -e "overwrite_secret=true"
```

### Update Commands

```bash
# Update configuration and images
ansible-playbook playbooks/update.yml -i inventories/<env>/hosts.yml \
  -e "@<env>_vars.yml"
```

### Patch Commands

```bash
# Patch specific configuration
ansible-playbook playbooks/patch.yml -i inventories/<env>/hosts.yml \
  -e "@<env>_vars.yml" \
  -e "patch_config_files=[{filename: 'chain_config.yaml', content: '...'}]"
```

---

## Security Best Practices

1. **Never commit secrets**: Keep environment variable files in `.gitignore`
2. **Use encrypted variables**: Use Ansible Vault for sensitive data
3. **Rotate credentials**: Regularly rotate private keys and passwords
4. **Limit access**: Restrict SSH and cloud access to authorized personnel
5. **Monitor logs**: Regularly review service logs for anomalies
6. **Backup secrets**: Securely backup secrets from Secret Manager

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Ansible playbook output
3. Check service logs on target server
4. Consult the main README.md for role documentation

