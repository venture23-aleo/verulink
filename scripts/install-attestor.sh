#!/bin/bash
set -e

# Colors for output
GREEN="\033[0;32m"
RED="\033[0;31m"
YELLOW="\033[1;33m"
NC="\033[0m"  # No color

# Function to prompt user for input with default values and validate non-empty input
prompt_input() {
    local prompt="$1"
    local var_name="$2"
    local default_value="$3"
    
    while true; do
        read -p "$prompt [$default_value]: " user_input
        if [ -z "$user_input" ] && [ -n "$default_value" ]; then
            user_input="$default_value"
        fi
        if [ -z "$user_input" ]; then
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
        # Try to use stty to hide input, fall back to regular input if it fails
        if stty -echo 2>/dev/null; then
            read -p "$prompt: " user_input
            stty echo 2>/dev/null
        else
            # Fall back to regular input for non-interactive environments
            read -p "$prompt (input will be visible): " user_input
        fi
        echo

        # Validate non-empty password
        if [ -z "$user_input" ]; then
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
    if [ ! -f "$file_path" ]; then
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

# Prompt user for branch
prompt_input "Enter the Branch" BRANCH "develop"

# Create the directory structure
echo -e "${GREEN}Creating directory structure...${NC}"
mkdir -p verulink_attestor/.mtls


# Define configuration file paths
CHAIN_CONFIG_FILE=./chain_config.yaml
SIGN_CONFIG_FILE=./sign_config.yaml
SIGN_SECRETS_FILE=./secrets.yaml
CHAIN_MTLS_DIR=./.mtls
CHAIN_CONFIG_FILE=verulink_attestor/chain_config.yaml
SIGN_CONFIG_FILE=verulink_attestor/sign_config.yaml
SIGN_SECRETS_FILE=verulink_attestor/secrets.yaml
CHAIN_MTLS_DIR=verulink_attestor/.mtls

# Create config.yaml by including a template and user input
echo -e "${GREEN}Creating config files...${NC}"
# Download the config files from the Verulink Attestor repository
curl -o verulink_attestor/chain_config.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/$BRANCH/attestor/chainService/config.yaml
curl -o verulink_attestor/sign_config.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/$BRANCH/attestor/signingService/config.yaml
curl -o verulink_attestor/compose.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/$BRANCH/attestor/compose.yaml

# Update the chain_config.yaml with the user input using sed
echo -e "${GREEN}Updating configuration with user input...${NC}"
echo "Updating chain_config.yaml"
sed -i "s/<releaseIdentifier>_attestor_verulink_<yourCompanyIdentifier>/$ATTESTOR_NAME/g" $CHAIN_CONFIG_FILE
sed -i "s/<your_aleo_wallet_address>/$WALLET_ADDRESS/g" $CHAIN_CONFIG_FILE
sed -i "s/<your_ethereum_wallet_address>/$ETH_ADDRESS/g" $CHAIN_CONFIG_FILE
sed -i "s/username: \"username\"/username: \"$SIGN_USER\"/g" $CHAIN_CONFIG_FILE
sed -i "s/password: \"password\"/password: \"$SIGN_PASS\"/g" $CHAIN_CONFIG_FILE
sed -i "s|<collector_service_url>|$COLLECTOR_URL|g" $CHAIN_CONFIG_FILE
sed -i "s|<prometheus_pushgateway_url>|$PROMETHEUS_PUSHGW|g" $CHAIN_CONFIG_FILE

echo "Updating sign_config.yaml"
sed -i "s/<username_same_as_chainservice>/$SIGN_USER/g" $SIGN_CONFIG_FILE
sed -i "s/<password_same_as_chainservice>/$SIGN_PASS/g" $SIGN_CONFIG_FILE

echo "Updating compose.yaml"
sed -i "s/<tag>/$DOCKER_IMAGE_TAG/g" verulink_attestor/compose.yaml
sed -i "s|./chainService/config.yaml|./chain_config.yaml|g" verulink_attestor/compose.yaml
sed -i "s|./chainService/.mtls|./.mtls|g" verulink_attestor/compose.yaml
sed -i "s|./signingService/config.yaml|./sign_config.yaml|g" verulink_attestor/compose.yaml
sed -i "s|./signingService/secrets.yaml|./secrets.yaml|g" verulink_attestor/compose.yaml

# Add healthcheck to signing service
echo "Adding healthcheck to signing service..."
sed -i '/ports:/a\
    healthcheck:\
      test: ["CMD", "curl", "-f", "http://localhost:8080/sign"]\
      interval: 5s\
      timeout: 3s\
      retries: 10\
      start_period: 5s' verulink_attestor/compose.yaml

# Update depends_on condition for chainservice
echo "Updating service dependencies..."
sed -i 's/depends_on:/depends_on:\
      signingservice:\
        condition: service_healthy/' verulink_attestor/compose.yaml

# Update certificate paths
sed -i "s|/configs/.mtls/ca.cer|/configs/.mtls/$(basename "$CA_CERT_PATH")|g" $CHAIN_CONFIG_FILE
sed -i "s|/configs/.mtls/attestor1.crt|/configs/.mtls/$ATTESTOR_NAME.cer|g" $CHAIN_CONFIG_FILE
sed -i "s|/configs/.mtls/attestor1.key|/configs/.mtls/$ATTESTOR_NAME.key|g" $CHAIN_CONFIG_FILE

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

# Copy mTLS certificates into the .mtls directory
echo -e "${GREEN}Copying certificates to .mtls/ directory...${NC}"
cp "$CA_CERT_PATH" verulink_attestor/.mtls/$(basename "$CA_CERT_PATH")
cp "$ATTESTOR_CERT_PATH" verulink_attestor/.mtls/"$ATTESTOR_NAME.cer"
cp "$ATTESTOR_KEY_PATH" verulink_attestor/.mtls/"$ATTESTOR_NAME.key"

# Secure the .mtls directory
echo -e "${GREEN}Securing .mtls directory...${NC}"
chmod 750 verulink_attestor/.mtls
chmod 600 verulink_attestor/.mtls/"$ATTESTOR_NAME.key"


# Create docker-compose.yaml
echo -e "${GREEN}Creating compose.yaml...${NC}"


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

# # Install cosign
# if ! command -v cosign &> /dev/null; then
#     echo -e "${GREEN}Installing cosign...${NC}"
#     LATEST_VERSION=$(curl https://api.github.com/repos/sigstore/cosign/releases/latest | grep tag_name | cut -d : -f2 | tr -d "v\", ")
#     curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign_${LATEST_VERSION}_amd64.deb"
#     sudo dpkg -i cosign_${LATEST_VERSION}_amd64.deb || true
# fi

# # Verify docker image is signed
# echo -e "${GREEN}Verifying signing service image is signed...${NC}"
# cosign verify \
#   --certificate-identity "https://github.com/venture23-aleo/verulink/.github/workflows/docker-build-publish.yaml@refs/heads/$BRANCH" \
#   --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
#   venture23/verulink-attestor-sign:$DOCKER_IMAGE_TAG
# echo -e "${GREEN}Verifying chain service image is signed...${NC}"
# cosign verify \
#   --certificate-identity "https://github.com/venture23-aleo/verulink/.github/workflows/docker-build-publish.yaml@refs/heads/$BRANCH" \
#   --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
#   venture23/verulink-attestor-chain:$DOCKER_IMAGE_TAG

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