#!/bin/bash
# vm_identity.sh
# Create and attach AWS Instance Profile or GCP Service Account to a target VM.
# Supports interactive and non-interactive flags.
#
# Non-interactive examples:
# AWS:
#   ./vm_identity.sh --cloud aws --env dev --region us-west-2 --instance-id i-0abcd1234
# GCP:
#   ./vm_identity.sh --cloud gcp --env dev --project myproj --gcp-vm my-vm --gcp-zone us-central1-a

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

# Defaults
CLOUD_PROVIDER=""
ENV=""
AWS_REGION=""
GCP_PROJECT=""
EC2_INSTANCE_ID=""
GCP_VM_NAME=""
GCP_ZONE=""

usage() {
  cat <<EOF
Usage: $0 [flags]
Flags:
  --cloud [aws|gcp]           : cloud provider (interactive if omitted)
  --env [dev|staging|prod]    : environment shorthand (dev/staging/prod) -> maps to devnet/staging/mainnet
  --region <aws-region>
  --instance-id <i-...>       : AWS EC2 instance id
  --project <gcp-project>     : GCP project id
  --gcp-vm <vm-name>
  --gcp-zone <zone>
  -h, --help
EOF
  exit 1
}

# map env short to internal env names
map_env() {
  case "$1" in
    dev|devnet) ENV="devnet" ;;
    staging) ENV="staging" ;;
    prod|production|mainnet) ENV="mainnet" ;;
    *) echo -e "${YELLOW}Unknown env '$1', defaulting to devnet${NC}" ; ENV="devnet" ;;
  esac
}

# parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --cloud) CLOUD_PROVIDER="$2"; shift 2 ;;
    --env) map_env "$2"; shift 2 ;;
    --region) AWS_REGION="$2"; shift 2 ;;
    --instance-id) EC2_INSTANCE_ID="$2"; shift 2 ;;
    --project) GCP_PROJECT="$2"; shift 2 ;;
    --gcp-vm) GCP_VM_NAME="$2"; shift 2 ;;
    --gcp-zone) GCP_ZONE="$2"; shift 2 ;;
    -h|--help) usage ;;
    *) echo -e "${YELLOW}Unknown arg: $1${NC}"; usage ;;
  esac
done

prompt_select_cloud() {
  echo -e "${CYAN}1) AWS${NC}"
  echo -e "${CYAN}2) GCP${NC}"
  read -erp "Select cloud (1 or 2) [1]: " choice
  choice=${choice:-1}
  if [[ "$choice" == "1" ]]; then CLOUD_PROVIDER="aws"; else CLOUD_PROVIDER="gcp"; fi
}

prompt_env() {
  echo -e "${CYAN}1) devnet (dev)${NC}"
  echo -e "${CYAN}2) staging${NC}"
  echo -e "${CYAN}3) mainnet (prod)${NC}"
  read -erp "Choose environment (1/2/3) [1]: " e; e=${e:-1}
  case "$e" in 1) ENV="devnet" ;; 2) ENV="staging" ;; 3) ENV="mainnet" ;; esac
}

