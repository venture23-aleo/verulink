#!/bin/bash
# secret_store.sh
# Interactive script to collect secrets and store them in AWS/GCP Secret Manager
#
# Note: To attach instance profile/service account to VM, run: make attach-instance-profile
#
# Security note: script writes a JSON file (attestor_secret.json) locally. Remove it after use.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# Configuration
OUTPUT_FILE="attestor_secret.json"
TEMP_FILE=$(mktemp)
TMP_POLICY_DOC=$(mktemp)
TMP_ASSUME_POLICY=$(mktemp)

cleanup() {
    rm -f "$TEMP_FILE" "$TMP_POLICY_DOC" "$TMP_ASSUME_POLICY"
    # Optionally remove the secret JSON file after storing - leaving for manual review
    # rm -f "$OUTPUT_FILE"
}
trap cleanup EXIT

# Print header
print_header() {
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo -e "${CYAN}${BOLD}  Verulink Attestor Secret Storage${NC}"
    echo -e "${CYAN}${BOLD}========================================${NC}"
    echo ""
}

# Print section header
print_section() {
    echo -e "\n${BLUE}${BOLD}>>> $1${NC}\n"
}

# Read masked input (shows xx for each character)
read_masked() {
    local prompt="$1"
    local var_name="$2"
    local value=""
    local char=""

    echo -n -e "${YELLOW}$prompt${NC} "

    if [[ -t 0 ]]; then
        local old_stty
        old_stty=$(stty -g 2>/dev/null) || true
        stty -echo -icanon time 0 min 0 2>/dev/null || stty -echo raw 2>/dev/null || true
    fi

    # Read char-by-char
    while true; do
        IFS= read -rsn1 char 2>/dev/null || true
        if [[ -z "$char" ]]; then
            # Enter pressed
            echo ""
            break
        fi

        # Backspace/delete
        if [[ "$char" == $'\177' || "$char" == $'\b' ]]; then
            if [[ ${#value} -gt 0 ]]; then
                value="${value%?}"
                echo -ne "\b\b  \b\b"
            fi
            continue
        fi

        # Ctrl+C
        if [[ "$char" == $'\x03' ]]; then
            if [[ -t 0 ]]; then stty "$old_stty" 2>/dev/null || true; fi
            echo ""
            exit 1
        fi

        # Skip other control characters
        local code
        if command -v od &>/dev/null; then
            code=$(echo -n "$char" | od -An -tu1 | tr -d ' ')
        else
            code=$(printf '%d' "'$char" 2>/dev/null || echo 0)
        fi
        if [[ -n "$code" && "$code" -lt 32 && "$code" != "9" ]]; then
            continue
        fi

        value+="$char"
        echo -n "xx"
    done

    if [[ -t 0 ]]; then stty "$old_stty" 2>/dev/null || true; fi
    eval "$var_name='$value'"
}

# Read regular input
read_input() {
    local prompt="$1"
    local var_name="$2"
    local default="${3-}"
    local value=""

    if [[ -n "$default" ]]; then
        echo -n -e "${YELLOW}$prompt${NC} ${CYAN}[$default]${NC}: "
    else
        echo -n -e "${YELLOW}$prompt${NC}: "
    fi

    read -r value || true
    if [[ -z "$value" && -n "$default" ]]; then
        value="$default"
    fi
    eval "$var_name='$(printf "%s" "$value")'"
}

# Read file path and validate
read_file_path() {
    local prompt="$1"
    local var_name="$2"
    local file_path=""

    while true; do
        echo -n -e "${YELLOW}$prompt${NC}: "
        read -r file_path || true

        if [[ -z "$file_path" ]]; then
            echo -e "${RED}Error: File path cannot be empty${NC}"
            continue
        fi

        file_path=$(eval echo "$file_path")

        if [[ ! -f "$file_path" ]]; then
            echo -e "${RED}Error: File does not exist: $file_path${NC}"
            continue
        fi

        eval "$var_name='$(printf "%s" "$file_path")'"
        echo -e "${GREEN}✓ File found: $file_path${NC}"
        break
    done
}

# Validate required fields
validate_secrets() {
    local missing=()

    [[ -z "${BSC_PRIVATE_KEY:-}" ]] && missing+=("BSC Private Key")
    [[ -z "${BSC_WALLET_ADDRESS:-}" ]] && missing+=("BSC Wallet Address")
    [[ -z "${ETHEREUM_PRIVATE_KEY:-}" ]] && missing+=("Ethereum Private Key")
    [[ -z "${ETHEREUM_WALLET_ADDRESS:-}" ]] && missing+=("Ethereum Wallet Address")
    [[ -z "${ALEO_PRIVATE_KEY:-}" ]] && missing+=("Aleo Private Key")
    [[ -z "${ALEO_WALLET_ADDRESS:-}" ]] && missing+=("Aleo Wallet Address")
    [[ -z "${SIGNING_SERVICE_USERNAME:-}" ]] && missing+=("Signing Service Username")
    [[ -z "${SIGNING_SERVICE_PASSWORD:-}" ]] && missing+=("Signing Service Password")
    [[ -z "${CA_CERT_FILE:-}" ]] && missing+=("CA Certificate File")
    [[ -z "${ATTESTOR_CERT_FILE:-}" ]] && missing+=("Attestor Certificate File")
    [[ -z "${ATTESTOR_KEY_FILE:-}" ]] && missing+=("Attestor Key File")

    if [[ ${#missing[@]} -gt 0 ]]; then
        echo -e "${RED}Error: Missing required fields:${NC}"
        for field in "${missing[@]}"; do
            echo -e "  - $field"
        done
        return 1
    fi
    return 0
}

# Read certificate/key content from file
read_file_content() {
    local file_path="$1"
    if [[ ! -f "$file_path" ]]; then
        echo -e "${RED}Error: File not found: $file_path${NC}"
        return 1
    fi
    cat "$file_path"
}

# Generate JSON file
generate_json() {
    print_section "Generating Secret JSON"

    echo -e "${CYAN}Reading certificate and key files...${NC}"
    local ca_cert
    local attestor_cert
    local attestor_key

    ca_cert=$(read_file_content "$CA_CERT_FILE") || return 1
    attestor_cert=$(read_file_content "$ATTESTOR_CERT_FILE") || return 1
    attestor_key=$(read_file_content "$ATTESTOR_KEY_FILE") || return 1

    export BSC_PRIVATE_KEY_VAR="$BSC_PRIVATE_KEY"
    export BSC_WALLET_ADDRESS_VAR="$BSC_WALLET_ADDRESS"
    export ETHEREUM_PRIVATE_KEY_VAR="$ETHEREUM_PRIVATE_KEY"
    export ETHEREUM_WALLET_ADDRESS_VAR="$ETHEREUM_WALLET_ADDRESS"
    export ALEO_PRIVATE_KEY_VAR="$ALEO_PRIVATE_KEY"
    export ALEO_WALLET_ADDRESS_VAR="$ALEO_WALLET_ADDRESS"
    export SIGNING_SERVICE_USERNAME_VAR="$SIGNING_SERVICE_USERNAME"
    export SIGNING_SERVICE_PASSWORD_VAR="$SIGNING_SERVICE_PASSWORD"

    python3 - <<PYEOF
import json, os, sys
ca_cert = """$(printf '%s' "$ca_cert")"""
attestor_cert = """$(printf '%s' "$attestor_cert")"""
attestor_key = """$(printf '%s' "$attestor_key")"""

secret = {
    "mtls": {
        "ca_certificate": ca_cert,
        "attestor_certificate": attestor_cert,
        "attestor_key": attestor_key
    },
    "signing_service": {
        "bsc_private_key": os.environ.get('BSC_PRIVATE_KEY_VAR', ''),
        "bsc_wallet_address": os.environ.get('BSC_WALLET_ADDRESS_VAR', ''),
        "ethereum_private_key": os.environ.get('ETHEREUM_PRIVATE_KEY_VAR', ''),
        "ethereum_wallet_address": os.environ.get('ETHEREUM_WALLET_ADDRESS_VAR', ''),
        "aleo_private_key": os.environ.get('ALEO_PRIVATE_KEY_VAR', ''),
        "aleo_wallet_address": os.environ.get('ALEO_WALLET_ADDRESS_VAR', ''),
        "signing_service_username": os.environ.get('SIGNING_SERVICE_USERNAME_VAR', ''),
        "signing_service_password": os.environ.get('SIGNING_SERVICE_PASSWORD_VAR', '')
    }
}

with open("$OUTPUT_FILE", "w") as f:
    json.dump(secret, f, indent=2)
print("✓ Secret JSON generated")
PYEOF

    unset BSC_PRIVATE_KEY_VAR BSC_WALLET_ADDRESS_VAR ETHEREUM_PRIVATE_KEY_VAR ETHEREUM_WALLET_ADDRESS_VAR ALEO_PRIVATE_KEY_VAR ALEO_WALLET_ADDRESS_VAR SIGNING_SERVICE_USERNAME_VAR SIGNING_SERVICE_PASSWORD_VAR

    if command -v jq &>/dev/null; then
        if ! jq empty "$OUTPUT_FILE" 2>/dev/null; then
            echo -e "${RED}✗ JSON validation failed${NC}"
            return 1
        fi
    fi

    echo -e "${GREEN}✓ Secret JSON generated: $OUTPUT_FILE${NC}"
    return 0
}

# Store to AWS Secrets Manager
store_to_aws() {
    print_section "Storing to AWS Secrets Manager"

    local secret_name=""
    case "$ENV" in
        devnet) secret_name="dev/verulink/attestor/secrets" ;;
        staging) secret_name="stg/verulink/attestor/secrets" ;;
        mainnet) secret_name="mainnet/verulink/attestor/secrets" ;;
        *) echo -e "${RED}Error: Invalid environment: $ENV${NC}"; return 1 ;;
    esac

    echo -e "${CYAN}Secret Name: $secret_name${NC}"
    echo -e "${CYAN}Region: $AWS_REGION${NC}"

    if ! command -v aws &>/dev/null; then
        echo -e "${RED}Error: AWS CLI not found. Install & configure it.${NC}"
        return 1
    fi

    # Check AWS credentials
    if ! aws sts get-caller-identity --region "$AWS_REGION" &>/dev/null; then
        echo -e "${RED}Error: AWS credentials not configured.${NC}"
        echo -e "${YELLOW}Please configure AWS credentials using one of:${NC}"
        echo -e "  ${CYAN}export AWS_ACCESS_KEY_ID=<your-access-key>${NC}"
        echo -e "  ${CYAN}export AWS_SECRET_ACCESS_KEY=<your-secret-key>${NC}"
        echo -e "  ${CYAN}export AWS_DEFAULT_REGION=$AWS_REGION${NC}"
        echo -e ""
        echo -e "Or configure AWS CLI:"
        echo -e "  ${CYAN}aws configure${NC}"
        echo -e "  ${CYAN}aws configure --profile <profile-name>${NC}"
        return 1
    fi

    # Get account id for ARN construction
    ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$AWS_REGION" 2>/dev/null || true)
    if [[ -z "$ACCOUNT_ID" ]]; then
        echo -e "${YELLOW}Warning: Unable to determine AWS account ID; some operations may still succeed if aws cli profile is configured.${NC}"
    fi

    # Check if secret exists
    if aws secretsmanager describe-secret --secret-id "$secret_name" --region "$AWS_REGION" &>/dev/null; then
        echo -e "${YELLOW}Secret already exists.${NC}"
        read_input "Update existing secret? (yes/no)" UPDATE_SECRET "no"
        if [[ "$UPDATE_SECRET" != "yes" ]]; then
            echo -e "${YELLOW}Skipping secret storage${NC}"
            return 0
        fi

        if aws secretsmanager put-secret-value --secret-id "$secret_name" --secret-string "file://$OUTPUT_FILE" --region "$AWS_REGION"; then
            echo -e "${GREEN}✓ Secret updated successfully${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to update secret${NC}"
            echo -e "${YELLOW}Please check:${NC}"
            echo -e "  - AWS credentials are correctly configured"
            echo -e "  - You have permissions to update secrets in region $AWS_REGION"
            return 1
        fi
    else
        if aws secretsmanager create-secret --name "$secret_name" --secret-string "file://$OUTPUT_FILE" --region "$AWS_REGION" --description "Verulink Attestor Combined Secrets ($ENV)"; then
            echo -e "${GREEN}✓ Secret created successfully${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to create secret${NC}"
            echo -e "${YELLOW}Please check:${NC}"
            echo -e "  - AWS credentials are correctly configured"
            echo -e "  - You have permissions to create secrets in region $AWS_REGION"
            echo -e ""
            echo -e "Configure credentials:"
            echo -e "  ${CYAN}export AWS_ACCESS_KEY_ID=<your-access-key>${NC}"
            echo -e "  ${CYAN}export AWS_SECRET_ACCESS_KEY=<your-secret-key>${NC}"
            echo -e "  ${CYAN}export AWS_DEFAULT_REGION=$AWS_REGION${NC}"
            return 1
        fi
    fi
}

# Store to GCP Secret Manager
store_to_gcp() {
    print_section "Storing to GCP Secret Manager"

    local secret_name=""
    case "$ENV" in
        devnet) secret_name="dev_verulink_attestor_secrets" ;;
        staging) secret_name="stg_verulink_attestor_secrets" ;;
        mainnet) secret_name="mainnet_verulink_attestor_secrets" ;;
        *) echo -e "${RED}Error: Invalid environment: $ENV${NC}"; return 1 ;;
    esac

    echo -e "${CYAN}Secret Name: $secret_name${NC}"
    echo -e "${CYAN}Project: $GCP_PROJECT${NC}"

    if ! command -v gcloud &>/dev/null; then
        echo -e "${RED}Error: gcloud CLI not found.${NC}"
        echo -e "${YELLOW}Please install gcloud CLI: https://cloud.google.com/sdk/docs/install${NC}"
        echo -e "${YELLOW}Then authenticate with one of:${NC}"
        echo -e "  ${CYAN}gcloud auth login${NC}                    # Interactive login"
        echo -e "  ${CYAN}gcloud auth activate-service-account --key-file=<key.json>${NC}  # Service account"
        return 1
    fi
    
    # Check if gcloud is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" 2>/dev/null | grep -q .; then
        echo -e "${RED}Error: gcloud CLI not authenticated.${NC}"
        echo -e "${YELLOW}Please authenticate with one of:${NC}"
        echo -e "  ${CYAN}gcloud auth login${NC}                    # Interactive login"
        echo -e "  ${CYAN}gcloud auth activate-service-account --key-file=<key.json>${NC}  # Service account"
        return 1
    fi

    # Check if secret exists
    if gcloud secrets describe "$secret_name" --project="$GCP_PROJECT" &>/dev/null 2>&1; then
        echo -e "${YELLOW}Secret already exists.${NC}"
        read_input "Add new version? (yes/no)" ADD_VERSION "no"
        if [[ "$ADD_VERSION" != "yes" ]]; then
            echo -e "${YELLOW}Skipping secret storage${NC}"
            return 0
        fi

        if gcloud secrets versions add "$secret_name" --project="$GCP_PROJECT" --data-file="$OUTPUT_FILE"; then
            echo -e "${GREEN}✓ Secret version added successfully${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to add secret version${NC}"
            return 1
        fi
    else
        # Use user-managed replication with specific location to comply with org policies
        if gcloud secrets create "$secret_name" --project="$GCP_PROJECT" --data-file="$OUTPUT_FILE" --replication-policy="user-managed" --locations="${GCP_REGION:-us-central1}"; then
            echo -e "${GREEN}✓ Secret created successfully${NC}"
            return 0
        else
            echo -e "${RED}✗ Failed to create secret${NC}"
            return 1
        fi
    fi
}

