## Attestor Server Deployment Guide

## Table of Contents
- [Installation on VM](#installing-on-vm-manual)
- [Installing using Ansible Playbook](#installing-using-ansible-playbook)
- [Installing on AWS](#installing-on-aws)
- [Verulink Attestor Migration Guide ](#verulink-attestor-migration-guide)
- [Troubleshooting](#troubleshooting)

---
### Installing on VM (Manual)
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
### Installing using Ansible playbook

## Deployment Steps

1. Download ansbile variables for specific environments and update the values
   <details>
	<summary><strong>Environment Variables</strong></summary>
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

	</details>  

   To download devnet ansible vars
   
   Select the respective **branch** based on your deployment environment:
    | Branch   | Deployment Environment |
    |----------|------------------------|
    | develop  | devnet                 |
    | staging  | staging/testnet        |
    | main     | mainnet                |

   Run the following commands, replacing `<branch>` with the appropriate branch name from the table above:
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
   Sample `inventory.txt` file.
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
3. Deploy to a specific environment:
    
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


### Installing on AWS

The attestor service can be deployed using two method
1. From local device
> To run from a local device, please make sure the AWS CLI tool and AWS access credentials have been correctly configured. 
  [Follow steps here.](#to-configure-aws-access) 
2. Using AWS CloudShell from the AWS Management Console UI(**Recommended**)

## Pre-Deployment steps 
1. MTLS certificate/ key and CA certificate \
   **For testnet/staging/demo deployment Venture23 will proivde MTLS CA certificate, attestor certificate and attestor key.** \
   https://docs.google.com/document/d/1K8-PXsaJHolj4TuOVRPLqLTRoD2-PHnh0lSE3vfpsQc/edit
   **For Mainnet, use the openssl tool or any other method to generate the keys and a CSR, and submit CSR to Venture23. The signed certificate will be provided back. Example steps can be found [here](#mtls-key-and-csr-creation).**
2. Have Ethereum and Aleo wallet address and private keys ready
   
## Setup

If using AWS cloudShell, no need to install the dependencies to run the installer script.

### To Configure AWS access
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

## Deployment Steps
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
    make python-venv
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

# Verulink Attestor Migration Guide 

**Note:** Installation is located in the current user’s home directory (`~/`). If your installation path differs, update the commands accordingly.
Older installation is assumed to be at:

```
~/verulink
```

New installation will be set up at:

```
~/verulink_attestor
```

---

## 1. Create Installation Directory

```bash
mkdir -p ~/verulink_attestor/.mtls
```

## 2. Copy Existing Configurations

```bash
cp -a ~/verulink/attestor/chainService/config.yaml ~/verulink_attestor/chain_config.yaml
cp -a ~/verulink/attestor/signService/config.yaml ~/verulink_attestor/sign_config.yaml
cp -a ~/verulink/attestor/signService/secrets.yaml ~/verulink_attestor/secrets.yaml
```

## 3. Copy mTLS Keys

```bash
cp -a -r ~/verulink/attestor/chainService/.mtls ~/verulink_attestor
```

## 4. Download Docker Compose File

Select the branch matching your deployment environment:

| Branch  | Deployment Environment |
| ------- | ---------------------- |
| develop | devnet                 |
| staging | staging/testnet        |
| main    | mainnet                |

```bash
curl -o ~/verulink_attestor/compose.yaml \
https://raw.githubusercontent.com/venture23-aleo/verulink/refs/heads/<branch>/attestor/compose.yaml
```

## 5. Update Docker Image Tags

Edit `~/verulink_attestor/compose.yaml` and set the image tags:

| Environment | Image Tag Format |
| ----------- | ---------------- |
| devnet      | devnet-vx.x.x    |
| staging     | staging-vx.x.x   |
| mainnet     | vx.x.x           |

**Services & Repositories**

* `signingService` → `venture23/verulink-attestor-sign:<tag>`
* `chainService` → `venture23/verulink-attestor-chain:<tag>`

## 6. Run Services

```bash
cd ~/verulink_attestor
docker compose up -d
```


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
