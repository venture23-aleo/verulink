# Manual Secret Storage Guide

This guide explains how to manually store the combined attestor secret in AWS Secrets Manager or GCP Secret Manager.

## Secret Structure

The combined secret contains all attestor secrets in a single JSON file with the following structure:

```json
{
  "mtls": {
    "ca_certificate": "<base64_decoded_ca_certificate>",
    "attestor_certificate": "<base64_decoded_attestor_certificate>",
    "attestor_key": "<base64_decoded_attestor_key>"
  },
  "signing_service": {
    "ethereum_private_key": "<bsc_private_key>",
    "ethereum_wallet_address": "<bsc_wallet_address>",
    "aleo_private_key": "<aleo_private_key>",
    "aleo_wallet_address": "<aleo_wallet_address>"
  }
}
```

## Secret Naming Convention

### AWS Secrets Manager
- **Mainnet**: `mainnet/verulink/attestor/secrets`
- **Staging**: `stg/verulink/attestor/secrets`
- **Devnet**: `dev/verulink/attestor/secrets`

### GCP Secret Manager
- **Mainnet**: `mainnet_verulink_attestor_secrets`
- **Staging**: `stg_verulink_attestor_secrets`
- **Devnet**: `dev_verulink_attestor_secrets`

---

## AWS Secrets Manager

### Prerequisites
- AWS CLI installed and configured
- Appropriate IAM permissions:
  - `secretsmanager:CreateSecret`
  - `secretsmanager:PutSecretValue`
  - `secretsmanager:DescribeSecret`

### Step 1: Prepare the Secret JSON File

Create a file `attestor_secret.json` with the combined secret structure:

```bash
cat > attestor_secret.json << 'EOF'
{
  "mtls": {
    "ca_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "attestor_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "attestor_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  },
  "signing_service": {
    "ethereum_private_key": "0x...",
    "ethereum_wallet_address": "0x...",
    "aleo_private_key": "APrivateKey1...",
    "aleo_wallet_address": "aleo1..."
  }
}
EOF
```

**Note**: If you have base64-encoded certificates, decode them first:
```bash
# Decode base64 certificates
echo "{{ ca_certificate_base64 }}" | base64 -d > ca_cert.pem
echo "{{ attestor_certificate_base64 }}" | base64 -d > attestor_cert.pem
echo "{{ attestor_key_base64 }}" | base64 -d > attestor_key.pem

# Then copy the contents into the JSON file
```

### Step 2: Create the Secret

#### For Devnet:
```bash
aws secretsmanager create-secret \
  --name "dev/verulink/attestor/secrets" \
  --secret-string file://attestor_secret.json \
  --region us-east-1 \
  --description "Verulink Attestor Combined Secrets (Devnet)"
```

#### For Staging:
```bash
aws secretsmanager create-secret \
  --name "stg/verulink/attestor/secrets" \
  --secret-string file://attestor_secret.json \
  --region us-east-1 \
  --description "Verulink Attestor Combined Secrets (Staging)"
```

#### For Mainnet:
```bash
aws secretsmanager create-secret \
  --name "mainnet/verulink/attestor/secrets" \
  --secret-string file://attestor_secret.json \
  --region us-east-1 \
  --description "Verulink Attestor Combined Secrets (Mainnet)"
```

### Step 3: Verify the Secret

```bash
# Check if secret exists
aws secretsmanager describe-secret \
  --secret-id "dev/verulink/attestor/secrets" \
  --region us-east-1

# View secret value (be careful - this shows sensitive data)
aws secretsmanager get-secret-value \
  --secret-id "dev/verulink/attestor/secrets" \
  --region us-east-1 \
  --query SecretString \
  --output text | jq .
```

### Step 4: Update an Existing Secret (if needed)

```bash
aws secretsmanager update-secret \
  --secret-id "dev/verulink/attestor/secrets" \
  --secret-string file://attestor_secret.json \
  --region us-east-1
```

---

## GCP Secret Manager

### Prerequisites
- `gcloud` CLI installed and authenticated
- Appropriate IAM permissions:
  - `secretmanager.secrets.create`
  - `secretmanager.versions.add`
  - `secretmanager.secrets.get`

### Step 1: Set GCP Project

```bash
export GCP_PROJECT="your-gcp-project-id"
gcloud config set project $GCP_PROJECT
```

### Step 2: Prepare the Secret JSON File

Create a file `attestor_secret.json` with the combined secret structure (same as AWS):

```bash
cat > attestor_secret.json << 'EOF'
{
  "mtls": {
    "ca_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "attestor_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "attestor_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  },
  "signing_service": {
    "ethereum_private_key": "0x...",
    "ethereum_wallet_address": "0x...",
    "aleo_private_key": "APrivateKey1...",
    "aleo_wallet_address": "aleo1..."
  }
}
EOF
```

### Step 3: Create the Secret

#### For Devnet:
```bash
# Create the secret (first time)
gcloud secrets create dev_verulink_attestor_secrets \
  --project=$GCP_PROJECT \
  --data-file=attestor_secret.json \
  --replication-policy="automatic"
```

#### For Staging:
```bash
gcloud secrets create stg_verulink_attestor_secrets \
  --project=$GCP_PROJECT \
  --data-file=attestor_secret.json \
  --replication-policy="automatic"
```

#### For Mainnet:
```bash
gcloud secrets create mainnet_verulink_attestor_secrets \
  --project=$GCP_PROJECT \
  --data-file=attestor_secret.json \
  --replication-policy="automatic"
```

### Step 4: Add a New Version (if secret already exists)