# ===== VM Identity (AWS Instance Profile / GCP Service Account) =====

configure_aws_instance_profile() {
    print_section "AWS Instance Profile Setup"

    read_input "Enter AWS EC2 Instance ID (e.g., i-0abcd1234efgh)" EC2_INSTANCE_ID ""
    if [[ -z "$EC2_INSTANCE_ID" ]]; then
        echo -e "${RED}Error: EC2 Instance ID is required${NC}"
        return 1
    fi

    ROLE_NAME="verulink-attestor-${ENV}-role"
    PROFILE_NAME="verulink-attestor-${ENV}-profile"

    # Secret ARN resource pattern
    SECRET_NAME=""
    case "$ENV" in
        devnet) SECRET_NAME="dev/verulink/attestor/secrets" ;;
        staging) SECRET_NAME="stg/verulink/attestor/secrets" ;;
        mainnet) SECRET_NAME="mainnet/verulink/attestor/secrets" ;;
    esac

    # Attempt to fetch account id if not already
    if [[ -z "${ACCOUNT_ID:-}" ]]; then
        ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$AWS_REGION" 2>/dev/null || true)
    fi

    if [[ -z "$ACCOUNT_ID" ]]; then
        echo -e "${YELLOW}Warning: Could not determine AWS account id; policy will use wildcard for account in resource ARN.${NC}"
        SECRET_ARN="arn:aws:secretsmanager:${AWS_REGION}:*:secret:${SECRET_NAME}*"
    else
        SECRET_ARN="arn:aws:secretsmanager:${AWS_REGION}:${ACCOUNT_ID}:secret:${SECRET_NAME}*"
    fi

    # Create assume role policy file
    cat > "$TMP_ASSUME_POLICY" <<EOAP
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "ec2.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOAP

    echo -e "${CYAN}Creating IAM Role: $ROLE_NAME (if not exists)${NC}"
    if ! aws iam get-role --role-name "$ROLE_NAME" &>/dev/null; then
        aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file://"$TMP_ASSUME_POLICY" >/dev/null
        echo -e "${GREEN}✓ Created role $ROLE_NAME${NC}"
    else
        echo -e "${YELLOW}Role $ROLE_NAME already exists${NC}"
    fi

    # Create inline policy allowing specific secret actions
    cat > "$TMP_POLICY_DOC" <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:PutSecretValue"
      ],
      "Resource": "$SECRET_ARN"
    }
  ]
}
EOF

    echo -e "${CYAN}Attaching inline policy to role...${NC}"
    aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name "verulink-attestor-secret-access" --policy-document file://"$TMP_POLICY_DOC" >/dev/null

    echo -e "${CYAN}Creating instance profile if missing...${NC}"
    if ! aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" &>/dev/null; then
        aws iam create-instance-profile --instance-profile-name "$PROFILE_NAME" >/dev/null
    fi

    # Add role to instance profile if not already present
    if ! aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" | grep -q "$ROLE_NAME"; then
        aws iam add-role-to-instance-profile --instance-profile-name "$PROFILE_NAME" --role-name "$ROLE_NAME" >/dev/null || true
    fi

    echo -e "${CYAN}Associating instance profile to EC2 instance...${NC}"
    aws ec2 associate-iam-instance-profile --instance-id "$EC2_INSTANCE_ID" --iam-instance-profile Name="$PROFILE_NAME" >/dev/null || {
        echo -e "${RED}✗ Failed to associate instance profile. Ensure the instance is in a state that allows association.${NC}"
        return 1
    }

    echo -e "${GREEN}✓ AWS Instance Profile attached successfully${NC}"
    return 0
}

