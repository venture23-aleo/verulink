## Attestor Server Deployment Guide

## Table of Contents
  - [Installing on AWS](#installing-on-aws)
  - [Installing on GCP](#installing-on-gcp)
  - [Installing on Local machine, VM, or baremetal](#installing-on-local-machine-vm-or-baremetal)
  - [Manual Deployment with Ansible Playbook](#manual-deployment-with-ansible-playbook)
  - [Manual Deployment and Upgrade Process](#manual-deployment-and-upgrade-process)
  - [Troubleshooting](#troubleshooting)

-----

### Installing on AWS

The attestor service can be deployed using two method

1.  From local device

> To run from a local device, please make sure the AWS CLI tool and AWS access credentials have been correctly configured.
> [Follow steps here.](https://www.google.com/search?q=%23to-configure-aws-access)

2.  Using AWS CloudShell from the AWS Management Console UI(**Recommended**)

#### AWS Pre-Deployment steps

1.  MTLS certificate/ key and CA certificate  
    **For testnet/staging/demo deployment Venture23 will provide MTLS CA certificate, attestor certificate and attestor key.**  
    https://docs.google.com/document/d/1K8-PXsaJHolj4TuOVRPLqLTRoD2-PHnh0lSE3vfpsQc/edit
    **For Mainnet, use the openssl tool or any other method to generate the keys and a CSR, and submit CSR to Venture23. The signed certificate will be provided back. Example steps can be found [here](https://www.google.com/search?q=%23mtls-key-and-csr-creation).**
2.  Have Ethereum and Aleo wallet address and private keys ready

#### AWS Setup

If using AWS cloudShell, no need to install the dependencies to run the installer script.

#### To Configure AWS access

1.  Install [***AWS CLI Tool***](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)

2.  Add IAM permission to user  (needed for both local and CloudShell)
    The user running the installer script should have the following IAM permissions.  
    Reference: [Creating and Attaching IAM Policy to user](https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_managed-policies.html)

    \<details\>
    \<summary\>\<strong\>IAM Policy JSON\</strong\>\</summary\>

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

    \</details\>

3.  Create AWS Access key  
    Reference: [To create AWS Access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey)

4.  Configuring aws credentials using Environment variables
    Set AWS credentials and region as environment variables

    ```bash
    export AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
    export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/ bPxRfiCYEXAMPLEKEY
    export AWS_DEFAULT_REGION=us-east-1
    ```

    Reference: [Refer to this AWS documentation for other environment](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html#envvars-set)

#### AWS Deployment Steps

1.  Clone the github project repository

    ```bash
    git clone https://github.com/venture23-aleo/verulink.git
    ```

2.  cd into project directory

    ```bash
    cd verulink
    ```

3.  Checkout to `main` branch

    ```bash
    git checkout main
    ```

4.  Setup python virtual environment

    ```bash
    make python-venv-aws
    ```

5.  Activate python virtual environment

    ```bash
    source venv/bin/activate
    ```

6.  Run the script

    > ***Note***: To work around the issue described in the **Troubleshooting** section, it is recommended to export the environment variable `OBJC_DISABLE_INITIALIZE_FORK_SAFETY`.

    ```
    export OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES
    ```

    > Deployment is on docker container

    ```bash
    make deploy-to-aws
    ```

7.  Provide all the inputs as the script asks.

      * AWS Region (default: `us-east-1`)
      * AMI ID
      * AWS Instance Type (default: `t3.medium`)
      * Attestor node name (\<env\>\_attestor\_verulink\_\<yourcompanyname\> Eg. mainnet\_attestor\_verulink\_v23)
      * AWS Secret Manager secret name for signing keys (default: `mainnet/verulink/attestor/signingservice`)
          - Ethereum private key
          - Ethereum wallet address
          - Aleo private key
          - Aleo wallet address
      * AWS Secret Manager secret name MTLS secret name (default: `mainnet/verulink/attestor/mtls`)
          - MTLS ca certificate file
          - Attestor certificate file
          - Attestor key file

8.  Once successfully deployed, secure and backup the SSH key file  of the machine located in your home directory.

    > Note: If using CloudShell, download the key by going to **Actions** and selecting **Download file**. *Input the correct full path of the key file*.

9.  Access the remote attestor machine via SSH and verify the services (From your deployment machine). The IP address is located in the `inventory.txt` file (in the current directory) and the SSH private key is also available in the same project directory.

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

-----

### Installing on GCP

### Running the Deployment Script

You can run the Attestor deployment script from one of the following environments:

1.  **From a local device**

    > Ensure Google Cloud environment variables are correctly configured.
    > [Follow the setup instructions here.](https://www.google.com/search?q=%23gcp-setup)

2.  **Using Google Cloud Shell from the GCP Console UI** (**Recommended**)

    > This option provides a pre-configured environment with access to your GCP resources.

### Choosing the Deployment Target

Once the script starts, you'll be prompted to choose the deployment target:

  * **Deploy on new VM**
  * **Use an existing VM** (must be Ubuntu 22.04 with `ubuntu` user and SSH key-based access)

#### GCP Pre-Deployment steps

1.  MTLS certificate/ key and CA certificate  
    **For testnet/staging/demo deployment Venture23 will provide MTLS CA certificate, attestor certificate and attestor key.**  
    [https://docs.google.com/document/d/1K8-PXsaJHolj4TuOVRPLqLTRoD2-PHnh0lSE3vfpsQc/edit](https://docs.google.com/document/d/1K8-PXsaJHolj4TuOVRPLqLTRoD2-PHnh0lSE3vfpsQc/edit)
    **For Mainnet, use the openssl tool or any other method to generate the keys and a CSR, and submit CSR to Venture23. The signed certificate will be provided back. Example steps can be found [here](https://www.google.com/search?q=%23mtls-key-and-csr-creation).**
2.  Have Ethereum and Aleo wallet address and private keys ready

#### GCP Setup

#### GCP Authentication Methods

The deployment script supports Service Account Authentication only:

1.  Create a Service Account in your GCP project:

      - Go to [IAM & Admin \> Service Accounts](https://console.cloud.google.com/iam-admin/serviceaccounts)
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

2.  Download the Service Account Key:

      - Click on the created service account
      - Go to "Keys" tab
      - Click "Add Key" \> "Create new key"
      - Choose JSON format
      - Download the key file to a secure location

3.  Set Environment Variables (only needed for service account authentication):

    ```bash
    export GOOGLE_CLOUD_PROJECT="your-project-id"
    export GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/service-account-key.json"
    ```

4.  Enable required APIs (if not already enabled)

    Using Google Cloud Console UI:

      - Go to [APIs & Services](https://console.cloud.google.com/apis)
      - Click "Enable APIs and services"
      - Search for each API and enable them:
          - "Compute"
          - "Secretmanager"
          - "IAM"
          - "cloudresourcemanager"
      - Click "Enable" for each API

#### GCP Deployment Steps

1.  Clone the GitHub project repository:

    ```bash
    git clone https://github.com/venture23-aleo/verulink.git
    ```

2.  Navigate to the project directory:

    ```bash
    cd verulink
    ```

3.  Checkout the `main` branch:

    ```bash
    git checkout main
    ```

4.  Setup python virtual environment

    ```bash
    make python-venv-gcp
    ```

5.  Activate python virtual environment

    ```bash
    source venv/bin/activate
    ```

6.  Run the deployment script

    ```bash
    make deploy-to-gcp
    ```

7.  Select deployment mode: Default network or existing user-created machine

8.  Provide all the inputs as the script asks.

      * GCP Zone (default: `us-central1-a`)

      * GCP Machine Type (default: `e2-medium`)

      * Attestor node name (\<env\>\_attestor\_verulink\_\<yourcompanyname\> Eg. mainnet\_attestor\_verulink\_v23)

      * GCP Secret Manager secret name for signing keys (default: `mainnet/verulink/attestor/signingservice`)

        > The script creates the secret in GCP Secret Manager. Users may provide a custom name, but it's recommended to follow the default naming convention. For example, a devnet deployment can use: `devnet/verulink/attestor/signingservice`.

        > Since GCP Secret Manager does not support `/` in secret names, the actual name created will be `devnet_verulink_attestor_signingservice`. We are using this naming convention to ensure consistency across different platforms, even though the script will convert it to a supported format for each respective platform.

          - Ethereum private key
          - Ethereum wallet address
          - Aleo private key
          - Aleo wallet address

      * GCP Secret Manager secret name MTLS secret name (default: `mainnet/verulink/attestor/mtls`)

        > This will create the secret in GCP Secret Manager.

          - MTLS ca certificate file
          - Attestor certificate file
          - Attestor key file

9.  As Docker build time can take a long time depending on the machine specifications, the following message will be seen in the console:

<!-- end list -->

```bash
   TASK [Wait for build to finish] ************************************************
   FAILED - RETRYING: [x.x.x.x]: Wait for build to finish (100 retries left).
   FAILED - RETRYING: [x.x.x.x]: Wait for build to finish (99 retries left).
```

10. Once successfully deployed, secure and backup the SSH key file of the machine located in your home directory `~/attestor_ssh_key_backup`.

> Note: If using CloudShell, download the key by going to **Actions** and selecting **Download file**. *Input the correct full path of the key file*.

11. Access the remote attestor machine via SSH and verify the services (From your deployment machine). The IP address is located in the `inventory.txt` file (in the current directory) and the SSH private key is also available in the same project directory.

<!-- end list -->

```bash
ssh -i <private_key_file.pem> ubuntu@IP_ADDRESS
```

10. Verify the services: `chainService` and `signingService`

<!-- end list -->

```bash
docker ps
```

Verify the logs in services

```bash
docker exec -it <attestor-chainservice-id> sh
cd ../logs
cat verulink.log
```

-----

### Installing on Local machine, VM, or baremetal

> This script has been tested on an Ubuntu 22.04 machine. To use it on other distributions, ensure that `systemd` is available and refer to the respective package manager's documentation for installing required dependencies.

To deploy on a local machine, VM, or bare metal server, follow the guide provided here.

#### Local Prerequisites

1.  Attestor Node Name  
    Format: `<env>_attestor_verulink_<your_company_name>`  
    Example: `mainnet_attestor_verulink_v23`

2.  Wallet Keys and Addresses

      - Ethereum Private Key
      - Ethereum Wallet Address
      - Aleo Private Key
      - Aleo Wallet Address

3.  Ensure that the latest versions of `Go` and `Rust` are installed.

    ```bash
    # Check Go version
    go version

    # Check Rust compiler version
    rustc --version
    ```

    > **Note:** You can install Go by following the instructions [here](https://go.dev/doc/install), and Rust by following the instructions [here](https://www.rust-lang.org/tools/install).

4.  If Go and Rust are installed via the official binary and its path (e.g., `/usr/local/go/bin`, `/home/ubuntu/.cargo/bin`) is not included in the `secure_path` of the sudoers configuration, add it to ensure proper execution when using `sudo`.

5.  Install the following packages:

    ```bash
    sudo apt update
    sudo apt install libssl-dev pkg-config build-essential
    ```

6.  You may need to open the firewall port for the signing service (default: 8080) if it is bound to an IP address other than `localhost` or the loopback address (`127.0.0.1`).

#### Local Deployment Steps

1.  Clone the GitHub project repository:

    ```bash
    git clone https://github.com/venture23-aleo/verulink.git
    ```

2.  Navigate to the project directory:

    ```bash
    cd verulink
    ```

3.  Checkout the `main` branch:

    ```bash
    git checkout main
    ```

4.  Update the configuration file with the required values and save it. You will need to provide the following information in the template:

    `./attestor/chainService/config.yaml`

    | Configuration Item                | Value/    Placeholder |
    |----------------------------------|    -------------------|
    | Attestor Name                |     `<releaseIdentifier>_attestor_verulink_<yourCompanyIden    tifier>` |
    | Aleo Wallet Address          |     `<your_aleo_wallet_address>` |
    | Ethereum Wallet Address      |     `<your_ethereum_wallet_address>` |
    | Collector Service Endpoint   |     `<collector_service_url>` |
    | Prometheus PushGateway Endpoint |     `<prometheus_pushgateway_url>` |

5.  Create a `secrets.yaml` file with the following content:

    ```yaml
    chain:
      ethereum:
        private_key: <eth_private_key>
        wallet_address: <eth_wallet_address>
      aleo:
        private_key: <aleo_private_key>
        wallet_address: <aleo_wallet_address>
    ```

6.  Run the script with the required arguments as shown below:

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

7.  Check Service Status

    ```bash
    systemctl status attestor-sign.service
    systemctl status attestor-chain.service
    ```

    > **Note:** If you deployed the services using a &#9;user-level systemd service, include the `--user` flag in &#9;the command:

    ```bash
    systemctl --user status attestor-sign.service
    systemctl --user status attestor-chain.service
    ```

8.  To view logs for the systemd services, use the following commands:

    ```bash
    journalctl -u attestor-sign.service
    journalctl -u attestor-chain.service
    ```

    > **Note:** If you deployed the services using a &#9;user-level systemd service, include the `--user` flag in &#9;the command:

    ```bash
    journalctl --user -u attestor-sign.service
    journalctl --user -u attestor-chain.service
    ```

9.  To start or stop the services, use the following commands:

    ```bash
    systemctl stop attestor-sign.service
    systemctl start attestor-chain.service
    ```

    > **Note:** If you deployed the services using a &#9;user-level systemd service, include the `--user` flag in &#9;the command:

    ```bash
    systemctl --user stop attestor-sign.service
    systemctl --user start attestor-chain.service
    ```

10. To view the application log file, navigate to the installation directory on the Linux machine, then go to the `log` directory. The log file is named `verulink.log`.

-----

### Manual Deployment with Ansible Playbook

#### Ansible Prerequisites

1.  Make sure ansible is installed on the machine

2.  **Target Machine Requirements**

      - Linux distribution (Ubuntu 22.04 LTS)
      - At least 8GB RAM and 4 vCPUs
      - SSH access with key-based authentication

    > Note: for password based authentication install `sshpass` on the system

      - User with sudo privileges

3.  **Required Files**

      - MTLS certificates (CA certificate, attestor certificate, attestor key)
      - Ethereum and Aleo wallet addresses and private keys
      - Collector service URL
      - Prometheus PushGateway URL

#### Ansible Deployment Steps

1.  **Clone the Repository**

    ```bash
    git clone https://github.com/venture23-aleo/verulink.git
    cd verulink
    ```

2.  **Check out to branch**

    ```bash
    git checkout <branch>
    ```

3.  **Navigate to Ansible Directory**

    ```bash
    cd scripts/ansible-playbook
    ```

4.  **Create Variables File**
    Copy the sample variables file and configure it:

    ```bash
    cp vars.yaml.sample vars.yaml
    ```

5.  **Configure Variables**
    Edit `vars.yaml` with your specific values:

    ```yaml
    # Attestor Configuration
    attestor_name: mainnet_attestor_verulink_yourcompany
    signer_username: signer
    signer_password: your_secure_password

    # Service Endpoints
    collector_service_url: 
    prometheus_pushgateway_url: 

    # Wallet Information (Base64 encoded)
    aleo_wallet_address: <base64-encoded-aleo-address>
    ethereum_wallet_address: <base64-encoded-eth-address>
    ethereum_private_key: <base64-encoded-eth-key>
    aleo_private_key: <base64-encoded-aleo-key>

    # MTLS Certificates (Base64 encoded)
    ca_certificate: <base64-encoded-ca-cert>
    attestor_certificate: <base64-encoded-attestor-cert>
    attestor_key: <base64-encoded-attestor-key>

    # Git Branch to Deploy
    verulink_branch: <branch to deploy>
    ```

6.  **Run the Ansible Playbook**
    The script will prompt for the sudo (BECOME) password. Enter your sudo password, or press Enter if it is the same as your SSH login password.

    ```bash
    % ansible-playbook deploy_attestor.yaml -i "192.168.1.100," -u cloud_user --ask-pass --ask-become-pass
    SSH password:
    BECOME password[defaults to SSH password]:
    ```

    Using username/password:

    ```bash
      ansible-playbook deploy_attestor.yaml \
      -i "<ip_address>," \
      -u <remote_user> \
      --ask-pass \
      --ask-become-pass
    ```

    Using username + SSH private key:

    ```bash
    ansible-playbook deploy_attestor.yaml \
    -i "13.222.206.36," \
    -u cloud_user \
    --private-key ~/.ssh/mykey.pem \
    --ask-become-pass"
    ```

    If you are connecting to the server for the first time or the host key is not saved, you may see a host key verification error. Manually SSH into the server to accept the key, or disable host key checking.

    ```bash
    TASK [Gathering Facts] **************************************************************************************************************************************************************
    fatal: [192.168.1.100]: FAILED! => {"msg": "Using a SSH password instead of a key is not possible because Host Key checking is enabled and sshpass does not support this.  Please add this host's fingerprint to your known_hosts file to manage this host."}
    ```

    To disable SSH host key verification (not recommended for production environments), set the `ANSIBLE_HOST_KEY_CHECKING` environment variable to `False` when running the playbook:

    ```bash
    ANSIBLE_HOST_KEY_CHECKING=False ansible-playbook deploy_attestor.yaml -i "3.139.69.158," -u cloud_user --ask-pass --ask-become-pass
    ```

#### Ansible Verification

After deployment, verify the services are running:

1.  **Check Docker Containers**

    ```bash
    ssh -i /path/to/private_key.pem remote_user@your-server-ip
    docker ps
    ```

2.  **Check Service Logs**

    ```bash
    docker logs <container_id>
    ```

3.  **Check Application Logs**

    ```bash
    docker exec -it attestor-chainservice cat /app/logs/verulink.log
    ```

-----

### Manual Deployment and Upgrade Process

#### Manual Prerequisites

**Recommended Minimum VM Specs**

  - **OS:** Ubuntu 22.04 LTS (64-bit)
  - **CPU:** 1 vCPU
  - **RAM:** 2 GB
  - **Disk:** 50 GB SSD
  - **Network:** Open port 22 open for SSH
  - **Docker:** Latest

#### Manual Deployment Steps
You can either clone the project repository or manually create the installation directory.
To clone the project, run:
```bash
git clone https://github.com/venture23-aleo/verulink.git
```
Docker installation guide [here](https://docs.docker.com/engine/install/ubuntu/).#install-using-the-repository)

1.  Creating Installation Directory

    ```bash
    mkdir -p verulink/attestor/{chainService,signingService}
    mkdir -p verulink/attestor/chainService/.mtls
    ```

2.  Signing Service Configuration

    i. **Create Wallet Secrets File:**

    Create `verulink/attestor/signingService/secrets.yaml` with the following format:

    ```yaml
    chain:
      ethereum:
        private_key: <ethereum_private_key>
        wallet_address: <ethereum_wallet_address>
      aleo:
        private_key: <aleo_private_key>
        wallet_address: <aleo_wallet_address>
    ```

    ii. **Secure Secrets File:**

    ```bash
    chmod 600 verulink/attestor/signingService/secrets.yaml
    ```

    iii. **Download Signing Service Config:**

    ```bash
    curl -o verulink/attestor/signingService/config.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/main/attestor/signingService/config.yaml
    ```

    iv. **Edit config.yaml:**

      * Configure **username** and **password** for access control.

3.  Chain Service Configuration

    i. **Download Chain Service Config:**

    ```bash
     curl -o verulink/attestor/chainService/config.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/main/attestor/chainService/config.yaml
    ```

    ii. Update `verulink/attestor/chainService/config.yaml`:

     ```yaml
     attestor_name: <releaseIdentifier>_attestor_verulink_<yourCompanyIdentifier>  # e.g.,     devnet_attestor_verulink_abc

     aleo:
        wallet_address: <aleo_wallet_address>

     ethereum:
        wallet_address: <ethereum_wallet_address>

     signing_service:
        username: <configured_username>
        password: <configured_password>

     collector_service:
        uri: <collector_service_uri>  # Provided by Venture23

     mtls:
        ca_certificate: ca.crt
        attestor_certificate: <attestor_name>.crt
        attestor_key: <attestor_name>.key

     metrics:
        host: <pushgateway_url>  # Provided by Venture23
     ```
    

    iii. **Copy mTLS Files:**

    Place the following into `verulink/attestor/chainService/.mtls/`:

    ```
    - ca.crt
    - <attestor_name>.crt
    - <attestor_name>.key
    ```

     Ensure filenames match what is in `verulink/attestor/chainService/config.yaml`.

4.  Update Docker Compose
    Download Docker compose file.
    ```bash
    curl -o verulink/attestor/compose.yaml https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/ci/attestor-gcp-deployment/attestor/compose.yaml
    ```

    Path: `verulink/attestor/compose.yaml`

    ### Example:

    ```yaml
    image: venture23/verulink-attestor-chain:<tag>
    image: venture23/verulink-attestor-sign:<tag>
    ```

    Replace `<tag>` with the required image version (e.g. `be42ce6`, `latest`, `v1.0.0` etc.)

5.  Verify Docker Images (Optional for Security)

    Install [cosign](https://docs.sigstore.dev/cosign/system_config/installation/) on Ubuntu:

    ```bash
    LATEST_VERSION=$(curl -s https://api.github.com/repos/sigstore/cosign/releases/latest | grep tag_name | cut -d : -f2 | tr -d "v\", ")
    curl -O -L "https://github.com/sigstore/cosign/releases/latest/download/cosign_${LATEST_VERSION}_amd64.deb"
    sudo dpkg -i cosign_${LATEST_VERSION}_amd64.deb
    ```

    Verify Image Signature:

    ```bash
    cosign verify \
       --certificate-identity "https://github.com/venture23-aleo/verulink/.github/workflows/docker-build-publish.yml@refs/heads/<branch_name>" \
       --certificate-oidc-issuer "https://token.actions.githubusercontent.com" \
       venture23/verulink-attestor-sign:<tag>
    ```

    Replace `<branch_name>` with `main` for **mainnet releases**

6.  Start the Services

    Navigate to your working directory:

    ```bash
    cd verulink/attestor
    docker compose up -d
    ```

### Upgrade Process

1.  Update image tag in `compose.yaml`:

    ```yaml
    image: venture23/verulink-attestor-<service>:<new_tag>
    ```

2.  Restart the service:

    ```bash
    docker compose pull
    docker compose up -d
    ```

#### Manual Verification

After deployment, verify the services are running:

1.  **Check Docker Containers**

    ```bash
    ssh -i /path/to/private_key.pem remote_user@your-server-ip
    docker ps
    ```

2.  **Check Service Logs**

    ```bash
    docker logs <container_id>
    ```

3.  **Check Application Logs**

    ```bash
    docker exec -it attestor-chainservice cat /app/logs/verulink.log
    ```

#### Troubleshooting Ansible Deployment

**Common Issues and Solutions**

1.  **SSH Connection Issues**

    ```bash
    # Test SSH connection
    ansible -i <ip_address>, all -m ping

    # With verbose output
    ansible -i <ip_address>, all -m ping -vvv
    ```

2.  **Permission Issues**

    ```bash
    # Run with become
    ansible-playbook -i <ip_address>, deploy_attestor.yaml --become --ask-become-pass
    ```

3.  **Variable Validation Errors**

    ```bash
    # Check variable syntax
    ansible-playbook -i <ip_address>, deploy_attestor.yaml --check
    ```

4.  **Base64 Encoding Issues**

    ```bash
    # Encode files to base64
    cat your_certificate.crt | base64 -w 0
    cat your_private_key.key | base64 -w 0
    ```

**Debug Mode**

```bash
# Run with maximum verbosity
ansible-playbook -i <ip_address>, deploy_attestor.yaml -vvvv

# Run specific task with debug
ansible-playbook -i <ip_address>, deploy_attestor.yaml --tags debug
```

-----

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

<!-- end list -->

```bash
docker ps -a
```

  - View the logs of the existing container

<!-- end list -->

```bash
docker logs <container_id>
```

In case of failure while deploying the attestor

1.  Re-run the deployment script

    ```bash
    make deploy-to-aws
    ```

2.  You will be notified if you want to continue or reconfigure

    ```bash
    Do you want to continue (C) deployment or reconfigure (R)? 
    ```

3.  If you are using the same configuration like MTLS certificates, Ethereum and Aleo keys, we can just type "C" to **continue with deployment**.  
    If you are changing any of them, type "R" to **reconfigure** with new values.

4.  If the following error occurs, follow the steps provided below:

<!-- end list -->

```task [Retrieve sudo password from AWS Secrets Manager] ******************************************************************************************************************************
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

1.  Generate private key:

<!-- end list -->

```
openssl genpkey -algorithm RSA -out attestor.key -pkeyopt rsa_keygen_bits:4096
```

2.  Create csr

<!-- end list -->

```
openssl req -new -key attestor.key -out attestor.csr -subj "/C=US/ST=State/L=City/O=Organization/OU=OrgUnit/CN=example.com"
```
