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

## Deployment Steps

### Running Ansible Playbooks

1. Download ansbile variables for specific environments
   To download devnet ansible vars
   ```bash
   Select the respective **branch** based on your deployment environment:
    | Branch   | Deployment Environment |
    |----------|------------------------|
    | develop  | devnet                 |
    | staging  | staging/testnet        |
    | main     | mainnet                |

    Download devnet ansible vars file
	```bash
	
	curl -o devnet_vars.yml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/develop/scripts/ansible/devnet_vars.yml
    ```
	Download staging ansible vars file
	```bash
	curl -o staging_vars.yml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/staging/scripts/ansible/devnet_vars.yml
    ```
	Download mainnet ansible vars file
	```bash
	curl -o mainnet_vars.yml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/main/scripts/ansible/devnet_vars.yml
	```
2. Create `inventory.txt`
    ```yaml
    [devnet]
    192.168.1.100 ansible_host=devnet.example.com ansible_user=ubuntu
    
    [staging]
    192.168.1.101 ansible_host=staging.example.com ansible_user=ubuntu
    
    [mainnet]
    192.168.1.102 ansible_host=mainnet.example.com ansible_user=ubuntu
    
    [devnet:vars]
    env=devnet
    
    [staging:vars]
    env=staging
    
    [mainnet:vars]
    env=mainnet
    ```
3. Install required Ansible collections:
   ```bash
   ansible-galaxy collection install community.general
   ansible-galaxy collection install community.docker
   ```

4. Deploy to a specific environment:

    
    Deploy to devnet
    ```bash
    ansible-playbook -i inventory.txt deploy.yml --limit devnet
    ```
    Deploy to staging
    ```bash
    ansible-playbook -i inventory.txt deploy.yml --limit staging
    ```
    Deploy to mainnet
    ```bash
    ansible-playbook -i inventory.txt deploy.yml --limit mainnet
    ```

