## Attestor Server Deployment Guide

## Table of Contents
- [Installing on AWS](#installing-on-aws)
  - [Pre-Deployment steps](#pre-deployment-steps)
  - [Setup](#setup)
  - [To Configure AWS access](#to-configure-aws-access)
  - [Deployment Steps](#deployment-steps)
- [Installing on GCP](#installing-on-gcp)
  - [Pre-Deployment steps](#pre-deployment-steps)
  - [Setup](#setup)
  - [To Configure GCP access](#to-configure-gcp-access)
  - [Deployment Steps](#deployment-steps)
- [Installing on Local machine, VM, or baremetal](#installing-on-local-machine-vm-or-baremetal)
  - [Prerequisites](#prerequisites)
  - [Deployment Steps](#deployment-steps-1)
- [Troubleshooting](#troubleshooting)

---

### Installing on AWS
The attestor service can be deployed using two method
1. From local device
> To run from a local device, please make sure the AWS CLI tool and AWS access credentials have been correctly configured. 
  [Follow steps here.](#to-configure-aws-access) 
2. Using AWS CloudShell from the AWS Management Console UI(**Recommended**)

#### Pre-Deployment steps 
1. MTLS certificate/ key and CA certificate \
   **For testnet/staging/demo deployment Venture23 will provide MTLS CA certificate, attestor certificate and attestor key.** \
   https://docs.google.com/document/d/1K8-PXsaJHolj4TuOVRPLqLTRoD2-PHnh0lSE3vfpsQc/edit
   **For Mainnet, use the openssl tool or any other method to generate the keys and a CSR, and submit CSR to Venture23. The signed certificate will be provided back. Example steps can be found [here](#mtls-key-and-csr-creation).**
2. Have Ethereum and Aleo wallet address and private keys ready
   
#### Setup

If using AWS cloudShell, no need to install the dependencies to run the installer script.

#### To Configure AWS access
1. Install [_**AWS CLI Tool**_](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

2. Add IAM permission to user  (needed for both local and CloudShell)
The user running the installer script should have the following IAM permissions. \
Reference: [Creating and Attaching IAM Policy to user](https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_managed-policies.html)

	<details>
	<summary><strong>IAM Policy JSON</strong></summary>

	```json
	{
	"Version": "2012-10-17",
	"Statement": [
	  {
	    "Sid": "EC2Permissions",
	    "Effect": "Allow",
	    "Action": [
	      "ec2:AssociateIamInstanceProfile",
	      "ec2:CreateKeyPair",
	      "ec2:DescribeImages",
	      "ec2:CreateTags",
	      "ec2:DescribeSecurityGroups",
	      "ec2:CreateSecurityGroup",
	      "ec2:AuthorizeSecurityGroupIngress",
	      "ec2:DescribeInstances",
	      "ec2:RunInstances",
	      "ec2:TerminateInstances"
	    ],
	    "Resource": "*"
	  },
	  {
	    "Sid": "IAMPermissions",
	    "Effect": "Allow",
	    "Action": [
	      "iam:PassRole",
	      "iam:GetAccountPasswordPolicy",
	      "iam:GetAccountSummary",
	      "iam:ChangePassword",
	      "iam:GetUser",
	      "iam:CreateAccessKey",
	      "iam:DeleteAccessKey",
	      "iam:ListAccessKeys",
	      "iam:UpdateAccessKey",
	      "iam:GetAccessKeyLastUsed",
	      "iam:DeleteSSHPublicKey",
	      "iam:GetSSHPublicKey",
	      "iam:ListSSHPublicKeys",
	      "iam:UpdateSSHPublicKey",
	      "iam:UploadSSHPublicKey",
	      "iam:CreateInstanceProfile",
	      "iam:UpdateAssumeRolePolicy",
	      "iam:PutUserPermissionsBoundary",
	      "iam:AttachUserPolicy",
	      "iam:CreateRole",
	      "iam:AttachRolePolicy",
	      "iam:PutRolePolicy",
	      "iam:AddRoleToInstanceProfile",
	      "iam:CreateAccessKey",
	      "iam:CreatePolicy",
	      "iam:DetachRolePolicy",
	      "iam:AttachGroupPolicy",
	      "iam:PutUserPolicy",
	      "iam:DetachGroupPolicy",
	      "iam:CreatePolicyVersion",
	      "iam:DetachUserPolicy",
	      "iam:PutGroupPolicy",
	      "iam:SetDefaultPolicyVersion",
	      "iam:TagRole",
	      "iam:GetRole",
	      "iam:GetInstanceProfile"
	    ],
	    "Resource": "*"
	  },
	  {
	    "Sid": "KMSAndSecretsManagerPermissions",
	    "Effect": "Allow",
	    "Action": [
	      "kms:*",
	      "secretsmanager:DescribeSecret",
	      "secretsmanager:GetSecretValue",
	      "secretsmanager:CreateSecret",
	      "secretsmanager:ListSecrets",
          "secretsmanager:UpdateSecret"
	    ],
	    "Resource": "*"
	  },
	  {
	    "Sid": "S3Permissions",
	    "Effect": "Allow",
	    "Action": "s3:ListAllMyBuckets",
	    "Resource": "*"
	  },
	  {
	    "Sid": "CloudShellPermissions",
	    "Effect": "Allow",
	    "Action": "cloudshell:*",
	    "Resource": "*"
	  }
	]
	}
	```
	</details>  

3. Create AWS Access key  
   Reference: [To create AWS Access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey)

4. Configuring aws credentials using Environment variables
    Set AWS credentials and region as environment variables
    ```bash
    export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
    export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/ bPxRfiCYEXAMPLEKEY
    export AWS_DEFAULT_REGION=us-east-1
    ```
   Reference: [Refer to this AWS documentation for other environment](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html#envvars-set)

#### Deployment Steps
1. Clone the github project repository
    ```bash
    git clone https://github.com/venture23-aleo/verulink.git
    ```
2. cd into project directory 
   ```bash
   cd verulink
   ```
3. Checkout to `main` branch 
    ```bash
    git checkout main
    ```
4. Setup python virtual environment
    ```bash
    make python-venv-aws
    ```
5. Activate python virtual environment
    ```bash
    source venv/bin/activate
    ```
6. Run the script
   > **_Note_**: To work around the issue described in the **Troubleshooting** section, it is recommended to export the environment variable `OBJC_DISABLE_INITIALIZE_FORK_SAFETY`.
   ```
   export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
   ```
   > Deployment is on docker container 
    ```bash
    make deploy-to-aws
    ```
7. Provide all the inputs as the script asks.
    * AWS Region (default: `us-east-1`)
    * AMI ID
    * AWS Instance Type (default: `t3.medium`)
    * Attestor node name (\<env>\_attestor_verulink_\<yourcompanyname> Eg. mainnet_attestor_verulink_v23)
    * AWS Secret Manager secret name for signing keys (default: `mainnet/verulink/attestor/signingservice`)
        - Ethereum private key
        - Ethereum wallet address
        - Aleo private key
        - Aleo wallet address
    * AWS Secret Manager secret name MTLS secret name (default: `mainnet/verulink/attestor/mtls`)
        - MTLS ca certificate file
        - Attestor certificate file
        - Attestor key file


8. Once successfully deployed, secure and backup the SSH key file  of the machine located in your home directory.
   > Note: If using CloudShell, download the key by going to **Actions** and selecting **Download file**. _Input the correct full path of the key file_.
9. Access the remote attestor machine via SSH and verify the services (From your deployment machine). The IP address is located in the `inventory.txt` file (in the current directory) and the SSH private key is also available in the same project directory.
	```bash
	ssh -i <private_key_file.pem> ubuntu@IP_ADDRESS
	```
10. Verify the services: `chainService` and `signingService`
	```bash
	docker ps
	```
	Verify the logs in services
	```bash
	docker exec -it <attestor-chainservice-id> sh
	cd ../logs
	cat verulink.log
	```

---

### Installing on GCP

### Running the Deployment Script

You can run the Attestor deployment script from one of the following environments:

1. **From a local device**

   > Ensure Google Cloud environment variables are correctly configured.
   > [Follow the setup instructions here.](#to-configure-gcp-access)

2. **Using Google Cloud Shell from the GCP Console UI** (**Recommended**)

   > This option provides a pre-configured environment with access to your GCP resources.

### Choosing the Deployment Target

Once the script starts, you'll be prompted to choose the deployment target:

* **Deploy on new VM**
* **Use an existing VM** (must be Ubuntu 22.04 with `ubuntu` user and SSH key-based access)

#### Pre-Deployment steps 
1. MTLS certificate/ key and CA certificate \
   **For testnet/staging/demo deployment Venture23 will provide MTLS CA certificate, attestor certificate and attestor key.** \
   https://docs.google.com/document/d/1K8-PXsaJHolj4TuOVRPLqLTRoD2-PHnh0lSE3vfpsQc/edit
   **For Mainnet, use the openssl tool or any other method to generate the keys and a CSR, and submit CSR to Venture23. The signed certificate will be provided back. Example steps can be found [here](#mtls-key-and-csr-creation).**
2. Have Ethereum and Aleo wallet address and private keys ready
   
### Setup

#### GCP Authentication Methods

The deployment script supports two authentication methods:

##### Method 1: gcloud CLI Authentication

⚠️ Authentication Warning: Running from a local device may not work due to missing or misconfigured Application Default Credentials (ADC).

1. Install Google Cloud SDK if not already installed:
   https://cloud.google.com/sdk/docs/install-sdk

2. Authenticate with gcloud:
   ```bash
   gcloud auth login
   ```

3. Set your project:
   ```bash
   gcloud config set project YOUR_PROJECT_ID
   ```

4. Verify authentication:
   ```bash
   gcloud auth list
   gcloud config get-value project
   ```

5. Ensure your user account has the required permissions:
   - Compute Engine Admin (`roles/compute.admin`)
   - Secret Manager Admin (`roles/secretmanager.admin`)
   - Service Account Admin (`roles/iam.serviceAccountAdmin`)
   - Resource Manager Project IAM Admin (`roles/resourcemanager.projectIamAdmin`)
   - Service Usage Consumer (`roles/serviceusage.serviceUsageConsumer`)
   - IAM Role Administrator (`roles/iam.roleAdmin`)

   You can add these roles in the GCP Console under IAM & Admin > IAM, or use gcloud commands:
   <details>
   <summary>Add IAM roles using gcloud commands</summary>

   ```bash
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="user:$(gcloud config get-value account)" --role="roles/compute.admin"
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="user:$(gcloud config get-value account)" --role="roles/secretmanager.admin"
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="user:$(gcloud config get-value account)" --role="roles/iam.serviceAccountAdmin"
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="user:$(gcloud config get-value account)" --role="roles/resourcemanager.projectIamAdmin"
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="user:$(gcloud config get-value account)" --role="roles/serviceusage.serviceUsageConsumer"
   gcloud projects add-iam-policy-binding YOUR_PROJECT_ID --member="user:$(gcloud config get-value account)" --role="roles/iam.roleAdmin"
   ```
   </details>
   ```

##### Method 2: Service Account Key Authentication

1. Create a Service Account in your GCP project:
   - Go to [IAM & Admin > Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
   - Click "Create Service Account"
   - Give it a name like "attestor-deployment-sa"
   - Click "Create and continue"
   - Add the following roles (same as required for user accounts):
     - Compute Engine Admin (`roles/compute.admin`)
     - Secret Manager Admin (`roles/secretmanager.admin`)
     - Service Account Admin (`roles/iam.serviceAccountAdmin`)
     - Resource Manager Project IAM Admin (`roles/resourcemanager.projectIamAdmin`)
     - Service Usage Consumer (`roles/serviceusage.serviceUsageConsumer`
     - IAM Role Administrator (`roles/iam.roleAdmin`)

2. Download the Service Account Key:
   - Click on the created service account
   - Go to "Keys" tab
   - Click "Add Key" > "Create new key"
   - Choose JSON format
   - Download the key file to a secure location

3. Set Environment Variables (only needed for service account authentication):
   ```bash
   export GOOGLE_CLOUD_PROJECT="your-project-id"
   export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
   ```

3. Enable required APIs (if not already enabled)
 
   Using Google Cloud Console UI:
   - Go to [APIs & Services](https://console.cloud.google.com/apis)
   - Click "Enable APIs and services"
   - Search for each API and enable them:
      - "Compute"
      - "Secretmanager"
      - "IAM"
      - "cloudresourcemanager"
   - Click "Enable" for each API
  
#### Deployment Steps

1. Clone the GitHub project repository:
   ```bash
   git clone https://github.com/venture23-aleo/verulink.git
   ```

2. Navigate to the project directory:
   ```bash
   cd verulink
   ```

3. Checkout the `main` branch:
   ```bash
   git checkout main
   ```

4. Setup python virtual environment
    ```bash
    make python-venv-gcp
    ```
5. Activate python virtual environment
    ```bash
    source venv/bin/activate
    ```

6. Run the deployment script
   ```bash
   make deploy-to-gcp
   ```

7. Select deployment mode: Default network or existing user-created machine
8. Provide all the inputs as the script asks.
   * GCP Zone (default: `us-central1-a`)
   * GCP Machine Type (default: `e2-medium`)
   * Attestor node name (\<env>\_attestor_verulink_\<yourcompanyname> Eg. mainnet_attestor_verulink_v23)
   * GCP Secret Manager secret name for signing keys (default: `mainnet/verulink/attestor/signingservice`)
       - Ethereum private key
       - Ethereum wallet address
       - Aleo private key
       - Aleo wallet address
   * GCP Secret Manager secret name MTLS secret name (default: `mainnet/verulink/attestor/mtls`)
       - MTLS ca certificate file
       - Attestor certificate file
       - Attestor key file
9. As Docker build time can take a long time depending on the machine specifications, the following message will be seen in the console:
```bash
   TASK [Wait for build to finish] ************************************************
   FAILED - RETRYING: [x.x.x.x]: Wait for build to finish (100 retries left).
   FAILED - RETRYING: [x.x.x.x]: Wait for build to finish (99 retries left).
```
10. Once successfully deployed, secure and backup the SSH key file of the machine located in your home directory `~/attestor_ssh_key_backup`.
   > Note: If using CloudShell, download the key by going to **Actions** and selecting **Download file**. _Input the correct full path of the key file_.

11. Access the remote attestor machine via SSH and verify the services (From your deployment machine). The IP address is located in the `inventory.txt` file (in the current directory) and the SSH private key is also available in the same project directory.
   ```bash
   ssh -i <private_key_file.pem> ubuntu@IP_ADDRESS
   ```

10. Verify the services: `chainService` and `signingService`
   ```bash
   docker ps
   ```
   Verify the logs in services
   ```bash
   docker exec -it <attestor-chainservice-id> sh
   cd ../logs
   cat verulink.log
   ```
---
### Installing on Local machine, VM, or baremetal
> This script has been tested on an Ubuntu 22.04 machine. To use it on other distributions, ensure that `systemd` is available and refer to the respective package manager's documentation for installing required dependencies.

To deploy on a local machine, VM, or bare metal server, follow the guide provided here.


#### Prerequisites

1. Attestor Node Name  
   Format: `<env>_attestor_verulink_<your_company_name>`  
   Example: `mainnet_attestor_verulink_v23`

2. Wallet Keys and Addresses  
   - Ethereum Private Key  
   - Ethereum Wallet Address  
   - Aleo Private Key  
   - Aleo Wallet Address

3. Ensure that the latest versions of `Go` and `Rust` are installed.

   ```bash
   # Check Go version
   go version
   
   # Check Rust compiler version
   rustc --version
   ```
   > **Note:** You can install Go by following the instructions [here](https://go.dev/doc/install), and Rust by following the instructions [here](https://www.rust-lang.org/tools/install).
4. If Go and Rust are installed via the official binary and its path (e.g., `/usr/local/go/bin`, `/home/ubuntu/.cargo/bin`) is not included in the `secure_path` of the sudoers configuration, add it to ensure proper execution when using `sudo`.
5. Install the following packages:
   ```bash
   sudo apt update
   sudo apt install libssl-dev pkg-config build-essential
   ```  
6. You may need to open the firewall port for the signing service (default: 8080) if it is bound to an IP address other than `localhost` or the loopback address (`127.0.0.1`).
 
   



#### Deployment Steps

1. Clone the GitHub project repository:
   ```bash
   git clone https://github.com/venture23-aleo/verulink.git
   ```

2. Navigate to the project directory:
   ```bash
   cd verulink
   ```

3. Checkout the `main` branch:
   ```bash
   git checkout main
   ```

4. Update the configuration file with the required values and save it. You will need to provide the following information in the template:

	`./attestor/chainService/config.yaml`

    | Configuration Item                | Value/    Placeholder |
    |----------------------------------|    -------------------|
    | Attestor Name                |     `<releaseIdentifier>_attestor_verulink_<yourCompanyIden    tifier>` |
    | Aleo Wallet Address          |     `<your_aleo_wallet_address>` |
    | Ethereum Wallet Address      |     `<your_ethereum_wallet_address>` |
    | Collector Service Endpoint   |     `<collector_service_url>` |
    | Prometheus PushGateway Endpoint |     `<prometheus_pushgateway_url>` |

5. Create a `secrets.yaml` file with the following content:

   ```yaml
   chain:
     ethereum:
       private_key: <eth_private_key>
       wallet_address: <eth_wallet_address>
     aleo:
       private_key: <aleo_private_key>
       wallet_address: <aleo_wallet_address>
   ```
 
6. Run the script with the required arguments as shown below:
   > You need to provide the paths to the configuration files, as well as the mTLS (mutual TLS) certificate and key files, as shown in the command below.
   ```bash
   bash scripts/deploy-local.sh --chain-config=/path/to/chainservice.yaml --sign-config=/path/to/signingservice.yaml --secrets=/path/to/secret.yaml --ca_cert=/path/to/ca.cert --attestor_cert=/path/to/attestor.cert --attestor_key=/path/to/attestor.key
   ```
   You will be prompted with the following:
   ```bash
   🔍 Please review and confirm your configuration files:
    - Chain config      : /home/ubuntu/verulink/attestor/   chainService/config.yaml
    - Signing config    : /home/ubuntu/verulink/attestor/   signingService/config.yaml
    - Secrets file      : /home/ubuntu/verulink/attestor/   signingService/secrets.yaml
    - CA Certificate    : /home/ubuntu/ca.cer
    - Attestor Cert     : /home/ubuntu/attestor.crt
    - Attestor Key      : /home/ubuntu/attestor.key
   Press ENTER to continue, or Ctrl+C to cancel...
   
   📦 Enter installation directory [default: /home/ubuntu/   attestor]:
   📁 Installation path set to: /home/ubuntu/attestor
   📁 Creating installation directories...
   🔍 Checking for required dependencies...
   ✅ Go and Rust are installed, proceeding with the build.
   
   🔧 Enter Signing Service IP or Hostname (default: 0.0.0.0): 192.168.1.100
   🔧 Enter Signing Service Port [default: 8080]: 8080
   🔗 Signing Service will bind to:
   🔨 Building chainservice...
   go: downloading go.uber.org/zap v1.26.0
   go: downloading github.com/ethereum/go-ethereum v1.13.15
   go: downloading github.com/stretchr/testify v1.8.4
   ```
   You will be prompted to install either a user-level or system-level systemd service. Press Enter to select the default, which is the user-level systemd unit.
   ```bash
   📦 Where do you want to install systemd units?
   1) System-wide (requires sudo)
   2) User-level (no sudo)
   Select [1/2, default 2]:
   ```
7. Check Service Status

	```bash
	systemctl status attestor-sign.service
	systemctl status attestor-chain.service
	```

	> **Note:** If you deployed the services using a 	user-level systemd service, include the `--user` flag in 	the command:

	```bash
	systemctl --user status attestor-sign.service
	systemctl --user status attestor-chain.service
	```
8. To view logs for the systemd services, use the following commands:
	```bash
	journalctl -u attestor-sign.service
	journalctl -u attestor-chain.service
	```
	> **Note:** If you deployed the services using a 	user-level systemd service, include the `--user` flag in 	the command:
	```bash
	journalctl --user -u attestor-sign.service
	journalctl --user -u attestor-chain.service
	```
10. To start or stop the services, use the following commands:
	```bash
	systemctl stop attestor-sign.service
	systemctl start attestor-chain.service
	```
	> **Note:** If you deployed the services using a 	user-level systemd service, include the `--user` flag in 	the command:
	```bash
	systemctl --user stop attestor-sign.service
	systemctl --user start attestor-chain.service
	```
11. To view the application log file, navigate to the installation directory on the Linux machine, then go to the `log` directory. The log file is named `verulink.log`.

## Troubleshooting
At times, keys may not be retrievable during installation. In such cases, we can manually attempt to fetch the keys by executing the following command:

If you haven't made any changes, the default SSH key name remains "`mainnet_attestor_verulink_<attestor_name>-ssh-key.pem`."
> This command checks with AWS Secret Manager if the keys can be retreived.
```bash
ansible-playbook scripts/aws/deploy.yml -i inventory.txt -u ubuntu --private-key=<ssh_key_name> --tags debug,retrieve_secret
```

If the attestor deployment phase encounters an installation failure, we should proceed by running the Ansible playbook only for the remaining deployment tasks.

```bash
ansible-playbook scripts/aws/deploy.yml -i inventory.txt -u ubuntu --private-key=<ssh_key_name>
```
Alternatively, we can directly provide the public IP of the AWS EC2 instance instead of inventory.txt file
```bash
ansible-playbook scripts/aws/deploy.yml -i 54.198.147.67, -u ubuntu --private-key attestor-ssh-key.pem
```
If no Docker containers are running, check the existing containers and view their logs.
- Show existing containers
```bash
docker ps -a
```
- View the logs of the existing container
```bash
docker logs <container_id>
```

In case of failure while deploying the attestor 
1. Re-run the deployment script 
	```bash
	make deploy-to-aws
	```
2. You will be notified if you want to continue or reconfigure
	```bash
	Do you want to continue (C) deployment or reconfigure (R)? 
	```
3. If you are using the same configuration like MTLS certificates, Ethereum and Aleo keys, we can just type "C" to **continue with deployment**. \
	If you are changing any of them, type "R" to **reconfigure** with new values.

4. If the following error occurs, follow the steps provided below:
```TASK [Retrieve sudo password from AWS Secrets Manager] ******************************************************************************************************************************
objc[844]: +[__NSCFConstantString initialize] may have been in progress in another thread when fork() was called.
objc[844]: +[__NSCFConstantString initialize] may have been in progress in another thread when fork() was called. We cannot safely call it or ignore it in the fork() child process. Crashing instead. Set a breakpoint on objc_initializeAfterForkError to debug.
ERROR! A worker was found in a dead state
2024-09-08 09:44:45 INFO: An error occurred while executing the playbook.
```

[Follow this stack thread](https://stackoverflow.com/questions/50168647/multiprocessing-causes-python-to-crash-and-gives-an-error-may-have-been-in-progr)

or
```
export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
```

### mTLS Key and CSR Creation
1. Generate private key:
```
openssl genpkey -algorithm RSA -out attestor.key -pkeyopt rsa_keygen_bits:4096
```
2. Create csr
```
openssl req -new -key attestor.key -out attestor.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=example.com"
```