```bash
# For Devnet
gcloud secrets versions add dev_verulink_attestor_secrets \
  --project=$GCP_PROJECT \
  --data-file=attestor_secret.json

# For Staging
gcloud secrets versions add stg_verulink_attestor_secrets \
  --project=$GCP_PROJECT \
  --data-file=attestor_secret.json

# For Mainnet
gcloud secrets versions add mainnet_verulink_attestor_secrets \
  --project=$GCP_PROJECT \
  --data-file=attestor_secret.json
```

### Step 5: Verify the Secret

```bash
# List secrets
gcloud secrets list --project=$GCP_PROJECT | grep verulink

# View secret metadata
gcloud secrets describe dev_verulink_attestor_secrets \
  --project=$GCP_PROJECT

# View secret value (be careful - this shows sensitive data)
gcloud secrets versions access latest \
  --secret="dev_verulink_attestor_secrets" \
  --project=$GCP_PROJECT | jq .
```

---

## Helper Script: Generate Secret JSON from Variables

If you have the variables in your `devnet_vars.yml` or similar file, you can use this helper script:

```bash
#!/bin/bash
# generate_secret_json.sh

# Source your variables (adjust path as needed)
source <(grep -E '^(aleo_|bsc_|ca_certificate|attestor_certificate|attestor_key)' devnet_vars.yml | sed 's/^/export /')

# Decode base64 certificates if needed
CA_CERT=$(echo "$ca_certificate_base64" | base64 -d)
ATTESTOR_CERT=$(echo "$attestor_certificate_base64" | base64 -d)
ATTESTOR_KEY=$(echo "$attestor_key_base64" | base64 -d)

# Generate JSON
cat > attestor_secret.json << EOF
{
  "mtls": {
    "ca_certificate": "$(echo "$CA_CERT" | jq -Rs .)",
    "attestor_certificate": "$(echo "$ATTESTOR_CERT" | jq -Rs .)",
    "attestor_key": "$(echo "$ATTESTOR_KEY" | jq -Rs .)"
  },
  "signing_service": {
    "ethereum_private_key": "$bsc_private_key",
    "ethereum_wallet_address": "$bsc_wallet_address",
    "aleo_private_key": "$aleo_private_key",
    "aleo_wallet_address": "$aleo_wallet_address"
  }
}
EOF

echo "Secret JSON generated: attestor_secret.json"
```

**Note**: This script requires `jq` to be installed. Install it with:
- macOS: `brew install jq`
- Ubuntu/Debian: `sudo apt-get install jq`
- RHEL/CentOS: `sudo yum install jq`

---

## Using Python to Generate Secret JSON

Alternatively, you can use Python to generate the JSON:

```python
#!/usr/bin/env python3
# generate_secret_json.py

import json
import base64
import sys

# Read variables from your vars file or environment
# Example values (replace with your actual values):
ca_cert_b64 = "YOUR_CA_CERT_BASE64"
attestor_cert_b64 = "YOUR_ATTESTOR_CERT_BASE64"
attestor_key_b64 = "YOUR_ATTESTOR_KEY_BASE64"
bsc_private_key = "YOUR_BSC_PRIVATE_KEY"
bsc_wallet_address = "YOUR_BSC_WALLET_ADDRESS"
aleo_private_key = "YOUR_ALEO_PRIVATE_KEY"
aleo_wallet_address = "YOUR_ALEO_WALLET_ADDRESS"

# Decode base64 certificates
ca_cert = base64.b64decode(ca_cert_b64).decode('utf-8')
attestor_cert = base64.b64decode(attestor_cert_b64).decode('utf-8')
attestor_key = base64.b64decode(attestor_key_b64).decode('utf-8')

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
with open('attestor_secret.json', 'w') as f:
    json.dump(secret, f, indent=2)

print("Secret JSON generated: attestor_secret.json")
```

---

## Security Best Practices

1. **Never commit secrets to version control**
   - Add `attestor_secret.json` to `.gitignore`
   - Use environment variables or secure vaults

2. **Use least privilege IAM roles**
   - Only grant necessary permissions
   - Use separate roles for read vs write operations

3. **Rotate secrets regularly**
   - Update secrets periodically
   - Use versioning in secret managers

4. **Audit secret access**
   - Enable CloudTrail (AWS) or Cloud Audit Logs (GCP)
   - Monitor who accesses secrets and when

5. **Clean up temporary files**
   ```bash
   # After creating the secret, remove the JSON file
   rm -f attestor_secret.json
   ```

---

## Troubleshooting

### AWS: Secret Already Exists
If you get `ResourceExistsException`:
```bash
# Update existing secret instead
aws secretsmanager update-secret \
  --secret-id "dev/verulink/attestor/secrets" \
  --secret-string file://attestor_secret.json \
  --region us-east-1
```

### GCP: Secret Already Exists
If you get "already exists" error:
```bash
# Add a new version instead
gcloud secrets versions add dev_verulink_attestor_secrets \
  --project=$GCP_PROJECT \
  --data-file=attestor_secret.json
```

### Invalid JSON Format
Validate your JSON before storing:
```bash
# Check JSON syntax
cat attestor_secret.json | jq . > /dev/null && echo "Valid JSON" || echo "Invalid JSON"

# Pretty print to verify structure
cat attestor_secret.json | jq .
```

---

## Next Steps

After manually storing the secret:

1. **Verify the secret exists** using the commands above
2. **Test secret retrieval** in your deployment
3. **Run Ansible playbook** with `store_secrets: false` (since secret already exists)
   ```bash
   ansible-playbook playbooks/deploy.yml \
     -i inventories/dev/hosts.yml \
     -e "@devnet_vars.yml" \
     -e "store_secrets=false"
   ```