configure_gcp_vm_identity() {
    print_section "GCP Service Account Setup"

    SA_NAME="verulink-attestor-${ENV}"
    SA_EMAIL="${SA_NAME}@${GCP_PROJECT}.iam.gserviceaccount.com"

    SECRET_NAME=""
    case "$ENV" in
        devnet) SECRET_NAME="dev_verulink_attestor_secrets" ;;
        staging) SECRET_NAME="stg_verulink_attestor_secrets" ;;
        mainnet) SECRET_NAME="mainnet_verulink_attestor_secrets" ;;
    esac

    if ! command -v gcloud &>/dev/null; then
        echo -e "${RED}Error: gcloud CLI not found${NC}"
        return 1
    fi

    echo -e "${CYAN}Creating service account (if not exists): $SA_NAME${NC}"
    if ! gcloud iam service-accounts describe "$SA_EMAIL" --project="$GCP_PROJECT" &>/dev/null 2>&1; then
        gcloud iam service-accounts create "$SA_NAME" --project="$GCP_PROJECT" >/dev/null
        echo -e "${GREEN}✓ Service account created: $SA_EMAIL${NC}"
    else
        echo -e "${YELLOW}Service account already exists: $SA_EMAIL${NC}"
    fi

    echo -e "${CYAN}Granting Secret Manager access to the service account...${NC}"
    # Grant the Secret Accessor role on the specific secret
    if gcloud secrets add-iam-policy-binding "$SECRET_NAME" \
        --project="$GCP_PROJECT" \
        --member="serviceAccount:${SA_EMAIL}" \
        --role="roles/secretmanager.secretAccessor"; then
      echo -e "${GREEN}✓ Secret accessor role granted${NC}"
    else
      echo -e "${RED}✗ Failed to grant secret accessor role${NC}"
      return 1
    fi

    # Note: Project-level admin role is not needed - secret accessor role on the specific secret is sufficient
    
    echo -e "${GREEN}✓ Service account configured successfully${NC}"
    echo -e "${YELLOW}Note: To attach this service account to a VM, run: make attach-instance-profile${NC}"
    return 0
}

