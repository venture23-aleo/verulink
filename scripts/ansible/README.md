# Ansible Configuration for Attestor Service


## Directory Structure

```
scripts/ansible/
├── devnet_vars.yml     # Devnet environment variables
├── staging_vars.yml    # Staging environment variables
├── mainnet_vars.yml    # Mainnet environment variables
├── inventory.txt       # Ansible inventory file (TOML format)
├── playbook.yml        # Main deployment playbook
└── README.md          # This file
```

## Environment Variables

Each environment variables file contains the following variable categories:

### Attestor Configuration
- `attestor_name`: Name identifier for the attestor service
- `mode`: Environment mode (dev/stage/prod)

### Aleo Chain Configuration
- `aleo_chain_id`: Aleo network identifier
- `aleo_wallet_address`: Aleo wallet address
- `aleo_bridge_contract`: Aleo bridge contract address
- `aleo_node_url`: Aleo RPC endpoint
- `aleo_private_key`: Aleo private key (should be encrypted in production)

### BSC Chain Configuration
- `bsc_chain_id`: BSC network identifier (97 for testnet, 56 for mainnet)
- `bsc_wallet_address`: BSC wallet address
- `bsc_bridge_contract`: BSC bridge contract address
- `bsc_node_url`: BSC RPC endpoint
- `bsc_filter_topic`: Event filter topic
- `bsc_start_height`: Starting block height
- `bsc_private_key`: BSC private key (should be encrypted in production)

### Service Configuration
- `db_dir`: Database directory path
- `log_dir`: Log directory path

### Signing Service Configuration
- `signing_service_host`: Signing service hostname
- `signing_service_port`: Signing service port
- `signing_service_username`: Authentication username
- `signing_service_password`: Authentication password

### Collector Service Configuration
- `collector_service_url`: Collector service URL
- `ca_certificate`: CA certificate path
- `attestor_certificate`: Attestor certificate path
- `attestor_key`: Attestor private key path

### Metrics Configuration
- `prometheus_pushgateway_url`: Prometheus pushgateway URL
- `prometheus_job_name`: Prometheus job name

## Usage

### Running Ansible Playbooks

To deploy to a specific environment:

```bash
# Deploy to devnet
ansible-playbook -i inventory.txt deploy.yml --limit devnet

# Deploy to staging
ansible-playbook -i inventory.txt deploy.yml --limit staging

# Deploy to mainnet
ansible-playbook -i inventory.txt deploy.yml --limit mainnet
```

The playbook automatically loads the appropriate variables file for each environment using `include_vars`.

### Using the Template

The `config.yam.j2` template in the `attestor/` directory uses these variables. When running Ansible, it will automatically substitute the variables based on the target environment.

### Security Notes

1. **Private Keys**: In production environments, private keys should be encrypted using Ansible Vault
2. **Passwords**: All passwords should be encrypted using Ansible Vault
3. **Certificates**: Certificate paths should be validated and secured

### Environment-Specific Considerations

- **Devnet**: Uses testnet configurations and local services
- **Staging**: Uses testnet configurations but production-like service URLs
- **Mainnet**: Uses mainnet configurations and production services

## Updating Variables

When updating variables:

1. Edit the appropriate environment variables file (e.g., `devnet_vars.yml`)
2. Test the changes in devnet first
3. Validate the configuration template rendering
4. Deploy to staging for testing
5. Deploy to mainnet after validation

## Template Variables Reference

The following variables are used in the `config.yam.j2` template:

- `{{ attestor_name }}`
- `{{ aleo_chain_id }}`
- `{{ aleo_wallet_address }}`
- `{{ aleo_bridge_contract }}`
- `{{ aleo_node_url }}`
- `{{ bsc_chain_id }}`
- `{{ bsc_wallet_address }}`
- `{{ bsc_bridge_contract }}`
- `{{ bsc_node_url }}`
- `{{ bsc_filter_topic }}`
- `{{ bsc_start_height }}`
- `{{ db_dir }}`
- `{{ log_dir }}`
- `{{ signing_service_host }}`
- `{{ signing_service_port }}`
- `{{ signing_service_username }}`
- `{{ signing_service_password }}`
- `{{ collector_service_url }}`
- `{{ prometheus_pushgateway_url }}`
- `{{ prometheus_job_name }}`
- `{{ bsc_private_key }}`
- `{{ aleo_private_key }}`
- `{{ docker_image_tag_sign }}`
- `{{ docker_image_tag_chain }}`

## Deployment Playbook

The `deploy.yml` file automates the complete deployment process as described in the DEPLOYMENT.md file.

### What the Playbook Does

1. **Creates installation directories** with proper permissions
2. **Downloads compose file** from the appropriate GitHub branch
3. **Downloads the consolidated config template** from GitHub
4. **Renders the template** with all environment variables
5. **Splits the rendered template** into 4 separate documents using YAML document separators (`---`)
6. **Creates 4 separate configuration files**:
   - `chain_config.yaml` - Chain service configuration (first document)
   - `sign_config.yaml` - Signing service configuration (second document)
   - `secrets.yaml` - Private keys and wallet addresses (third document, mode 600)
   - `.env` - Docker image tags (fourth document)
7. **Copies mTLS certificates** and keys to the proper location
8. **Installs Docker** using official Docker repositories:
   - Ubuntu/Debian: Uses official Docker CE repository
   - RHEL/CentOS: Uses official Docker CE repository
   - Includes Docker Compose plugin
9. **Pulls Docker images** for the services
10. **Starts the attestor services** using Docker Compose
11. **Verifies deployment** by checking service status and logs

### Running the Playbook

```bash
# Deploy to devnet
ansible-playbook -i inventory.yml deploy.yml --limit devnet

# Deploy to staging
ansible-playbook -i inventory.yml deploy.yml --limit staging

# Deploy to mainnet
ansible-playbook -i inventory.yml deploy.yml --limit mainnet
```

### Prerequisites

1. **mTLS Certificates**: You'll need the following certificates for deployment:
   - `ca.crt`
   - `{attestor_name}.crt`
   - `{attestor_name}.key`

2. **SSH Access**: Ensure SSH access to target servers with sudo privileges

3. **Ansible**: Install Ansible and required collections:
   ```bash
   pip install ansible docker
   ```

4. **Supported Operating Systems**: The playbook supports:
   - Ubuntu/Debian (apt-based systems)
   - RHEL/CentOS/Fedora (rpm-based systems)

### Security Considerations

- **Encrypt sensitive files**: Use Ansible Vault to encrypt private keys and certificates
- **Secure file permissions**: The playbook sets appropriate file permissions (600 for secrets, 750 for mTLS directory)
- **Environment isolation**: Each environment uses separate configuration files and Docker images
