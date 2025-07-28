#!/bin/bash
set -e

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
NC="\033[0m"  # No color

# Function to prompt user for input with default values and validate non-empty input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default_value="$3"
    
    while true; do
        read -p "$prompt [$default_value]: " user_input
        if [[ -z "$user_input" && -n "$default_value" ]]; then
            user_input="$default_value"
        fi
        if [[ -z "$user_input" ]]; then
            echo -e "${RED}Input cannot be empty. Please try again.${NC}"
        else
            eval "$var_name=\"$user_input\""
            break
        fi
    done
}

# Function to prompt for password input (masked input for private keys)
prompt_password_input() {
    local prompt="$1"
    local var_name="$2"

    while true; do
        # Mask input using 'read -s' to hide password
        read -s -p "$prompt: " user_input
        echo

        # Validate non-empty password
        if [[ -z "$user_input" ]]; then
            echo -e "${RED}Input cannot be empty. Please try again.${NC}"
        else
            eval "$var_name=\"$user_input\""
            break
        fi
    done
}

# Function to validate if a file exists
validate_file_exists() {
    local file_path="$1"
    if [[ ! -f "$file_path" ]]; then
        echo -e "${RED}File not found: $file_path. Please make sure the file exists and try again.${NC}"
        return 1
    fi
    return 0
}

# Function to repeatedly ask for a valid file path until the file exists
prompt_valid_file() {
    local prompt="$1"
    local var_name="$2"

    while true; do
        prompt_input "$prompt" "$var_name"
        if validate_file_exists "${!var_name}"; then
            break
        fi
    done
}

echo -e "${GREEN}Starting installation of Verulink Attestor...${NC}"

# Prompt user for Attestor Name first
prompt_input "Enter the Attestor Name" ATTESTOR_NAME "devnet_attestor_verulink_abc"

# Prompt user for Aleo Private Key and Address after Attestor Name
prompt_password_input "Enter the Aleo Private Key" ALEO_PRIV_KEY
prompt_input "Enter the Aleo Wallet Address" WALLET_ADDRESS "your_aleo_wallet_address"

# Prompt for Ethereum details
prompt_password_input "Enter the Ethereum Private Key" ETHEREUM_PRIV_KEY
prompt_input "Enter the Ethereum Wallet Address" ETH_ADDRESS "your_ethereum_wallet_address"

# Prompt for Signing Service details
prompt_input "Enter the Signing Service Username" SIGN_USER "admin"
prompt_password_input "Enter the Signing Service Password" SIGN_PASS

# Prompt for Collector and Prometheus URLs
prompt_input "Enter the Collector Service URL" COLLECTOR_URL "http://collector-service-url"
prompt_input "Enter the Prometheus Push Gateway URL" PROMETHEUS_PUSHGW "http://prometheus-pushgateway-url"

# Prompt user for certificate file paths and validate existence
echo -e "${GREEN}Please provide the paths to the certificates.${NC}"
prompt_valid_file "Enter the path to the CA certificate (ca.crt)" CA_CERT_PATH
prompt_valid_file "Enter the path to the Attestor certificate" ATTESTOR_CERT_PATH
prompt_valid_file "Enter the path to the Attestor key" ATTESTOR_KEY_PATH

# Prompt user for docker image tag
prompt_input "Enter the Docker Image Tag" DOCKER_IMAGE_TAG "latest"



# Create the directory structure
echo -e "${GREEN}Creating directory structure...${NC}"
mkdir -p verulink_attestor/{chainService,signingService,.mtls}



# Create secrets.yaml with user input
echo -e "${GREEN}Creating secrets.yaml...${NC}"
cat > verulink_attestor/secrets.yaml <<EOF
chain:
  ethereum:
    private_key: "$ETHEREUM_PRIV_KEY"
    wallet_address: "$ETH_ADDRESS"
  aleo:
    private_key: "$ALEO_PRIV_KEY"
    wallet_address: "$WALLET_ADDRESS"
EOF
chmod 600 verulink_attestor/secrets.yaml


# Create sign_config.yaml with user input
echo -e "${GREEN}Creating sign_config.yaml...${NC}"
cat > verulink_attestor/sign_config.yaml <<EOF
chains:
  - name: aleo
    chain_id: 6694886634403
  - name: ethereum
    chain_id: 28556963657430695
cred:
  username: "$SIGN_USER"
  password: "$SIGN_PASS"
EOF

CHAIN_CONFIG_FILE=./chain_config.yaml
SIGN_CONFIG_FILE=./sign_config.yaml
SIGN_SECRETS_FILE=./secrets.yaml
CHAIN_MTLS_DIR=./.mtls