# AWS flow
aws_flow() {
  if ! command -v aws &>/dev/null; then echo -e "${RED}aws CLI not found${NC}"; exit 1; fi
  if [[ -z "$AWS_REGION" ]]; then read -erp "AWS Region [us-east-1]: " AWS_REGION; AWS_REGION=${AWS_REGION:-us-east-1}; fi
  if [[ -z "$EC2_INSTANCE_ID" ]]; then read -erp "EC2 Instance ID (i-...): " EC2_INSTANCE_ID; fi
  if [[ -z "$EC2_INSTANCE_ID" ]]; then echo -e "${RED}EC2 instance id required${NC}"; exit 1; fi

  # Determine default role and profile names
  DEFAULT_ROLE_NAME="verulink-attestor-${ENV}-role"
  DEFAULT_PROFILE_NAME="verulink-attestor-${ENV}-profile"

  # Confirm role name
  echo -e "${CYAN}Default Role Name: $DEFAULT_ROLE_NAME${NC}"
  echo -e "${YELLOW}Press Enter to use default, or enter a custom role name:${NC}"
  read -erp "Role Name [$DEFAULT_ROLE_NAME]: " ROLE_NAME_INPUT
  ROLE_NAME_INPUT=${ROLE_NAME_INPUT:-$DEFAULT_ROLE_NAME}
  
  if [[ "$ROLE_NAME_INPUT" == "$DEFAULT_ROLE_NAME" ]]; then
    ROLE_NAME="$DEFAULT_ROLE_NAME"
    echo -e "${GREEN}✓ Using default role name: $ROLE_NAME${NC}"
  else
    ROLE_NAME="$ROLE_NAME_INPUT"
    echo -e "${GREEN}✓ Using custom role name: $ROLE_NAME${NC}"
  fi
  echo ""

  # Confirm profile name
  echo -e "${CYAN}Default Profile Name: $DEFAULT_PROFILE_NAME${NC}"
  echo -e "${YELLOW}Press Enter to use default, or enter a custom profile name:${NC}"
  read -erp "Profile Name [$DEFAULT_PROFILE_NAME]: " PROFILE_NAME_INPUT
  PROFILE_NAME_INPUT=${PROFILE_NAME_INPUT:-$DEFAULT_PROFILE_NAME}
  
  if [[ "$PROFILE_NAME_INPUT" == "$DEFAULT_PROFILE_NAME" ]]; then
    PROFILE_NAME="$DEFAULT_PROFILE_NAME"
    echo -e "${GREEN}✓ Using default profile name: $PROFILE_NAME${NC}"
  else
    PROFILE_NAME="$PROFILE_NAME_INPUT"
    echo -e "${GREEN}✓ Using custom profile name: $PROFILE_NAME${NC}"
  fi
  echo ""

  # secret resource pattern (AWS secret name used earlier) - determine default
  DEFAULT_SECRET_NAME=""
  case "$ENV" in
    devnet) DEFAULT_SECRET_NAME="dev/verulink/attestor/secrets" ;;
    staging) DEFAULT_SECRET_NAME="stg/verulink/attestor/secrets" ;;
    mainnet) DEFAULT_SECRET_NAME="mainnet/verulink/attestor/secrets" ;;
  esac

  # Confirm secret name before attaching
  echo -e "${CYAN}Default Secret Name: $DEFAULT_SECRET_NAME${NC}"
  echo -e "${CYAN}Region: $AWS_REGION${NC}"
  echo ""
  echo -e "${YELLOW}Press Enter to use default, or enter a custom secret name:${NC}"
  read -erp "Secret Name [$DEFAULT_SECRET_NAME]: " SECRET_NAME_INPUT
  SECRET_NAME_INPUT=${SECRET_NAME_INPUT:-$DEFAULT_SECRET_NAME}
  
  if [[ "$SECRET_NAME_INPUT" == "$DEFAULT_SECRET_NAME" ]]; then
    SECRET_NAME="$DEFAULT_SECRET_NAME"
    echo -e "${GREEN}✓ Using default secret name: $SECRET_NAME${NC}"
  else
    SECRET_NAME="$SECRET_NAME_INPUT"
    echo -e "${GREEN}✓ Using custom secret name: $SECRET_NAME${NC}"
  fi
  echo ""

  ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text --region "$AWS_REGION" 2>/dev/null || true)
  if [[ -z "$ACCOUNT_ID" ]]; then
    echo -e "${YELLOW}Warning: cannot determine account id; ARN will use wildcard for account${NC}"
    SECRET_ARN="arn:aws:secretsmanager:${AWS_REGION}:*:secret:${SECRET_NAME}*"
  else
    SECRET_ARN="arn:aws:secretsmanager:${AWS_REGION}:${ACCOUNT_ID}:secret:${SECRET_NAME}*"
  fi

  # create assume role policy
  ASSUME_JSON=$(mktemp); trap 'rm -f "$ASSUME_JSON"' EXIT
  cat >"$ASSUME_JSON" <<EOF
{
  "Version":"2012-10-17",
  "Statement":[{"Effect":"Allow","Principal":{"Service":"ec2.amazonaws.com"},"Action":"sts:AssumeRole"}]
}
EOF

  if aws iam get-role --role-name "$ROLE_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}Role $ROLE_NAME exists${NC}"
  else
    echo -e "${CYAN}Creating role $ROLE_NAME...${NC}"
    aws iam create-role --role-name "$ROLE_NAME" --assume-role-policy-document file://"${ASSUME_JSON}"
    echo -e "${GREEN}Created role${NC}"
  fi

  # Confirm policy name before attaching
  DEFAULT_POLICY_NAME="verulink-attestor-secret-access"
  echo -e "${CYAN}Default Policy Name: $DEFAULT_POLICY_NAME${NC}"
  echo -e "${YELLOW}Press Enter to use default, or enter a custom policy name:${NC}"
  read -erp "Policy Name [$DEFAULT_POLICY_NAME]: " POLICY_NAME_INPUT
  POLICY_NAME_INPUT=${POLICY_NAME_INPUT:-$DEFAULT_POLICY_NAME}
  
  if [[ "$POLICY_NAME_INPUT" == "$DEFAULT_POLICY_NAME" ]]; then
    POLICY_NAME="$DEFAULT_POLICY_NAME"
    echo -e "${GREEN}✓ Using default policy name: $POLICY_NAME${NC}"
  else
    POLICY_NAME="$POLICY_NAME_INPUT"
    echo -e "${GREEN}✓ Using custom policy name: $POLICY_NAME${NC}"
  fi
  echo ""

  POLICY_JSON=$(mktemp); TMP_POLICY="$POLICY_JSON"; TMP_FILES+=("$TMP_POLICY")
  cat >"$POLICY_JSON" <<EOF
{
  "Version":"2012-10-17",
  "Statement":[
    {
      "Effect":"Allow",
      "Action":[
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret",
        "secretsmanager:PutSecretValue"
      ],
      "Resource":"$SECRET_ARN"
    }
  ]
}
EOF

  echo -e "${CYAN}Attaching inline policy to role...${NC}"
  aws iam put-role-policy --role-name "$ROLE_NAME" --policy-name "$POLICY_NAME" --policy-document file://"$POLICY_JSON"

  echo -e "${CYAN}Ensure instance profile exists...${NC}"
  if aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" >/dev/null 2>&1; then
    echo -e "${YELLOW}Instance profile exists${NC}"
  else
    aws iam create-instance-profile --instance-profile-name "$PROFILE_NAME"
    echo -e "${GREEN}Created instance profile${NC}"
  fi