# Main function
main() {
    print_header

    # Step 1: Select cloud provider
    print_section "Cloud Provider Selection"
    echo -e "${CYAN}1. AWS Secrets Manager${NC}"
    echo -e "${CYAN}2. GCP Secret Manager${NC}"
    read_input "Select cloud provider (1 or 2)" PROVIDER_CHOICE "1"

    case "$PROVIDER_CHOICE" in
        1)
            CLOUD_PROVIDER="aws"
            read_input "AWS Region" AWS_REGION "us-east-1"
            # optional AWS_PROFILE environment can be used if configured externally
            ;;
        2)
            CLOUD_PROVIDER="gcp"
            read_input "GCP Project ID" GCP_PROJECT ""
            if [[ -z "$GCP_PROJECT" ]]; then
                echo -e "${RED}Error: GCP Project ID is required${NC}"
                exit 1
            fi
            read_input "GCP Region" GCP_REGION "us-central1"
            ;;
        *)
            echo -e "${RED}Error: Invalid choice${NC}"
            exit 1
            ;;
    esac

    # Step 2: Select environment
    print_section "Environment Selection"
    echo -e "${CYAN}1. Devnet${NC}"
    echo -e "${CYAN}2. Staging${NC}"
    echo -e "${CYAN}3. Mainnet${NC}"
    read_input "Select environment (1, 2, or 3)" ENV_CHOICE "1"

    case "$ENV_CHOICE" in
        1) ENV="devnet" ;;
        2) ENV="staging" ;;
        3) ENV="mainnet" ;;
        *) echo -e "${RED}Error: Invalid choice${NC}"; exit 1 ;;
    esac

    echo -e "${GREEN}Selected: $ENV environment on $CLOUD_PROVIDER${NC}"

    # Step 3: Collect signing service secrets
    print_section "Signing Service Secrets"
    echo -e "${YELLOW}Enter signing service credentials (private keys will be masked)${NC}"

    read_masked "BSC Private Key (0x...)" BSC_PRIVATE_KEY
    read_input "BSC Wallet Address (0x...)" BSC_WALLET_ADDRESS ""
    read_masked "Ethereum Private Key (0x...)" ETHEREUM_PRIVATE_KEY
    read_input "Ethereum Wallet Address (0x...)" ETHEREUM_WALLET_ADDRESS ""
    read_masked "Aleo Private Key (APrivateKey1...)" ALEO_PRIVATE_KEY
    read_input "Aleo Wallet Address (aleo1...)" ALEO_WALLET_ADDRESS ""
    read_input "Signing Service Username" SIGNING_SERVICE_USERNAME ""
    read_masked "Signing Service Password" SIGNING_SERVICE_PASSWORD

    # Step 4: Collect mTLS certificate files
    print_section "mTLS Certificates and Keys"
    echo -e "${YELLOW}Enter paths to mTLS certificate and key files${NC}"

    read_file_path "CA Certificate File Path" CA_CERT_FILE
    read_file_path "Attestor Certificate File Path" ATTESTOR_CERT_FILE
    read_file_path "Attestor Key File Path" ATTESTOR_KEY_FILE

    # Step 5: Validate
    print_section "Validation"
    if ! validate_secrets; then
        echo -e "${RED}Validation failed. Please check your inputs.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ All required fields provided${NC}"

    # Step 6: Generate JSON
    if ! generate_json; then
        echo -e "${RED}Failed to generate secret JSON${NC}"
        exit 1
    fi

    # Step 7: Confirm before storing
    print_section "Confirmation"
    echo -e "${YELLOW}Ready to store secret to $CLOUD_PROVIDER${NC}"
    echo -e "${CYAN}Environment: $ENV${NC}"
    echo -e "${CYAN}Output file: $OUTPUT_FILE${NC}"
    read_input "Proceed with storage? (yes/no)" CONFIRM "no"

    if [[ "$CONFIRM" != "yes" ]]; then
        echo -e "${YELLOW}Storage cancelled. JSON file saved at: $OUTPUT_FILE${NC}"
        exit 0
    fi

    # Step 8: Store to cloud
    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        if ! store_to_aws; then
            echo -e "${RED}Failed to store secret to AWS${NC}"
            exit 1
        fi
    else
        if ! store_to_gcp; then
            echo -e "${RED}Failed to store secret to GCP${NC}"
            exit 1
        fi
    fi

    # Note: To attach instance profile/service account to VM, run: make attach-instance-profile

    # Success
    echo ""
    echo -e "${GREEN}${BOLD}========================================${NC}"
    echo -e "${GREEN}${BOLD}  Secret Stored Successfully!${NC}"
    echo -e "${GREEN}${BOLD}========================================${NC}"
    echo ""
    echo -e "${CYAN}Secret JSON file: $OUTPUT_FILE${NC}"
    echo -e "${YELLOW}Note: Consider removing the JSON file after verification for security${NC}"
}

# Run main
main "$@"
