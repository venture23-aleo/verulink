## Attestor Server Deployment Guide

### Installing on AWS
The attestor service can be deployed using two method
1. From local device
> To run from a local device, please make sure the AWS CLI tool and AWS access credentials have been correctly configured. 
  [Follow steps here.](#to-configure-aws-access) 
2. Using AWS CloudShell from the AWS Management Console UI(**Recommended**)

## Pre-Deployment steps 
1. MTLS certiciate/ key and CA certificate \
   **For testnet/staging/demo depolyment Venture23 will proivde MTLS CA certificate, attestor certificate and attestor key.** \
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
### Installing on Local machine, VM, or baremetal
> This script has been tested on an Ubuntu 22.04 machine. To use it on other distributions, ensure that `systemd` is available and refer to the respective package manager's documentation for installing required dependencies.

To deploy on a local machine, VM, or bare metal server, follow the guide provided here.

#### Prerequisite
1. Here’s the corrected and more formal version of your instructions:

---

### Prerequisites

1. Ensure the latest versions of `rust` and `go` are installed.
2. If you are running the script with `sudo`, make sure the Go binary path (`/usr/local/go/bin`) is included in the `secure_path` of the sudoers configuration.
3. Install the following packages:
   - `libssl-dev`  
   - `pkg-config`

---

### Deployment Steps

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

   - Attestor Name: `<releaseIdentifier>_attestor_verulink_<yourCompanyIdentifier>`
   - Aleo Wallet Address: `<your_aleo_wallet_address>`
   - Ethereum Wallet Address: `<your_ethereum_wallet_address>`
   - Database Directory
   - Log Directory
   - Collector Service Endpoint: `<collector_service_url>`
   - MTLS CA Certificate Path
   - Attestor Certificate Path
   - Attestor Private Key Path
   - Prometheus PushGateway Endpoint: `<prometheus_pushgateway_url>`

   ➤ [ChainService Configuration File](https://github.com/venture23-aleo/verulink/blob/main/attestor/chainService/config.yaml)

5. Configure the SigningService credentials by setting the username and password in its configuration file:

   ➤ [SigningService Configuration File](https://github.com/venture23-aleo/verulink/blob/main/attestor/signingService/config.yaml)

6. Create a `secret.yaml` file with the following content:

   ```yaml
   chain:
     ethereum:
       private_key: <eth_private_key>
       wallet_address: <eth_wallet_address>
     aleo:
       private_key: <aleo_private_key>
       wallet_address: <aleo_wallet_address>
   ```
 
5. Run the deployment script:

   ```bash
   bash scripts/deploy-local.sh --chain-config=/path/to/chainservice.yaml --sign-config=/path/to/signingservice.yaml --keys=/path/to/secret.yaml
   ```
6. Check Service Status

	```bash
	systemctl status attestor-sign.service
	systemctl status attestor-chain.service
	```

	> **Note:** If you deployed the services using a 	user-level systemd service, include the `--user` flag in 	the command:

	```bash
	systemctl --user status attestor-sign.service
	systemctl --user status attestor-chain.service
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