#   # Attach role to instance profile (idempotent)
#   if aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" | grep -q "$ROLE_NAME"; then
#     echo -e "${YELLOW}Role already associated with instance profile${NC}"
#   else
#     aws iam add-role-to-instance-profile --instance-profile-name "$PROFILE_NAME" --role-name "$ROLE_NAME" || true
#   fi
  echo -e "${CYAN}Waiting for instance profile to be ready...${NC}"
  sleep 10

  # Check if instance profile already has a role attached
  EXISTING_ROLE=$(aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" --query 'InstanceProfile.Roles[0].RoleName' --output text 2>/dev/null || echo "")
  
  if [[ -n "$EXISTING_ROLE" && "$EXISTING_ROLE" != "None" ]]; then
    if [[ "$EXISTING_ROLE" == "$ROLE_NAME" ]]; then
      echo -e "${GREEN}✓ Role $ROLE_NAME already attached to instance profile${NC}"
    else
      echo -e "${YELLOW}Instance profile already has role: $EXISTING_ROLE${NC}"
      echo -e "${CYAN}Removing existing role to attach new role: $ROLE_NAME${NC}"
      aws iam remove-role-from-instance-profile \
          --instance-profile-name "$PROFILE_NAME" \
          --role-name "$EXISTING_ROLE" || {
          echo -e "${RED}✗ Failed to remove existing role. You may need to remove it manually.${NC}"
          return 1
      }
      echo -e "${GREEN}✓ Removed existing role${NC}"
      sleep 2
      
      # Now attach the new role
      echo -e "${CYAN}Attaching role $ROLE_NAME to instance profile...${NC}"
      aws iam add-role-to-instance-profile \
          --instance-profile-name "$PROFILE_NAME" \
          --role-name "$ROLE_NAME" || {
          echo -e "${YELLOW}Retrying role attach in 5s...${NC}"
          sleep 5
          aws iam add-role-to-instance-profile \
              --instance-profile-name "$PROFILE_NAME" \
              --role-name "$ROLE_NAME" || {
              echo -e "${RED}✗ Failed to attach role to instance profile${NC}"
              return 1
          }
      }
      echo -e "${GREEN}✓ Role attached successfully${NC}"
    fi
  else
    # No role attached, attach the new role
    echo -e "${CYAN}Attaching role to instance profile...${NC}"
    aws iam add-role-to-instance-profile \
        --instance-profile-name "$PROFILE_NAME" \
        --role-name "$ROLE_NAME" || {
        echo -e "${YELLOW}Retrying role attach in 5s...${NC}"
        sleep 5
        aws iam add-role-to-instance-profile \
            --instance-profile-name "$PROFILE_NAME" \
            --role-name "$ROLE_NAME" || {
            echo -e "${RED}✗ Failed to attach role to instance profile${NC}"
            return 1
        }
    }
    echo -e "${GREEN}✓ Role attached successfully${NC}"
  fi

  # Check if the current instance already has an instance profile associated
  echo -e "${CYAN}Checking existing instance profile associations...${NC}"
  EXISTING_ASSOCIATION_ID=$(aws ec2 describe-iam-instance-profile-associations \
    --filters "Name=instance-id,Values=$EC2_INSTANCE_ID" \
    --query 'IamInstanceProfileAssociations[0].AssociationId' \
    --output text 2>/dev/null || echo "")
  
  if [[ -n "$EXISTING_ASSOCIATION_ID" && "$EXISTING_ASSOCIATION_ID" != "None" ]]; then
    EXISTING_PROFILE_ARN=$(aws ec2 describe-iam-instance-profile-associations \
      --filters "Name=instance-id,Values=$EC2_INSTANCE_ID" \
      --query 'IamInstanceProfileAssociations[0].IamInstanceProfile.Arn' \
      --output text 2>/dev/null || echo "")
    
    if [[ -n "$EXISTING_PROFILE_ARN" && "$EXISTING_PROFILE_ARN" != "None" ]]; then
      EXISTING_PROFILE_NAME=$(echo "$EXISTING_PROFILE_ARN" | awk -F'/' '{print $NF}')
      EXISTING_STATE=$(aws ec2 describe-iam-instance-profile-associations \
        --filters "Name=instance-id,Values=$EC2_INSTANCE_ID" \
        --query 'IamInstanceProfileAssociations[0].State' \
        --output text 2>/dev/null || echo "")
      
      if [[ "$EXISTING_PROFILE_NAME" == "$PROFILE_NAME" ]]; then
        echo -e "${GREEN}✓ Instance profile $PROFILE_NAME already associated with this instance (state: $EXISTING_STATE)${NC}"
        return 0
      else
        echo -e "${YELLOW}Instance $EC2_INSTANCE_ID already has instance profile: $EXISTING_PROFILE_NAME (state: $EXISTING_STATE)${NC}"
        echo -e "${CYAN}Disassociating existing instance profile...${NC}"
        
        # Disassociate the existing profile
        if aws ec2 disassociate-iam-instance-profile --association-id "$EXISTING_ASSOCIATION_ID" >/dev/null 2>&1; then
          echo -e "${GREEN}✓ Disassociated existing instance profile${NC}"
          
          # Wait for disassociation to complete
          echo -e "${CYAN}Waiting for disassociation to complete...${NC}"
          MAX_WAIT=30
          WAIT_COUNT=0
          while [[ $WAIT_COUNT -lt $MAX_WAIT ]]; do
            CURRENT_ASSOC=$(aws ec2 describe-iam-instance-profile-associations \
              --filters "Name=instance-id,Values=$EC2_INSTANCE_ID" \
              --query 'IamInstanceProfileAssociations[0].AssociationId' \
              --output text 2>/dev/null || echo "")
            
            if [[ -z "$CURRENT_ASSOC" || "$CURRENT_ASSOC" == "None" ]]; then
              echo -e "${GREEN}✓ Disassociation complete${NC}"
              break
            fi
            
            sleep 1
            WAIT_COUNT=$((WAIT_COUNT + 1))
            echo -n "."
          done
          echo ""
          
          if [[ $WAIT_COUNT -ge $MAX_WAIT ]]; then
            echo -e "${YELLOW}Warning: Disassociation may still be in progress. Waiting additional 5 seconds...${NC}"
            sleep 5
          fi
        else
          echo -e "${RED}✗ Failed to disassociate existing instance profile${NC}"
          echo -e "${YELLOW}You may need to disassociate it manually:${NC}"
          echo -e "${CYAN}aws ec2 disassociate-iam-instance-profile --association-id $EXISTING_ASSOCIATION_ID${NC}"
          return 1
        fi
      fi
    fi
  fi

  # Check if the instance profile is associated with other instances
  # Get the instance profile ARN first
  PROFILE_ARN=$(aws iam get-instance-profile --instance-profile-name "$PROFILE_NAME" --query 'InstanceProfile.Arn' --output text 2>/dev/null || echo "")
  
  if [[ -n "$PROFILE_ARN" ]]; then
    OTHER_ASSOCIATIONS=$(aws ec2 describe-iam-instance-profile-associations \
      --filters "Name=iam-instance-profile.arn,Values=$PROFILE_ARN" \
      --query 'IamInstanceProfileAssociations[?InstanceId!=`'"$EC2_INSTANCE_ID"'`].InstanceId' \
      --output text 2>/dev/null || echo "")
    
    if [[ -n "$OTHER_ASSOCIATIONS" ]]; then
      OTHER_INSTANCES=$(echo "$OTHER_ASSOCIATIONS" | tr '\t' '\n' | head -5)
      echo -e "${YELLOW}⚠ Warning: Instance profile $PROFILE_NAME is already associated with other instance(s):${NC}"
      echo "$OTHER_INSTANCES" | while read -r inst; do
        [[ -n "$inst" ]] && echo -e "  ${CYAN}- $inst${NC}"
      done
      echo ""
      echo -e "${YELLOW}Each machine should typically have its own unique instance profile.${NC}"
      echo -e "${CYAN}Do you want to associate this profile with instance $EC2_INSTANCE_ID anyway? (yes/no)${NC}"
      read -erp "Confirm [no]: " CONFIRM_ASSOCIATE
      CONFIRM_ASSOCIATE=${CONFIRM_ASSOCIATE:-no}
      
      if [[ "$CONFIRM_ASSOCIATE" != "yes" && "$CONFIRM_ASSOCIATE" != "y" ]]; then
        echo -e "${YELLOW}Association cancelled.${NC}"
        echo -e "${CYAN}Consider using a unique profile name for this instance, e.g.: ${PROFILE_NAME}-$(echo $EC2_INSTANCE_ID | tr -d 'i-')${NC}"
        return 1
      fi
      echo -e "${CYAN}Proceeding to associate with instance $EC2_INSTANCE_ID...${NC}"
    fi
  fi

  echo -e "${CYAN}Associating instance profile to EC2 instance...${NC}"
  if aws ec2 associate-iam-instance-profile --instance-id "$EC2_INSTANCE_ID" --iam-instance-profile Name="$PROFILE_NAME" >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Instance profile associated successfully${NC}"
  else
    echo -e "${RED}✗ Failed to associate instance profile${NC}"
    echo -e "${YELLOW}Possible reasons:${NC}"
    echo -e "  - Instance is not in a state that allows association (must be running or stopped)"
    echo -e "  - Instance already has an instance profile associated (check above)"
    echo -e "  - Instance profile is already associated with this instance"
    return 1
  fi
}

