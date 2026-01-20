# Verulink Attestor Ansible Roles

This directory contains Ansible roles for deploying, updating, and patching the Verulink Attestor service.

## Role Structure

### cloud_common
Handles cloud provider CLI installation and authentication (GCP/AWS).

**Tasks:**
- Installs and verifies GCP CLI or AWS CLI
- Authenticates with cloud provider service accounts

### prechecks
Validates prerequisites, cloud access, and secret existence before deployment.

**Tasks:**
- Verifies GCP/AWS authentication and active accounts
- Checks if required secrets exist in Secret Manager (GCP or AWS)
- Validates all required keys and certificates are defined
- Provides debug output for secret checks
- Fails early if prerequisites are missing

**Features:**
- Validates cloud provider access before proceeding
- Checks secret existence in both GCP Secret Manager and AWS Secrets Manager
- Ensures all required variables are defined (Aleo keys, BSC keys, mTLS certificates)
- Provides helpful error messages if validation fails

### secrets
Retrieves and syncs secrets from cloud Secret Manager (GCP Secret Manager or AWS Secrets Manager).

**Note:** Secrets are stored using the separate `secret_store.sh` script. This role only retrieves them during deployment/update/patch operations.

**Tasks:**
- Retrieves the combined attestor secret from cloud Secret Manager
- Parses the secret JSON to extract mTLS certificates and signing service credentials
- Sets variables for use by the config role:
  - `ca_certificate_base64`, `attestor_certificate_base64`, `attestor_key_base64`
  - `bsc_private_key`, `bsc_wallet_address`
  - `aleo_private_key`, `aleo_wallet_address`
  - `signing_service_username`, `signing_service_password`
- Cleans up temporary secret files after retrieval

**Features:**
- Uses dedicated temporary directory (`/tmp/verulink_secrets`) for better security
- Handles both GCP Secret Manager and AWS Secrets Manager
- Supports `secret_pull: from_local` or `from_target` to control where CLI runs
- All secret operations use `no_log: true` to prevent logging sensitive data
- Automatically encodes certificates to base64 format expected by config role

**Variables:**
- `secret_pull`: Where to run CLI commands (`from_local` or `from_target`, default: `from_target`)
- `attestor_secret_name`: Override auto-generated secret name (optional)

### config
Handles configuration file generation and mTLS certificate deployment.

**Tasks:**
- Creates mTLS directory structure
- Determines branch based on environment (devnet/staging/mainnet)
- Downloads and renders config template
- Splits combined config into individual files (chain_config.yaml, sign_config.yaml, secrets.yaml, .env)
- Deploys mTLS certificates and keys

**Operations:**
- `deploy`: Full configuration deployment (default)
- `update`: Updates configuration files from template
- `patch`: Patches specific config files (requires `patch_config_files` variable)

**Variables:**
- `attestor_install_dir`: Installation directory (default: `/home/{{ ansible_user }}/verulink_attestor`)
- `mtls_dir`: mTLS directory (default: `{{ attestor_install_dir }}/.mtls`)
- `github_base_url`: GitHub base URL for downloading templates
- `branch`: Git branch (auto-determined from `env` if not set)

### docker
Manages Docker installation and Docker Compose deployment.

**Tasks:**
- Installs Docker and Docker Compose
- Creates installation directory
- Downloads compose.yml from GitHub
- Starts attestor services via Docker Compose

**Operations:**
- `deploy`: Full Docker deployment (default)
- `update`: Pulls latest images and restarts services
- `patch`: Updates compose.yml and reloads services (requires `patch_compose: true`)

**Handlers:**
- `restart docker`: Restarts Docker service
- `restart attestor services`: Restarts attestor containers
- `reload attestor services`: Reloads attestor containers

**Variables:**
- `attestor_install_dir`: Installation directory
- `github_base_url`: GitHub base URL
- `branch`: Git branch (auto-determined from `env` if not set)

### k8s
Manages Kubernetes/Helm deployment.

**Tasks:**
- Installs Helm if needed
- Creates Kubernetes namespace
- Adds Verulink Helm repository
- Deploys or upgrades Verulink Attestor via Helm
- Supports patching with additional values files

**Variables:**
- `k8s_namespace`: Kubernetes namespace (default: `verulink-attestor`)
- `helm_repo_url`: Helm repository URL
- `patch_files`: List of additional values files for patching

## Usage

### Deploy
```bash
ansible-playbook playbooks/deploy.yml -i inventories/<env>/hosts.yml
```

### Update
```bash
ansible-playbook playbooks/update.yml -i inventories/<env>/hosts.yml
```

### Patch
```bash
ansible-playbook playbooks/patch.yml -i inventories/<env>/hosts.yml \
  -e "patch_config_files=[{filename: 'chain_config.yaml', content: '...'}]" \
  -e "patch_compose=true"
```

## Environment Variables

The following environment variables should be set in your inventory or group_vars:

- `env`: Environment name (devnet/staging/mainnet)
- `infrastructure_provider`: Cloud provider (gcp/aws)
- `deployment_type`: Deployment type (docker/k8s)
- `ansible_user`: SSH user for deployment
- `attestor_name`: Name of the attestor
- `gcp_project`: GCP project ID (for GCP deployments)
- `region`: AWS region (for AWS deployments)

## Branch Mapping

Branches are automatically determined based on environment:
- `devnet` → `develop`
- `staging` → `ci/ansible-deployment`
- `mainnet` → `main`

This can be overridden by setting the `branch` variable explicitly.

