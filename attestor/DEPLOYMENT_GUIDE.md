# Verulink Attestor: Deployment, Updating, and Patching Guide 
## Table of Contents

1. [Deploying on a Cloud VM (AWS, GCP) using Ansible Playbook Automation](#deploying-on-a-cloud-vm-aws-gcp-using-ansible-playbook-automation)
2. [Deploying on a Kubernetes Cluster](#deploying-on-a-kubernetes-cluster)
3. [Installing on VM (Manual)](#installing-on-vm-manual)


## Deploying on a Cloud VM (AWS, GCP) using Ansible Playbook Automation
## Prerequisites

### Clone the repository and set up the project

```bash
git clone https://github.com/venture23-aleo/verulink.git
cd verulink
```


### Setup Ansible Inventory

Create or edit the inventory file for your environment:

**Location:** `scripts/ansible/inventories/<env>/hosts.yml`

**Example for staging:**
```yaml
---
# Staging Environment Inventory
all:
  hosts:
    staging-attestor-01:
      ansible_host: <ip-address-of-vm>
      ansible_user: ubuntu
      ansible_ssh_private_key_file: <path-to-private-key>
  vars:
    env: staging # Options: devnet, staging, or mainnet
    infrastructure_provider: aws  # Options: aws or gcp
    deployment_type: docker  # Options: docker or k8s
    region: us-east-1  # AWS region (e.g., us-east-1) or GCP region (e.g., us-central1)
    ansible_user: ubuntu
    gcp_project: <gcp-project-id>  # Required if infrastructure_provider is gcp
```
**Example for Multiple Attestors:**
```yaml
---
# Staging Environment Inventory
all:
  hosts:
    staging-attestor-01:
      ansible_host: <ip-address-of-vm>
      ansible_user: ubuntu
      ansible_ssh_private_key_file: <path-to-private-key>
    staging-attestor-02:
      ansible_host: <ip-address-of-vm>
      ansible_user: ubuntu
      ansible_ssh_private_key_file: <path-to-private-key>
  vars:
    env: staging
    infrastructure_provider: aws  # Options: aws or gcp
    deployment_type: docker  # Options: docker or k8s
    region: us-east-1  # AWS region (e.g., us-east-1) or GCP region (e.g., us-central1)
    ansible_user: ubuntu
    gcp_project: <gcp-project-id>  # Required if infrastructure_provider is gcp
```
Note: For multiple attestors, list each VM under `hosts` with a unique name.


**For devnet:** Use `scripts/ansible/inventories/dev/hosts.yml` with `env: devnet`  
**For production:** Use `scripts/ansible/inventories/prod/hosts.yml` with `env: mainnet`

**Required Variables:**
- `ansible_host`: VM IP address or hostname
- `ansible_ssh_private_key_file`: Path to SSH private key for VM access
- `infrastructure_provider`: `aws` or `gcp`
- `gcp_project`: GCP project ID (required for GCP)

---

## Configure Cloud Credentials

Before deploying, ensure your cloud credentials are properly configured.

### **AWS Credentials**

**Option 1: Environment Variables**
```bash
export AWS_ACCESS_KEY_ID=<your-access-key>
export AWS_SECRET_ACCESS_KEY=<your-secret-key>
export AWS_DEFAULT_REGION=us-east-1
```

**Option 2: AWS CLI Configure**
```bash
aws configure
# Enter: Access Key ID, Secret Access Key, Default region, Output format
```

**Option 3: AWS Profile**
```bash
aws configure --profile <profile-name>
export AWS_PROFILE=<profile-name>
```

**Verify Configuration:**
```bash
aws sts get-caller-identity
# Should show your AWS account ID and user/role
```

---

### **GCP Credentials**

**Option 1: Interactive Login (User Account)**
```bash
gcloud auth login
# Opens browser for authentication
```

**Option 2: Service Account Key File**
```bash
gcloud auth activate-service-account --key-file=<path-to-key.json>
# Example: gcloud auth activate-service-account --key-file=gcpkey.json
```

**Set Active Project:**
```bash
gcloud config set project <project-id>
# Or extract from key file:
gcloud config set project $(cat gcpkey.json | jq -r .project_id)
```

**Verify Configuration:**
```bash
# Check active account
gcloud auth list
# Should show * next to active account

# Check active project
gcloud config get-value project
# Should show your project ID

# Verify access
gcloud projects describe $(gcloud config get-value project)
```

**Switch Between Accounts:**
```bash
# List all accounts
gcloud auth list

# Switch to specific account
gcloud config set account <account-email>

# Switch back to user account
gcloud auth login
```

---

## Quick Start

### 1. **Upload Secrets to Cloud Secret Manager**

```bash
make upload-secrets
```

**Secret JSON Format** (if creating manually):

```json
{
  "mtls": {
    "ca_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "attestor_certificate": "-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----",
    "attestor_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
  },
  "signing_service": {
    "bsc_private_key": "0x...",
    "bsc_wallet_address": "0x...",
    "ethereum_private_key": "0x...",
    "ethereum_wallet_address": "0x...",
    "aleo_private_key": "APrivateKey1...",
    "aleo_wallet_address": "aleo1...",
    "signing_service_username": "admin",
    "signing_service_password": "password"
  }
}
```

**Note:** Make sure the secret can be accessed from the VM.

---

### 2. **Attach Instance Profile / Service Account to VM**

**AWS:**
```bash
make attach-instance-profile
# Select: 1) AWS
# Enter: EC2 Instance ID, IAM Role name
```

**GCP:**
```bash
make attach-instance-profile
# Select: 2) GCP
# Enter: Project ID, VM Name, Zone
# Note: If secret is in different project, enter secret's project when prompted
```


---
### 3. **Setup venv**
```bash
make setup-venv
```
After `venv` is setup completely, activate the venv

```bash
source venv/bin/activate
```

### 4. **Deploy**

Full deployment **(first time or complete redeploy)**:

```bash
make deploy ENV=staging DEPLOYMENT_TYPE=docker
```

**What it does:**
- Installs Docker
- Pulls secrets from Secret Manager
- Downloads and renders config files
- Sets up mTLS certificates
- Starts services

---

## Updating Attestor Configuration and Refreshing Secrets
### **Update Config**

Update chain service configuration parameters on `staging_vars.yml`:

```bash
make update ENV=staging
```

**What it does:**
- Pulls latest secrets
- Downloads updated config template from GitHub
- Updates `chain_config.yaml` only
- Restarts services (no image pull)
---

## Updating Attestor Configuration without Refreshing Secrets
### **Update Config**
Update chain service configuration parameters on `staging_vars.yml`:

```bash
make update-config ENV=staging
```

**What it does:**
- Downloads updated config template from GitHub
- Updates `chain_config.yaml` only
- Restarts services (no image pull)
---
> Note: To update the config from a specific branch:
```bash
make update-config ENV=staging BRANCH=staging
```

## Patch Attestor Docker Image

### 1. Update image tags in staging_vars.yml
```bash
docker_image_tag_sign: "staging-v2.0.1"
docker_image_tag_chain: "staging-v2.0.1"
```

### 2. Run patch
```bash
make patch ENV=staging
```

**What it does:**
- Updates `.env` file with new image tags
- Pulls new docker images
- Restarts services with new images

---

## Summary

| Command | Purpose | Changes |
|---------|---------|---------|
| `make upload-secrets` | Store secrets | Creates/updates secret in cloud |
| `make attach-instance-profile` | Grant VM access | Attaches IAM role/service account |
| `make setup-venv` | Setup venv | Installs Ansible |
| `make deploy ENV=staging` | Full deployment | Everything (first time) |
| `make update ENV=staging` | Update config | `chain_config.yaml` only |
| `make patch ENV=staging` | Update images | `.env` + docker images |

---

### Verify Deployment

```bash
# Check services are running
ssh -i <key> ubuntu@<vm-ip>
docker compose -f ~/verulink_attestor/compose.yml ps

# Check logs
docker compose -f ~/verulink_attestor/compose.yml logs -f
```

## Deploying on a Kubernetes Cluster


### Prerequisites

1. **Kubernetes cluster access** - Verify with:
   ```bash
   make check-k8s-auth
   kubectl cluster-info
   ```

2. **Helm 3.x** installed
   ```bash
   helm version
   ```
  To install Helm, see the instructions [here](https://helm.sh/docs/intro/install/).


### 1. Setup Kubernetes Secrets

The attestor requires secrets for mTLS certificates, private keys, and signing service credentials.

### Option A: Using Make Command (Recommended)

```bash
make upload-secrets
# Select option 3 (Kubernetes)
# Follow prompts for namespace and secret name
```

This will:
- Create namespace if needed
- Base64 encode certificates
- Create/update Kubernetes secret with all required keys

### Option B: Manual Creation

If creating manually, use this command:

```bash
kubectl create secret generic attestor-secret \
  --namespace=<your-namespace> \
  --from-literal=CA_MTLS_CERT="<base64_encoded_ca_cert>" \
  --from-literal=ATTESTOR_MTLS_CERT="<base64_encoded_attestor_cert>" \
  --from-literal=ATTESTOR_MTLS_KEY="<base64_encoded_attestor_key>" \
  --from-literal=ALEO_PRIVATE_KEY="<aleo_private_key>" \
  --from-literal=BSC_PRIVATE_KEY="<bsc_private_key>" \
  --from-literal=BASE_PRIVATE_KEY="<base_private_key>" \
  --from-literal=ARBITRUM_PRIVATE_KEY="<arbitrum_private_key>" \
  --from-literal=ETHEREUM_PRIVATE_KEY="<ethereum_private_key>" \
  --from-literal=SIGNING_SERVICE_USERNAME="<username>" \
  --from-literal=SIGNING_SERVICE_PASSWORD="<password>"
```

**Verify secret:**
```bash
kubectl get secret attestor-secret -n <namespace>
kubectl describe secret attestor-secret -n <namespace>
```



---

## 2. Prepare Configuration Values

Before deploying, prepare your `values.yaml` file with all required configuration. 

### Download the Sample `values.yaml` and Update


#### Download values.yaml for your environment (dev, staging, or production)

**Production**
```bash
curl -o values.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/main/attestor/attestor-chart/values.yaml
```
**Staging**

```bash
curl -o values.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/staging/attestor/attestor-chart/values.yaml
```


**Update this values.yaml file** with your environment-specific values:

#### Configure Storage

**Default: emptyDir (Development/Testing)**

The chart defaults to `emptyDir` storage, which is ephemeral and suitable for testing only.

```yaml
# In values.yaml
storage:
  type: emptyDir
```

**Warning:** Data is lost when pods restart. Not suitable for production.

**Production: Persistent Volume Claim (PVC)**

For production deployments, use PVC for persistent storage.

#### Step 1: Prepare StorageClass (if needed)

Check existing StorageClasses:
```bash
kubectl get storageclass
```

If you need to create one, see `attestor/attestor-chart/STORAGECLASS_GUIDE.md` or use:

```bash
kubectl apply -f - <<EOF
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: attestor-storage-class
provisioner: ebs.csi.aws.com  # Adjust for your cloud provider
parameters:
  type: gp3
  fsType: ext4
reclaimPolicy: Delete
volumeBindingMode: WaitForFirstConsumer
allowVolumeExpansion: true
EOF
```

#### Step 2: Configure PVC in values.yaml

```yaml
storage:
  type: pvc
  pvc:
    size: 10Gi  # Adjust based on your needs (e.g., "50Gi", "100Gi")
    storageClassName: "attestor-storage-class"  # Or use existing StorageClass
    accessModes:
      - ReadWriteOnce
```

**Note:** The chart will automatically create the PVC when `storage.type: pvc` is set.



## 3. Deploy with Helm

### Add Verulink Attestor Helm Repository
```bash
helm repo add verulink https://venture23-aleo.github.io/verulink/
helm repo update
```

### List Available Chart Versions

To view all available versions of the Verulink Attestor Helm Chart, run:
```bash
helm search repo verulink/verulink-attestor --versions
```
>To list development chart versions, use:
>```bash
>helm search repo verulink/verulink-attestor --versions --devel
>```
### List All Configurable Values in the Chart


```bash
helm show values verulink/verulink-attestor
```

> To list the latest beta/dev version, use the actual version string from `helm search repo` output.

```bash
# Example: show values for a specific beta version
helm show values verulink/verulink-attestor \
  --version 0.0.0-build.202602020200
```



### First-Time Installation

To install the Verulink Attestor for the first time, use:
```bash
helm install verulink-attestor verulink/verulink-attestor \
  --namespace <your-namespace> \
  --create-namespace \
  --version <version> \
  -f values.yaml
```

### Upgrade an Existing Deployment

To upgrade to a newer version of the chart, use:
```bash
helm upgrade verulink-attestor verulink/verulink-attestor \
  --namespace <your-namespace> \
  --version <version> \
  -f values.yaml
```


#### Upgrading Only the Image


```bash
helm upgrade verulink-attestor verulink/verulink-attestor \
  --namespace <your-namespace> \
  --set image.chain.tag=<new-chain-tag> \
  --set image.sign.tag=<new-signing-tag>
```


### Verify Deployment
```bash
# Check pods
kubectl get pods -n <namespace>


# View logs
kubectl logs -f deployment/chainservice -n <namespace>
kubectl logs -f deployment/signingservice -n <namespace>
```


## Installing on VM (Manual)
#### Pre-Deployment steps 
1. MTLS certiciate/ key and CA certificate \
   **For testnet/staging/demo deployment Venture23 will provide MTLS CA certificate, attestor certificate and attestor key.** \
   [ mTLS Implementation
   ](https://docs.google.com/document/d/1K8-PXsaJHolj4TuOVRPLqLTRoD2-PHnh0lSE3vfpsQc/edit)  
   **For Mainnet, use the openssl tool or any other method to generate the keys and a CSR, and submit CSR to Venture23. The signed certificate will be provided back. Example steps can be found [here](#mtls-key-and-csr-creation).**
2. Have Ethereum(s) and Aleo wallet address and private keys ready

## Machine Configuration
1. VM Specification
	- OS: Ubuntu 22.04 LTS
	- vCPU: 1
	- Memory: 2 GB
	- Storage: 50 GB
2. Networking
	- Host Firewall: SSH Access (Port 22)
	- Docker Network: Signing Service (Port 8080)
3. Packages:
	- Docker: latest
	- Docker compose
	- Cosign (Optional, required to verify the image) 

## Deployment Steps
1. Create Installation Directory
	```bash
	mkdir -p verulink_attestor/.mtls
	```
2. Select the respective **branch** based on your deployment environment:
    | Branch   | Deployment Environment |
    |----------|------------------------|
    | develop  | devnet                 |
    | staging  | staging/testnet        |
    | main     | mainnet                |

   Run the following commands, replacing `<branch>` with the appropriate branch name from the table above:
    Download chain config
	```bash
	
	curl -o verulink_attestor/chain_config.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/<branch>/attestor/chainService/config.yaml
    ```
	Download sign config
	```bash
	curl -o verulink_attestor/sign_config.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/<branch>/attestor/signingService/config.yaml
    ```
	Download compose file
	```bash
	curl -o verulink_attestor/compose.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/<branch>/attestor/compose.yaml
	```

3. Update mTLS key, certificates, configuration  
   i. Copy mTLS certificates, and key to `verulink_attestor/.mtls`
   > Name the attestor certificate and key files with the attestor name as a prefix. For example, if the attestor name is `devnet_attestor_xyz`, the files should be named `devnet_attestor_xyz.crt` and `devnet_attestor_xyz.key`.
   
   ii. **verulink_attestor/sign_config.yaml**  
   - Update the signing service **default** `username` & `password`    
   
   iii. Create a YAML file named **verulink_attestor/secrets.yaml** with the following format and content:
   ```yaml
   chain:
	bsc:
	  chain_type: evm
  	  private_key: "<bsc_private_key>"
  	  wallet_address: "<bsc_wallet_address>"
  	aleo:
	  chain_type: aleo
  	  private_key: "<aleo_private_key>"
  	  wallet_address: "<aleo_wallet_address>"
   ```
   iii. Update the following placeholders in **verulink_attestor/chain_config.yaml** with the correct values.
    - Update the attestor node name in the format `<env>_attestor_verulink_\<yourcompanyname>`. For example: `stg_attestor_verulink_v23`
	- Aleo wallet address: `<your_aleo_wallet_address>`
	- Ethereum wallet address: `<your_evm_wallet_address>`
	- Signing service `username` and `password` configured in `verulink_attestor/sign_config.yaml`
	- Collector service url: `<collector_service_url>`
	- Change only the filenames, not the entire file paths, since these paths are referenced inside the container environment.
For example, if the key and certificate filenames are `ca.cer`, `stg_attestor_verulink_v23.crt`, and `stg_attestor_verulink_v23.key`, update them as shown below.
	```yaml
	  # --- Remaining parts ---
	  collector_service:
        uri : <collector_service_url>
  		# Within collector_wait_dur, collector-service will try to collect all unconfirmed packetsiteratively
  		collector_wait_dur: 1h
		ca_certificate: /configs/.mtls/ca.cer
  		attestor_certificate: /configs/.mtls/stg_attestor_verulink_v23.crt
  		attestor_key: /configs/.mtls/stg_attestor_verulink_v23.key
	  # -- Remaining parts ---
	```  

	- Prometheus gateway url: `<prometheus_pushgateway_url>`
4. Update file permission
First, go to the installation root directory `verulink_attestor`.

   ```bash
   chmod 750 .mtls
   chmod 600 secrets.yaml
   ```
5. Create a `.env` file inside the `verulink_attestor` directory and add the Docker image tags as shown below:

   ```bash
   DOCKER_IMAGE_TAG_SIGN=<signing service image tag>
   DOCKER_IMAGE_TAG_CHAIN=<chain service image tag>
   ```

	| Environment | Docker Image tag         |
	|-------------|--------------------------|
	| devnet      | devnet-vx.x.x            |
	| staging     | staging-vx.x.x           |
	| mainnet     | vx.x.x                   |

6. Run the service.
   ```bash
   docker compose up -d
   ```
7. Verify the services: `chainService` and `signingService`
   ```bash
   docker ps
   ```
	Verify the logs in services
	```bash
	docker exec -it <attestor-chainservice-id> sh
	cd ../logs
	cat verulink.log
	```