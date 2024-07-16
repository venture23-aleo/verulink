## Attestor Server Deployment Guide
The attestor service can be deployed using two method
1. From local device
> To run from a local device, please make sure the AWS CLI tool and AWS access credentials have been correctly configured. 
  [Follow steps here.](#to-configure-aws-access) 
2. Using AWS CloudShell from the AWS Management Console UI(Recommended)
## Steps

Using AWS cloudShell, we don't need to install the dependencies to run the installer script.

### To Configure AWS access
1. Install [_**AWS CLI Tool**_](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)  
2. Add IAM permission to user  
The user running the installer script should have the following IAM permissions.
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
				"secretsmanager:CreateSecret"
			],
			"Resource": "*"
		}
	]
	}
```
</details>  

[Creating and Attaching IAM Policy to user](https://docs.aws.amazon.com/IAM/latest/UserGuide/tutorial_managed-policies.html)

3. Create AWS Access key  
[To create AWS Access key](https://docs.aws.amazon.com/IAM/latest/UserGuide/id_credentials_access-keys.html#Using_CreateAccessKey)  
		
4. Configuring aws credentials using Environment variables
    Set AWS credentials and region as environment variables  
    ```bash
    exportAWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
    export AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMIK7MDENG/ bPxRfiCYEXAMPLEKEY
    export AWS_DEFAULT_REGION=us-east-1
    ```
    [Refer to this AWS documentation for other environment](https://docs.aws.amazon.com/cli/latest/userguide/cli-configure-envvars.html#envvars-set)

### Deployment Steps:
1. Clone the github project repository
    ```bash
    git clone https://github.com/venture23-aleo/verulink.git
    ```
2. cd into project directory 
   ```bash
   cd verulink
   ```
3. Setup python virtual environment
    ```bash
    make python-venv
    ```
2. Activate python virtual environment
    ```bash
    source venv/bin/activate
    ```
2. Run the script
    ```bash
    make deploy-to-aws
    ```
3. Provide all the inputs as the script asks.
4. Once successfully deployed, save the SSH key of the machine located in your home directory.
5. If using CloudShell, download the key by going to **Actions** and selecting **Download file**. _Input the correct full path of the key file_.

### Troubleshooting
At times, keys may not be retrievable during installation. In such cases, we can manually attempt to fetch the keys by executing the following command:

If you haven't made any changes, the default SSH key name remains "attestor-ssh-key.pem."
```bash
ansible-playbook scripts/aws/deploy.yml -i inventory.txt -u ubuntu --private-keys=<ssh_key_name> --tags debug,retrieve_secret

```

If the attestor deployment phase encounters an installation failure, we should proceed by running the Ansible playbook only for the remaining deployment tasks.

```bash
ansible-playbook scripts/aws/deploy.yml -i inventory.txt -u ubuntu --private-key=<ssh_key_name>
```
Alternatively, we can directly provide the public IP of the AWS EC2 instance instead of inventory.txt file
```bash
ansible-playbook scripts/aws/deploy.yml -i 54.198.147.67, -u ubuntu --private-key attestor-ssh-key.pem
```


