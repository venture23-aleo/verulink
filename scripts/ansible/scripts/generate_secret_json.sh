#!/bin/bash
# generate_secret_json.sh
# Helper script to generate attestor_secret.json from Ansible variables

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
VARS_FILE=""
OUTPUT_FILE="attestor_secret.json"
ENV=""

usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Generate attestor_secret.json from Ansible variables file.

Options:
    -f, --vars-file FILE    Path to Ansible vars file (e.g., devnet_vars.yml)
    -o, --output FILE       Output JSON file (default: attestor_secret.json)
    -e, --env ENV           Environment name (devnet, staging, mainnet)
    -h, --help              Show this help message

Examples:
    # Generate from devnet_vars.yml
    $0 -f devnet_vars.yml -e devnet

    # Generate from staging_vars.yml with custom output
    $0 -f staging_vars.yml -o staging_secret.json -e staging

EOF
}

# Check if jq is installed
check_dependencies() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}Error: jq is not installed${NC}"
        echo "Install it with:"
        echo "  macOS: brew install jq"
        echo "  Ubuntu/Debian: sudo apt-get install jq"
        echo "  RHEL/CentOS: sudo yum install jq"
        exit 1
    fi

    if ! command -v python3 &> /dev/null; then
        echo -e "${RED}Error: python3 is not installed${NC}"
        exit 1
    fi
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--vars-file)
            VARS_FILE="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
            ;;
        -e|--env)
            ENV="$2"
            shift 2
            ;;
        -h|--help)
            usage
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            usage
            exit 1
            ;;
    esac
done

# Validate inputs
if [[ -z "$VARS_FILE" ]]; then
    echo -e "${RED}Error: vars-file is required${NC}"
    usage
    exit 1
fi

if [[ ! -f "$VARS_FILE" ]]; then
    echo -e "${RED}Error: Vars file not found: $VARS_FILE${NC}"
    exit 1
fi

check_dependencies

echo -e "${GREEN}Generating secret JSON from: $VARS_FILE${NC}"

# Use Python to parse YAML and generate JSON
python3 << EOF
import yaml
import json
import base64
import sys
import os

# Read vars file
with open('$VARS_FILE', 'r') as f:
    vars_data = yaml.safe_load(f)

# Extract variables
ca_cert_b64 = vars_data.get('ca_certificate_base64', '')
attestor_cert_b64 = vars_data.get('attestor_certificate_base64', '')
attestor_key_b64 = vars_data.get('attestor_key_base64', '')
bsc_private_key = vars_data.get('bsc_private_key', '')
bsc_wallet_address = vars_data.get('bsc_wallet_address', '')
aleo_private_key = vars_data.get('aleo_private_key', '')
aleo_wallet_address = vars_data.get('aleo_wallet_address', '')

# Validate required fields
required_fields = {
    'ca_certificate_base64': ca_cert_b64,
    'attestor_certificate_base64': attestor_cert_b64,
    'attestor_key_base64': attestor_key_b64,
    'bsc_private_key': bsc_private_key,
    'bsc_wallet_address': bsc_wallet_address,
    'aleo_private_key': aleo_private_key,
    'aleo_wallet_address': aleo_wallet_address
}

missing = [k for k, v in required_fields.items() if not v]
if missing:
    print(f"Error: Missing required fields: {', '.join(missing)}", file=sys.stderr)
    sys.exit(1)

# Decode base64 certificates
try:
    ca_cert = base64.b64decode(ca_cert_b64).decode('utf-8')
    attestor_cert = base64.b64decode(attestor_cert_b64).decode('utf-8')
    attestor_key = base64.b64decode(attestor_key_b64).decode('utf-8')
except Exception as e:
    print(f"Error decoding base64 certificates: {e}", file=sys.stderr)
    sys.exit(1)

# Create secret structure
secret = {
    "mtls": {
        "ca_certificate": ca_cert,
        "attestor_certificate": attestor_cert,
        "attestor_key": attestor_key
    },
    "signing_service": {
        "ethereum_private_key": bsc_private_key,
        "ethereum_wallet_address": bsc_wallet_address,
        "aleo_private_key": aleo_private_key,
        "aleo_wallet_address": aleo_wallet_address
    }
}

# Write to file
output_file = '$OUTPUT_FILE'
with open(output_file, 'w') as f:
    json.dump(secret, f, indent=2)

print(f"Successfully generated: {output_file}")
EOF

if [[ $? -eq 0 ]]; then
    echo -e "${GREEN}✓ Secret JSON generated successfully: $OUTPUT_FILE${NC}"
    
    # Validate JSON
    if jq empty "$OUTPUT_FILE" 2>/dev/null; then
        echo -e "${GREEN}✓ JSON is valid${NC}"
        
        # Show secret name based on environment
        if [[ -n "$ENV" ]]; then
            case "$ENV" in
                devnet)
                    echo -e "${YELLOW}AWS Secret Name: dev/verulink/attestor/secrets${NC}"
                    echo -e "${YELLOW}GCP Secret Name: dev_verulink_attestor_secrets${NC}"
                    ;;
                staging)
                    echo -e "${YELLOW}AWS Secret Name: stg/verulink/attestor/secrets${NC}"
                    echo -e "${YELLOW}GCP Secret Name: stg_verulink_attestor_secrets${NC}"
                    ;;
                mainnet)
                    echo -e "${YELLOW}AWS Secret Name: mainnet/verulink/attestor/secrets${NC}"
                    echo -e "${YELLOW}GCP Secret Name: mainnet_verulink_attestor_secrets${NC}"
                    ;;
            esac
        fi
    else
        echo -e "${RED}✗ JSON validation failed${NC}"
        exit 1
    fi
else
    echo -e "${RED}✗ Failed to generate secret JSON${NC}"
    exit 1
fi

