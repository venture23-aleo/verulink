## Attestor Server Deployment Guide
The attestor service can be deployed using two method
1. From local device
> To run from a local device, please make sure the AWS CLI tool and AWS access credentials have been correctly configured. 
  [Follow steps here.](#to-configure-aws-access) 
2. Using AWS CloudShell from the AWS Management Console UI(Recommended)

## Pre-Deployment steps 
1. MTLS certiciate/ key and CA certificate \
   **For testnet/staging/demo depolyment Venture23 will proivde MTLS CA certificate, attestor certificate and attestor key.** \
   https://docs.google.com/document/d/1K8-PXsaJHolj4TuOVRPLqLTRoD2-PHnh0lSE3vfpsQc/edit
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
			"Sid": "Statement1",
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
			"Sid": "PolicyStatementToAllowUserToPassOneSpecificRole",
			"Effect": "Allow",
			"Action": [
				"iam:PassRole"
			],
			"Resource": "arn:aws:iam::714859998736:role/centralized-relay-kms"
		},
		{
			"Sid": "CentralizedRelayKmsPolicy",
			"Effect": "Allow",
			"Action": "kms:*",
			"Resource": "*"
		},
		{
			"Sid": "AllowViewAccountInfo",
			"Effect": "Allow",
			"Action": [
				"iam:GetAccountPasswordPolicy",
				"iam:GetAccountSummary"
			],
			"Resource": "*"
		},
		{
			"Sid": "AllowManageOwnPasswords",
			"Effect": "Allow",
			"Action": [
				"iam:ChangePassword",
				"iam:GetUser"
			],
			"Resource": "arn:aws:iam::*:user/${aws:username}"
		},
		{
			"Sid": "AllowManageOwnAccessKeys",
			"Effect": "Allow",
			"Action": [
				"iam:CreateAccessKey",
				"iam:DeleteAccessKey",
				"iam:ListAccessKeys",
				"iam:UpdateAccessKey",
				"iam:GetAccessKeyLastUsed"
			],
			"Resource": "arn:aws:iam::*:user/${aws:username}"
		},
		{
			"Sid": "AllowManageOwnSSHPublicKeys",
			"Effect": "Allow",
			"Action": [
				"iam:DeleteSSHPublicKey",
				"iam:GetSSHPublicKey",
				"iam:ListSSHPublicKeys",
				"iam:UpdateSSHPublicKey",
				"iam:UploadSSHPublicKey"
			],
			"Resource": "arn:aws:iam::*:user/${aws:username}"
		},
		{
			"Sid": "VisualEditor0",
			"Effect": "Allow",
			"Action": [
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
				"iam:PassRole",
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
				"iam:GetInstanceProfile",
				"cloudshell:*"
			],
			"Resource": "*"
		},
		{
			"Effect": "Allow",
			"Action": "s3:ListAllMyBuckets",
			"Resource": "*"
		},
		{
			"Effect": "Allow",
			"Action": [
				"secretsmanager:DescribeSecret",
				"secretsmanager:GetSecretValue",
				"secretsmanager:CreateSecret",
				"secretsmanager:ListSecrets"
			],
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
3. Checkout to `staging` branch  (for staging deployment , for mainnet use `main`)
    ```bash
    git checkout staging
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
   > Deployment is on docker container 
    ```bash
    make deploy-to-aws
    ```
7. Provide all the inputs as the script asks.
    * AWS Region (default: `us-east-1`)
    * AMI ID
    * AWS Instance Type (default: `t3.medium`)
    * Attestor node name
    * AWS Secret Manager secret name for signing keys (default: `dev/verulink/attestor/signingservice`)
        - Ethereum private key
        - Ethereum wallet address
        - Aleo private key
        - Aleo wallet address
    * AWS Secret Manager secret name MTLS secret name (default: `dev/verulink/attestor/mtls`)
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
	docker logs -f attestor-chainservice-1
	```

## Troubleshooting
At times, keys may not be retrievable during installation. In such cases, we can manually attempt to fetch the keys by executing the following command:

If you haven't made any changes, the default SSH key name remains "attestor-ssh-key.pem."
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
2. You will be be notified if you want to continue or reconfigure
	```bash
	Do you want to continue (C) deployment or reconfigure (R)? 
	```
3. If you are using the same configuration like MTLS certificates, Ethereum and Aleo keys, we can just type "C" to **continue with deployment**. \
	If you are changing any of them, type "R" to **reconfigure** with new values.