# Create config.yaml by including a template and user input
echo -e "${GREEN}Creating chain_config.yaml...${NC}"
cat > verulink_attestor/chain_config.yaml <<EOF
name: "$ATTESTOR_NAME"
version: 1.0.1
chains:
  - name: aleo
    chain_id: 6694886634403
    wallet_address: "$WALLET_ADDRESS"
    bridge_contract: token_bridge_stg_v2.aleo
    node_url: https://api.explorer.provable.com/v1|testnet
    sequence_num_start:
      ethereum: 1
    pkt_validity_wait_dur: 10s
    finality_height: 2
    retry_packet_wait_dur: 1m
    prune_base_seq_num_wait_dur: 30m
    average_block_gen_dur: 3s
    dest_chains:
      - ethereum
  - name: ethereum
    chain_id: 28556963657430695
    wallet_address: "$ETH_ADDRESS"
    bridge_contract: 0x302f22Ce7bAb6bf5aEFe6FFBa285E844c7F38EA6
    node_url: https://eth-sepolia.g.alchemy.com/v2/JYz9kRR9YnUUteIGY04655ndMf-vCCN4
    start_height: 8717400
    finality_height: 1
    filter_topic: 0x23b9e965d90a00cd3ad31e46b58592d41203f5789805c086b955e34ecd462eb9
    feed_pkt_wait_dur: 30s
    pkt_validity_wait_dur: 12s
    retry_packet_wait_dur: 1m
    prune_base_seq_num_wait_dur: 30m
    dest_chains:
      - aleo
check_health_service: 1m
db_dir: /path/to/db/dir
consume_packet_workers: 10
log:
  encoding: console
  output_dir: /path/to/log/dir
mode: prod
signing_service:
  host: signingservice
  port: 8080
  endpoint: "/sign"
  scheme: "http"
  username: "$SIGN_USER"
  password: "$SIGN_PASS"
  health_end_point: "/health"
collector_service:
  uri: "$COLLECTOR_URL"
  collector_wait_dur: 1h
  ca_certificate: /configs/.mtls/$CA_CERT
  attestor_certificate: /configs/.mtls/$ATTESTOR_NAME.cer
  attestor_key: /configs/.mtls/$ATTESTOR_NAME.key
metrics:
  host: "$PROMETHEUS_PUSHGW"
  job_name: prod-push-gateway
EOF

# Copy mTLS certificates into the .mtls directory
echo -e "${GREEN}Copying certificates to .mtls/ directory...${NC}"
cp "$CA_CERT_PATH" verulink_attestor/.mtls/${CA_CERT_PATH##*/}
cp "$ATTESTOR_CERT_PATH" verulink_attestor/.mtls/"$ATTESTOR_NAME.cer"
cp "$ATTESTOR_KEY_PATH" verulink_attestor/.mtls/"$ATTESTOR_NAME.key"

# Secure the .mtls directory
echo -e "${GREEN}Securing .mtls directory...${NC}"
chmod 750 verulink_attestor/.mtls
chmod 600 verulink_attestor/.mtls/$ATTESTOR_KEY

# Create docker-compose.yaml
echo -e "${GREEN}Creating compose.yaml...${NC}"
cat > verulink_attestor/compose.yaml <<EOF

x-dbpath: &p # server as value holder for compose file
  /db

x-logpath: &l
  /log

services:
  chainservice:
    depends_on:
      - signingservice
    image: venture23/verulink-attestor-chain:$DOCKER_IMAGE_TAG
    volumes:
      - type: volume
        source: db-path
        target: *p
      - type: volume
        source: log-path
        target: *l      
      - type: bind
        source: $CHAIN_CONFIG_FILE
        target: /configs/config.yaml
      - $CHAIN_MTLS_DIR:/configs/.mtls
    environment:
      DB_PATH: *p
      LOG_PATH: *l
      LOG_ENC: json
      MODE: prod
      CLEAN_START: false
      MAINTENANCE: false
  signingservice:
    image: venture23/verulink-attestor-sign:$DOCKER_IMAGE_TAG
    volumes:
      - $SIGN_CONFIG_FILE:/configs/config.yaml
      - $SIGN_SECRETS_FILE:/configs/keys.yaml
    ports:
      - 8080:8080
      
volumes:
  db-path:
  log-path:

EOF

echo -e "${GREEN}Checking prerequisites...${NC}"
if ! command -v docker &> /dev/null; then
    echo "Docker not found. Installing Docker..."
    # Add Docker's official GPG key:
    sudo apt-get update
    sudo apt-get install ca-certificates curl
    sudo install -m 0755 -d /etc/apt/keyrings
    sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
    sudo chmod a+r /etc/apt/keyrings/docker.asc

    # Add the repository to Apt sources:
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
      $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}") stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt-get update

    sudo apt-get install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker $USER
fi

sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF
sudo chown root:root /etc/docker/daemon.json
sudo chmod 0644 /etc/docker/daemon.json

# Provide final instructions
echo -e "${GREEN}Installation complete!${NC}"
echo ""
echo "📌 Please review the configuration files before starting the service."
echo "1. Verify that certificates were correctly copied into the .mtls/ directory."
echo "2. Ensure all placeholders in config files are set correctly."
echo ""
echo "To start the service, navigate to the verulink_attestor directory and run:"
echo "cd verulink_attestor"
echo "docker compose up -d"