# GCP flow
gcp_flow() {
  if ! command -v gcloud &>/dev/null; then echo -e "${RED}gcloud CLI not found${NC}"; exit 1; fi
  if [[ -z "$GCP_PROJECT" ]]; then read -erp "GCP Project ID: " GCP_PROJECT; fi
  if [[ -z "$GCP_VM_NAME" ]]; then read -erp "GCP VM Name (instance): " GCP_VM_NAME; fi
  if [[ -z "$GCP_ZONE" ]]; then read -erp "GCP VM Zone (e.g. us-central1-a): " GCP_ZONE; fi
  if [[ -z "$GCP_PROJECT" || -z "$GCP_VM_NAME" || -z "$GCP_ZONE" ]]; then echo -e "${RED}project, vm name and zone required${NC}"; exit 1; fi

  SA_NAME="verulink-attestor-${ENV}"
  SA_EMAIL="${SA_NAME}@${GCP_PROJECT}.iam.gserviceaccount.com"

  # Determine default secret name
  DEFAULT_SECRET_NAME=""
  case "$ENV" in
    devnet) DEFAULT_SECRET_NAME="dev_verulink_attestor_secrets" ;;
    staging) DEFAULT_SECRET_NAME="stg_verulink_attestor_secrets" ;;
    mainnet) DEFAULT_SECRET_NAME="mainnet_verulink_attestor_secrets" ;;
  esac

  # Confirm secret name before attaching
  echo -e "${CYAN}Default Secret Name: $DEFAULT_SECRET_NAME${NC}"
  echo -e "${CYAN}Project: $GCP_PROJECT${NC}"
  echo ""
  echo -e "${YELLOW}Press Enter to use default, or enter a custom secret name:${NC}"
  read -erp "Secret Name [$DEFAULT_SECRET_NAME]: " SECRET_NAME_INPUT
  SECRET_NAME_INPUT=${SECRET_NAME_INPUT:-$DEFAULT_SECRET_NAME}
  
  if [[ "$SECRET_NAME_INPUT" == "$DEFAULT_SECRET_NAME" ]]; then
    SECRET_NAME="$DEFAULT_SECRET_NAME"
    echo -e "${GREEN}✓ Using default secret name: $SECRET_NAME${NC}"
  else
    SECRET_NAME="$SECRET_NAME_INPUT"
    echo -e "${GREEN}✓ Using custom secret name: $SECRET_NAME${NC}"
  fi
  echo ""

  if gcloud iam service-accounts describe "$SA_EMAIL" --project="$GCP_PROJECT" >/dev/null 2>&1; then
    echo -e "${YELLOW}Service account exists: $SA_EMAIL${NC}"
  else
    echo -e "${CYAN}Creating service account: $SA_NAME${NC}"
    gcloud iam service-accounts create "$SA_NAME" --project="$GCP_PROJECT"
    echo -e "${GREEN}Service account created${NC}"
  fi

  echo -e "${CYAN}Granting Secret Manager access to service account...${NC}"
  
  # Try to grant access in the service account project first
  if gcloud secrets add-iam-policy-binding "$SECRET_NAME" --project="$GCP_PROJECT" --member="serviceAccount:${SA_EMAIL}" --role="roles/secretmanager.secretAccessor" 2>/dev/null; then
    echo -e "${GREEN}✓ Secret accessor role granted in project $GCP_PROJECT${NC}"
  else
    # Secret might be in a different project - try to find it
    echo -e "${YELLOW}Secret not found in service account project. Searching for secret...${NC}"
    SECRET_PROJECT=""
    
    # Try common project patterns or ask user
    read -erp "Enter the project ID where secret '$SECRET_NAME' is stored: " SECRET_PROJECT
    if [[ -z "$SECRET_PROJECT" ]]; then
      echo -e "${RED}✗ Secret project is required${NC}"
      return 1
    fi
    
    if gcloud secrets add-iam-policy-binding "$SECRET_NAME" --project="$SECRET_PROJECT" --member="serviceAccount:${SA_EMAIL}" --role="roles/secretmanager.secretAccessor"; then
      echo -e "${GREEN}✓ Secret accessor role granted in project $SECRET_PROJECT${NC}"
    else
      echo -e "${RED}✗ Failed to grant secret accessor role${NC}"
      echo -e "${YELLOW}You may need to grant access manually:${NC}"
      echo -e "${CYAN}gcloud secrets add-iam-policy-binding $SECRET_NAME --project=$SECRET_PROJECT --member=\"serviceAccount:${SA_EMAIL}\" --role=\"roles/secretmanager.secretAccessor\"${NC}"
      return 1
    fi
  fi
  
  # Note: Project-level admin role is not needed - secret accessor role on the specific secret is sufficient

  echo -e "${CYAN}Attaching service account to VM...${NC}"
  
  # Detect VM's project (VM might be in different project than service account)
  echo -e "${CYAN}Detecting VM project...${NC}"
  VM_PROJECT=""
  
  # First try with the service account project
  if gcloud compute instances describe "$GCP_VM_NAME" --zone "$GCP_ZONE" --project="$GCP_PROJECT" --format="value(name)" >/dev/null 2>&1; then
    VM_PROJECT="$GCP_PROJECT"
    echo -e "${GREEN}✓ Found VM in project: $VM_PROJECT${NC}"
  else
    # Try to get project from instance's selfLink (works across projects if user has access)
    SELF_LINK=$(gcloud compute instances describe "$GCP_VM_NAME" --zone "$GCP_ZONE" --format="value(selfLink)" 2>/dev/null)
    if [[ -n "$SELF_LINK" ]]; then
      # Extract project from selfLink: https://www.googleapis.com/compute/v1/projects/PROJECT_ID/zones/...
      VM_PROJECT=$(echo "$SELF_LINK" | sed -n 's|.*/projects/\([^/]*\)/.*|\1|p')
      if [[ -n "$VM_PROJECT" ]]; then
        echo -e "${GREEN}✓ Found VM in project: $VM_PROJECT${NC}"
      fi
    fi
    
    if [[ -z "$VM_PROJECT" ]]; then
      # If detection fails, ask user
      echo -e "${YELLOW}Could not automatically detect VM project.${NC}"
      read -erp "Enter the VM's project ID (or press Enter to use service account project '$GCP_PROJECT'): " VM_PROJECT_INPUT
      if [[ -n "$VM_PROJECT_INPUT" ]]; then
        VM_PROJECT="$VM_PROJECT_INPUT"
        # Verify the VM exists in this project
        if ! gcloud compute instances describe "$GCP_VM_NAME" --zone "$GCP_ZONE" --project="$VM_PROJECT" --format="value(name)" >/dev/null 2>&1; then
          echo -e "${RED}✗ VM not found in project '$VM_PROJECT'. Please check the project ID.${NC}"
          return 1
        fi
      else
        VM_PROJECT="$GCP_PROJECT"
      fi
    fi
  fi
  
  if [[ "$VM_PROJECT" != "$GCP_PROJECT" ]]; then
    echo -e "${YELLOW}⚠ VM is in project '$VM_PROJECT' (different from service account project '$GCP_PROJECT')${NC}"
  fi
  
  # Check if VM is running (GCP requires VM to be stopped to change service account)
  VM_STATUS=$(gcloud compute instances describe "$GCP_VM_NAME" --zone "$GCP_ZONE" --project="$VM_PROJECT" --format="value(status)" 2>/dev/null)
  VM_WAS_RUNNING=false
  
  if [[ "$VM_STATUS" == "RUNNING" ]]; then
    echo -e "${YELLOW}VM is running. Stopping VM to change service account...${NC}"
    if gcloud compute instances stop "$GCP_VM_NAME" --zone "$GCP_ZONE" --project="$VM_PROJECT"; then
      echo -e "${GREEN}✓ VM stopped${NC}"
      VM_WAS_RUNNING=true
    else
      echo -e "${RED}✗ Failed to stop VM${NC}"
      return 1
    fi
  fi
  
  # Attach service account
  if gcloud compute instances set-service-account "$GCP_VM_NAME" --zone "$GCP_ZONE" --project="$VM_PROJECT" --service-account "$SA_EMAIL" --scopes cloud-platform; then
    echo -e "${GREEN}✓ Service account attached to VM${NC}"
    
    # Restart VM if it was running
    if [[ "$VM_WAS_RUNNING" == true ]]; then
      echo -e "${CYAN}Starting VM...${NC}"
      if gcloud compute instances start "$GCP_VM_NAME" --zone "$GCP_ZONE" --project="$VM_PROJECT"; then
        echo -e "${GREEN}✓ VM started${NC}"
      else
        echo -e "${YELLOW}⚠ Service account attached, but failed to start VM. Start it manually:${NC}"
        echo -e "${CYAN}gcloud compute instances start $GCP_VM_NAME --zone $GCP_ZONE --project=$VM_PROJECT${NC}"
      fi
    fi
  else
    echo -e "${RED}✗ Failed to attach service account to VM${NC}"
    # Restart VM if we stopped it but attachment failed
    if [[ "$VM_WAS_RUNNING" == true ]]; then
      echo -e "${CYAN}Restarting VM...${NC}"
      gcloud compute instances start "$GCP_VM_NAME" --zone "$GCP_ZONE" --project="$VM_PROJECT" 2>/dev/null
    fi
    echo -e "${YELLOW}You may need to run this command manually (after stopping the VM):${NC}"
    echo -e "${CYAN}gcloud compute instances set-service-account $GCP_VM_NAME --zone $GCP_ZONE --project=$VM_PROJECT --service-account $SA_EMAIL --scopes cloud-platform${NC}"
    return 1
  fi
}

# MAIN
if [[ -z "$CLOUD_PROVIDER" ]]; then prompt_select_cloud; fi
if [[ -z "$ENV" ]]; then prompt_env; fi

case "$CLOUD_PROVIDER" in
  aws|AWS)
    aws_flow
    ;;
  gcp|GCP)
    gcp_flow
    ;;
  *)
    echo -e "${RED}Unknown cloud provider${NC}"; exit 1
    ;;
esac

echo -e "${GREEN}Done.${NC}"
