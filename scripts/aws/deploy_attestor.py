import boto3
import botocore.exceptions
import getpass
import json
import time
import subprocess
from jsonpath_ng import parse
import sys
import os
import pwinput
import time
import logging
import crypt
import socket
import shutil
from pathlib import Path
import random
import string
import yaml
import uuid
import requests

from ansible import context
from ansible.executor.playbook_executor import PlaybookExecutor
from ansible.inventory.manager import InventoryManager
from ansible.parsing.dataloader import DataLoader
from ansible.vars.manager import VariableManager
from ansible.playbook.play import Play



# Set up logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

BOLD_START = "\033[1m"
BOLD_END = "\033[0m"
INPUT_EMOJI = "⌨️"

chainservice_config = './chainservice/config.yaml'
playbook_path = './scripts/aws/deploy.yml'
secret_file = './scripts/aws/secret.json'

def deploy_attestor():
    logging.info("\n * * * Deploying Attestor service...🚀 \n")
    with open(secret_file, 'r') as f:
        data = json.load(f)

    public_ip_address = data['public_ip_address']
    ssh_keyfile = data['ssh_private_key']
    ansible_command = [
        'ansible-playbook',
        data['ansible_playbook'],
        '-i', f'{public_ip_address},',
        '-u', 'ubuntu',
        '--private-key', f"{ssh_keyfile}.pem"
    ]
    result = subprocess.run(ansible_command)

    if result.returncode == 0:
        logging.info("Playbook executed successfully.✅")
    else:
        logging.info("An error occurred while executing the playbook.")


def prompt_user_action():
    while True:
        action = input("Do you want to continue (C) deployment or reconfigure (R)? ").strip().lower()
        if action in ['c', 'r']:
            return action
        print("Invalid input. Please enter 'C' to continue or 'R' to reconfigure.")


config_done_flag = Path("./.temp/config.done")
if config_done_flag.exists():
    user_action = prompt_user_action()
    if user_action == 'c':
        print("Starting deployment...")
        deploy_attestor()
        exit()
    else:
        os.remove(config_done_flag)


def check_aws_authentication():
    # ANSI escape codes for colors
    RED = '\033[91m'
    END_COLOR = '\033[0m'

    try:
        # Attempt to create an AWS client using the default profile
        boto3.client('s3').list_buckets()
        logging.info("AWS authentication successful.")
        return True
    except botocore.exceptions.ClientError as e:
        # Handle specific error (InvalidAccessKeyId in this case)
        if e.response['Error']['Code'] == 'InvalidAccessKeyId':
            logging.error(f"{RED}AWS authentication error: Invalid AWS Access Key Id.{END_COLOR}")
        else:
            logging.error(f"{RED}AWS authentication error: {e}{END_COLOR}")
        return False

# Check AWS authentication status
if not check_aws_authentication():
    sys.exit(1)

def get_input(prompt, default):
    user_input = input(f"{BOLD_START}{INPUT_EMOJI}  {prompt} (default: {default}): {BOLD_END}").strip()
    return user_input if user_input else default

def get_latest_ubuntu_jammy_ami(region):
    ec2_client = boto3.client('ec2', region_name=region)
    filters = [
        {'Name': 'name', 'Values': ['ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*']},
        {'Name': 'owner-id', 'Values': ['099720109477']}  # Canonical's owner ID for Ubuntu
    ]
    response = ec2_client.describe_images(Filters=filters)
    if not response['Images']:
        raise ValueError(f"No Ubuntu Jammy (22.04) images found in {region}")

    # Sort images by creation date to get the latest one
    sorted_images = sorted(response['Images'], key=lambda x: x['CreationDate'], reverse=True)
    ami_id = sorted_images[0]['ImageId']
    return ami_id

def cleanup_keypair(key_name):
    key_file_path = f"{key_name}.pem"

    if os.path.exists(key_file_path):
        try:
            os.remove(key_file_path)
            logging.info(f"SSH key file '{key_name}.pem' removed successfully.")
        except OSError as e:
            logging.error(f"Error removing SSH key file '{key_name}.pem': {e}")
    else:
        logging.info(f"SSH key file '{key_name}.pem' does not exist.")

def copy_key_to_home_directory(key_name):
    key_file_path = f"{key_name}.pem"
    os.chmod(key_file_path, 0o600)
    subprocess.run(["cp", key_file_path, os.path.expanduser('~')])
    os.chmod(key_file_path, 0o400)
    logging.info(f"The key '{key_name}.pem' has been successfully copied to your home directory.✅")

def create_key_pair(ec2_client, key_name):
    try:
        keypair_response = ec2_client.create_key_pair(KeyName=key_name)
        cleanup_keypair(key_name)
        # Save the private key to a file
        with open(f"{key_name}.pem", "w") as key_file:
            key_file.write(keypair_response['KeyMaterial'])
        logging.info(f"New key pair '{key_name}' created and saved as {key_name}.pem ✅")
        copy_key_to_home_directory(key_name)
        ec2_client.create_tags(
            Resources=[keypair_response['KeyPairId']],
            Tags=[
                {'Key': 'Project', 'Value': 'verulink'},
                {'Key': 'Name', 'Value': key_name}
            ]
        )
        return key_name
    except botocore.exceptions.ClientError as e:
        if e.response['Error']['Code'] == 'InvalidKeyPair.Duplicate':
            logging.info(f"Key pair '{key_name}' already exists.")
            returned_key_name = handle_existing_keypair(ec2_client, key_name)
            return returned_key_name
        else:
            logging.error(f"AWS error: {e}")
            raise e

def handle_existing_keypair(ec2_client, key_name):
    reuse_existing = input(f"A key pair with the name '{key_name}' already exists. Do you want to reuse it? (yes/no): ").strip().lower()
    if reuse_existing == "yes":
        logging.info(f"Reusing existing key pair '{key_name}'")
        return key_name
    else:
        new_key_name = input("Enter a new key pair name: ").strip()
        create_key_pair(ec2_client, new_key_name)
        copy_key_to_home_directory(new_key_name)
        return new_key_name

# def create_secret(secret_name, default_secret_name, key_value_pairs, file = False):
#     # Check if a secret with the provided name exists and is not scheduled for deletion
#     secret_data_local = {}
#     existing_secret = None
#     try:
#         existing_secret = secrets_manager.describe_secret(SecretId=secret_name)
#         try:
#             if existing_secret['DeletedDate'] is not None:
#                 logging.info("A secret with this name is scheduled for deletion. Please choose a different name.")
#                 secret_name = input("Enter a new secret name: ")
#         except KeyError:
#             pass
#     except secrets_manager.exceptions.ResourceNotFoundException:
#         pass

#     if existing_secret:
#         reuse_secret = input("A secret with the provided name already exists. Do you want to reuse it? (yes/no): ").strip().lower()
#         if reuse_secret == "yes":
#             secret_arn = existing_secret['ARN']
#             logging.info(f"Reusing existing secret '{secret_name}' with ARN: {secret_arn}")
#         else:
#             secret_name = get_input("Enter secret name", default_secret_name)
#             for key, prompt_message in key_value_pairs:
#                 while True:
#                     if file:
#                         value = input(f"{prompt_message}: ")
#                         if os.path.isfile(value):
#                             with open(value, 'r') as file:
#                                 secret_data_local[key] = file.read()
#                             break
#                         else:
#                             logging.info("File does not exist. Please enter a valid file path.")
#                     else:
#                         value = pwinput.pwinput(prompt=f"{prompt_message}: ",mask='X')
#                         if value:
#                             secret_data_local[key] = value
#                             break
#                         else:
#                             logging.info("Value cannot be empty. Please enter a valid value.")

#             secret_value = json.dumps(secret_data)
#             secret_response = secrets_manager.create_secret(
#                 Name=secret_name,
#                 Description="Secret for Ethereum and Aleo",
#                 SecretString=secret_value
#             )

#             logging.info(f"Secret created successfully with ARN: {secret_response['ARN']}")
    
#             secret_arn = secret_response['ARN']
#             logging.info(f"Secret created with ARN: {secret_arn}✅")
#     else:
    
#         for key, prompt_message in key_value_pairs:
#                 while True:
#                     if file:
#                         value = input(f"{prompt_message}: ")
#                         if os.path.isfile(value):
#                             with open(value, 'r') as file:
#                                 secret_data_local[key] = file.read()
#                             break
#                         else:
#                             logging.info("File does not exist. Please enter a valid file path.")
#                     else:
#                         value = pwinput.pwinput(prompt=f"{prompt_message}: ",mask='X')
#                         if value:
#                             secret_data_local[key] = value
#                             break
#                         else:
#                             logging.info("Value cannot be empty. Please enter a valid value.")

#         secret_value = json.dumps(secret_data_local)
#         secret_response = secrets_manager.create_secret(
#             Name=secret_name,
#             Description="Secret for Ethereum and Aleo",
#             SecretString=secret_value
#         )

#         logging.info(f"Secret created successfully with ARN: {secret_response['ARN']}")
#         secret_arn = secret_response['ARN']
#     return secret_arn, secret_data_local

def create_secret(secret_name, default_secret_name, key_value_pairs, file=False):
    # Check if a secret with the provided name exists and is not scheduled for deletion
    secret_data_local = {}
    existing_secret = None
    try:
        existing_secret = secrets_manager.describe_secret(SecretId=secret_name)
        try:
            if existing_secret['DeletedDate'] is not None:
                logging.info("A secret with this name is scheduled for deletion. Please choose a different name.")
                secret_name = input("Enter a new secret name: ")
        except KeyError:
            pass
    except secrets_manager.exceptions.ResourceNotFoundException:
        pass

    if existing_secret:
        reuse_secret = input("A secret with the provided name already exists. Do you want to reuse it? (yes/no): ").strip().lower()
        if reuse_secret == "yes":
            secret_arn = existing_secret['ARN']
            logging.info(f"Reusing existing secret '{secret_name}' with ARN: {secret_arn}")

            # Fetch current secret values to allow updates
            secret_value = secrets_manager.get_secret_value(SecretId=secret_name)
            secret_data_local = json.loads(secret_value['SecretString'])

            # Ask the user if they want to update existing key-value pairs
            for key, prompt_message in key_value_pairs:
                if key in secret_data_local:
                    update_value = input(f"Do you want to update the value for '{key}'? (yes/no): ").strip().lower()
                    if update_value == "yes":
                        value = None
                        while True:
                            if file:
                                value = input(f"{prompt_message}: ")
                                if os.path.isfile(value):
                                    with open(value, 'r') as file_content:
                                        secret_data_local[key] = file_content.read()
                                    break
                                else:
                                    logging.info("File does not exist. Please enter a valid file path.")
                            else:
                                value = pwinput.pwinput(prompt=f"{prompt_message}: ", mask='X')
                                if value:
                                    secret_data_local[key] = value
                                    break
                                else:
                                    logging.info("Value cannot be empty. Please enter a valid value.")
                else:
                    # If the key doesn't exist, prompt the user to add a new value
                    logging.info(f"The key '{key}' does not exist. Adding new value.")
                    value = pwinput.pwinput(prompt=f"{prompt_message}: ", mask='X')
                    if value:
                        secret_data_local[key] = value

            # Update the secret with the new values
            secret_value_updated = json.dumps(secret_data_local)
            secret_response = secrets_manager.update_secret(
                SecretId=secret_name,
                Description="Updated secret for Ethereum and Aleo",
                SecretString=secret_value_updated
            )
            logging.info(f"Secret updated successfully with ARN: {secret_response['ARN']}")

        else:
            secret_name = get_input("Enter a new secret name", default_secret_name)
            for key, prompt_message in key_value_pairs:
                while True:
                    if file:
                        value = input(f"{prompt_message}: ")
                        if os.path.isfile(value):
                            with open(value, 'r') as file_content:
                                secret_data_local[key] = file_content.read()
                            break
                        else:
                            logging.info("File does not exist. Please enter a valid file path.")
                    else:
                        value = pwinput.pwinput(prompt=f"{prompt_message}: ", mask='X')
                        if value:
                            secret_data_local[key] = value
                            break
                        else:
                            logging.info("Value cannot be empty. Please enter a valid value.")

            secret_value = json.dumps(secret_data_local)
            secret_response = secrets_manager.create_secret(
                Name=secret_name,
                Description="Secret for Ethereum and Aleo",
                SecretString=secret_value
            )
            logging.info(f"Secret created successfully with ARN: {secret_response['ARN']}")
    else:
        # Secret does not exist, create a new one
        for key, prompt_message in key_value_pairs:
            while True:
                if file:
                    value = input(f"{prompt_message}: ")
                    if os.path.isfile(value):
                        with open(value, 'r') as file_content:
                            secret_data_local[key] = file_content.read()
                        break
                    else:
                        logging.info("File does not exist. Please enter a valid file path.")
                else:
                    value = pwinput.pwinput(prompt=f"{prompt_message}: ", mask='X')
                    if value:
                        secret_data_local[key] = value
                        break
                    else:
                        logging.info("Value cannot be empty. Please enter a valid value.")

        secret_value = json.dumps(secret_data_local)
        secret_response = secrets_manager.create_secret(
            Name=secret_name,
            Description="Secret for Ethereum and Aleo",
            SecretString=secret_value
        )
        logging.info(f"Secret created successfully with ARN: {secret_response['ARN']}")

    return secret_response['ARN'], secret_data_local

def add_sg_rule(security_group_id):
    try:
        ec2_client.authorize_security_group_ingress(
            GroupId=security_group_id,
            IpProtocol='tcp',
            FromPort=22,
            ToPort=22,
            CidrIp='0.0.0.0/0'
        )

        # ec2_client.authorize_security_group_ingress(
        #     GroupId=security_group_id,
        #     IpProtocol='tcp',
        #     FromPort=8080,  # Modify the port number as needed
        #     ToPort=8080,    # Modify the port number as needed
        #     CidrIp='0.0.0.0/0'
        # )
    except:
        print(f"An error occurred while updating firewall")

def check_port(host, port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.settimeout(5)  # 5 seconds timeout
        result = sock.connect_ex((host, port))
        return result == 0

def get_branch_and_repo():
    try:
        branch_name = subprocess.run(['git', 'rev-parse', '--abbrev-ref', 'HEAD'], capture_output=True, text=True, check=True).stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error getting current branch name: {e}")
        branch_name = 'main'  # Default to 'main' branch if there's an error

    try:
        # Get the repository URL using Git command
        repo_url = subprocess.run(['git', 'remote', 'get-url', 'origin'], capture_output=True, text=True, check=True).stdout.strip()
    except subprocess.CalledProcessError as e:
        print(f"Error getting repository URL: {e}")
        repo_url = None

    return branch_name, repo_url

def generate_random_string(length):
    characters = string.ascii_letters + string.digits
    return ''.join(random.choice(characters) for _ in range(length))

def create_config_template(config_file):
    with open(config_file, 'r') as file:
        yaml_content = file.read()
        data = yaml.safe_load(yaml_content)
        aleo_wallet_placeholder = "{{ aleo_wallet_address }}"
        ethereum_wallet_placeholder = "{{ ethereum_wallet_address }}"
        for chain in data['chains']:
            if chain['name'] == 'aleo':
                chain['wallet_address'] = aleo_wallet_placeholder
            elif chain['name'] == 'ethereum':
                chain['wallet_address'] = ethereum_wallet_placeholder
    yaml_str = yaml.dump(data, default_flow_style=False, sort_keys=False)
    yaml_str = yaml_str.replace("'{{ aleo_wallet_address }}'", '{{ aleo_wallet_address }}')
    yaml_str = yaml_str.replace("'{{ ethereum_wallet_address }}'", '{{ ethereum_wallet_address }}')

    template_file = config_file + '.j2'
    # Write the updated content to a Jinja2 template file
    with open(template_file, 'w') as file:
        file.write(yaml_str)
    print("Jinja2 template created successfully.")

######################################
###  AWS Configuration starts here ###
######################################  

# Get AWS region with default value
region = get_input("Enter AWS region", "us-east-1")
ami_id = ''
try:
    # Get the latest Ubuntu Jammy AMI ID
    ami_id = get_latest_ubuntu_jammy_ami(region)
    logging.info(f"Latest Ubuntu Jammy (22.04) AMI ID in {region}: {ami_id}")
except Exception as e:
    logging.info(f"Error: {e}")

# Create an EC2 client
ec2_client = boto3.client('ec2', region_name=region)

ami_id = get_input("Enter AMI ID", ami_id)
instance_type = get_input("Enter instance type", "t3.medium")

# Specify the desired root disk size (in GB)
desired_root_disk_size_gb = 25

# Attestor name
if os.path.exists(secret_file):
        with open(secret_file, 'r') as f:
            data = json.load(f)
        
        if 'attestor_name' in data:
            attestor_name = data['attestor_name']
        else:
            attestor_name = get_input("Enter attestor name", "mainnet_attestor_verulink_" + generate_random_string(5))

else:
    attestor_name = get_input("Enter attestor name", "mainnet_attestor_verulink_" + generate_random_string(5))

key_name = attestor_name + "-ssh-key"
new_key_name = create_key_pair(ec2_client, key_name)

secrets_manager = boto3.client('secretsmanager', region_name=region)

secret_data = {}

key_value_pairs = [
    ("ethereum_private_key", "Enter Ethereum private key"),
    ("ethereum_wallet_address", "Enter Ethereum wallet address"),
    ("aleo_private_key", "Enter Aleo private key"),
    ("aleo_wallet_address", "Enter Aleo wallet address")
]

# Get input for the secret name
secret_name = get_input("Enter secret name", "mainnet/verulink/attestor/signingservice")
secret_arn, secret_data = create_secret( secret_name, "mainnet/verulink/attestor/signingservice", key_value_pairs)

# Store Attestor MTLS Certificate and Keys on AWS Secret manager
key_value_pairs = [
    ("ca_certificate", "Enter MTLS ca certificate file"),
    ("attestor_certificate", "Enter attestor certificate file"),
    ("attestor_key", "Enter attestor key file")
]
print("Configuring MTLS...")
mtls_secret_name = get_input("Enter MTLS secret name", "mainnet/verulink/attestor/mtls")
mtls_secret_arn, mtls_secret_data = create_secret( mtls_secret_name, "mainnet/verulink/attestor/signingservice", key_value_pairs, file = True)

print("Configuring DB Service and Prometheus Connection..")
collector_service_url = get_input("Enter collector service url", "")
prometheus_pushgateway_url = get_input("Enter prometheus pushgateway url", "")

iam_client = boto3.client('iam')

role_name = 'EC2SecretsManagerRole'

assume_role_policy_document = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }
    ]
}

try:
    role_response = iam_client.create_role(
        RoleName=role_name,
        AssumeRolePolicyDocument=json.dumps(assume_role_policy_document)
    )
    role_arn = role_response['Role']['Arn']
    logging.info(f"IAM role {role_name} created with ARN: {role_arn}")
except iam_client.exceptions.EntityAlreadyExistsException:
    role_arn = iam_client.get_role(RoleName=role_name)['Role']['Arn']
    logging.info(f"IAM role {role_name} already exists. Using existing ARN: {role_arn}")


policy_document = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": "secretsmanager:GetSecretValue",
            "Resource": [secret_arn, mtls_secret_arn]
        }
    ]
}

permissions_policy_arn = 'arn:aws:iam::aws:policy/SecretsManagerReadWrite'

# Create an instance profile
instance_profile_name = f'{role_name}-Instance-Profile'
try:
    create_instance_profile_response = iam_client.create_instance_profile(
        InstanceProfileName=instance_profile_name
    )
    instance_profile_arn = create_instance_profile_response['InstanceProfile']['Arn']
    logging.info(f"Instance profile '{instance_profile_name}' created with ARN: {instance_profile_arn}✅")

    # Add the IAM role to the instance profile
    iam_client.add_role_to_instance_profile(
        InstanceProfileName=instance_profile_name,
        RoleName=role_name
    )
    logging.info(f"IAM role '{role_name}' added to instance profile '{instance_profile_name}'✅")
except iam_client.exceptions.EntityAlreadyExistsException:
    # If the instance profile already exists, retrieve its ARN
    instance_profile_arn = iam_client.get_instance_profile(InstanceProfileName=instance_profile_name)['InstanceProfile']['Arn']
    logging.info(f"Instance profile '{instance_profile_name}' already exists. Using existing ARN: {instance_profile_arn}")



iam_client.put_role_policy(
    RoleName=role_name,
    PolicyName='SecretsManagerAccessPolicy',
    PolicyDocument=json.dumps(policy_document)
)

logging.info(f"IAM role {role_name} created with ARN: {role_arn}")

# Tag the IAM role
iam_client.tag_role(
    RoleName=role_name,
    Tags=[
        {'Key': 'Project', 'Value': 'verulink'},
        {'Key': 'Name', 'Value': 'aleo-attestor-role'}
    ]
)

default_sg_name = 'mainnet-attestor-sg'  # Default security group name
default_sg_description = 'Default security group for attestor'  # Default security group description

existing_security_groups = ec2_client.describe_security_groups(
    Filters=[{'Name': 'group-name', 'Values': [default_sg_name]}]
)

if existing_security_groups['SecurityGroups']:
    security_group_id = existing_security_groups['SecurityGroups'][0]['GroupId']
    logging.info(f"Using existing security group '{default_sg_name}' with ID {security_group_id}")
else:
    # Create a new security group if it doesn't exist
    security_group_response = ec2_client.create_security_group(
        GroupName=default_sg_name,
        Description=default_sg_description
    )
    security_group_id = security_group_response['GroupId']
    logging.info(f"New security group '{default_sg_name}' created with ID {security_group_id}")

    add_sg_rule(security_group_id) 

# Specify the parameters for the new EC2 instance
print(role_arn)
instance_params = {
    'ImageId': ami_id,
    'InstanceType': instance_type,
    'KeyName': new_key_name,
    'SecurityGroupIds': [security_group_id],
    'MaxCount': 1,
    'MinCount': 1,
    'BlockDeviceMappings': [
        {
            'DeviceName': '/dev/sda1',
            'Ebs': {
                'VolumeSize': desired_root_disk_size_gb,
                'VolumeType': 'gp2' 
            }
        }
    ]
}

# Check if an EC2 instance with specific tags already exists
existing_instances = ec2_client.describe_instances(
    Filters=[
        {'Name': 'tag:Project', 'Values': ['verulink']},
        {'Name': 'tag:Name', 'Values': [attestor_name]},
        {'Name': 'tag:Environment', 'Values': ['Mainnet']},
        {'Name': 'instance-state-name', 'Values': ['running']}
    ]
)
if existing_instances['Reservations']:
    logging.info("An EC2 instance with the specified tags already exists.")
    # Extract instance IDs using JSONPath
    jsonpath_expr = parse("$.Reservations[*].Instances[0].InstanceId")
    instance_id = [match.value for match in jsonpath_expr.find(existing_instances)][0]
    delete_existing = input("Do you want to delete the existing instance? (yes/no): ").strip().lower()
    if delete_existing == "yes":
        # Extract the instance ID(s) to delete
        instance_ids_to_delete = [instance['InstanceId'] for reservation in existing_instances['Reservations'] for instance in reservation['Instances']]
        
        # Terminate the existing instance(s)
        ec2_client.terminate_instances(InstanceIds=instance_ids_to_delete)
        logging.info("Existing instance(s) terminated successfully.")
    
        logging.info("Creating ec2 instance...")
        response = ec2_client.run_instances(**instance_params)

        # Extract the instance ID from the response
        instance_id = response['Instances'][0]['InstanceId']

        # Tag the EC2 instance
        ec2_client.create_tags(
            Resources=[instance_id],
            Tags=[
                {'Key': 'Project', 'Value': 'verulink'},
                {'Key': 'Name', 'Value': attestor_name},
                {'Key': 'Environment', 'Value': 'Mainnet'}
            ]
        )

        logging.info("Attache iam role...")

        # Extract the instance ID from the response
        instance_id = response['Instances'][0]['InstanceId']
        # Wait until the instance is running
        logging.info("Waiting for EC2 instance to be in 'running' state...██▓░️░️░️░️░️░️░️")
        waiter = ec2_client.get_waiter('instance_running')
        waiter.wait(InstanceIds=[instance_id])
        logging.info(f"EC2 instance with ID {instance_id} is now running.✅")
        logging.info("Attaching IAM role to EC2 instance...")

        # Associate IAM instance profile with the EC2 instance
        try:
            associate_response = ec2_client.associate_iam_instance_profile(
                IamInstanceProfile={
                    'Arn': instance_profile_arn
                },
                InstanceId=instance_id
            )
            logging.info(f"IAM role {role_arn} attached to EC2 instance {instance_id} successfully.✅")
        except Exception as e:
            logging.info(f"Error attaching IAM role: {str(e)}")
    else:
        logging.info("Using existing instance.")
else:
    logging.info("No existing EC2 instance found with the specified tags.")
        
    # Launch the EC2 instance
    logging.info("Creating ec2 instance...")
    response = ec2_client.run_instances(**instance_params)
    
    # Extract the instance ID from the response
    instance_id = response['Instances'][0]['InstanceId']
    
    # Tag the EC2 instance
    ec2_client.create_tags(
        Resources=[instance_id],
        Tags=[
            {'Key': 'Project', 'Value': 'verulink'},
            {'Key': 'Name', 'Value': attestor_name},
            {'Key': 'Environment', 'Value': 'Mainnet'}
        ]
    )
    
    logging.info("Attache iam role...")
    
    # Extract the instance ID from the response
    instance_id = response['Instances'][0]['InstanceId']
    # Wait until the instance is running
    logging.info("Waiting for EC2 instance to be in 'running' state...██▓░️░️░️░️░️░️░️")
    waiter = ec2_client.get_waiter('instance_running')
    waiter.wait(InstanceIds=[instance_id])
    logging.info(f"EC2 instance with ID {instance_id} is now running.✅")
    logging.info("Attaching IAM role to EC2 instance...")

    # Associate IAM instance profile with the EC2 instance
    try:
        associate_response = ec2_client.associate_iam_instance_profile(
            IamInstanceProfile={
                'Arn': instance_profile_arn
            },
            InstanceId=instance_id
        )
        logging.info(f"IAM role {role_arn} attached to EC2 instance {instance_id} successfully.")
    except Exception as e:
        logging.info(f"Error attaching IAM role: {str(e)}")
    
    
    logging.info(f"EC2 instance with ID {instance_id} has been created and IAM instance profile associated.")
    logging.info(f"EC2 instance with ID {instance_id} has been created.")
    
# Describe the instance
response = ec2_client.describe_instances(InstanceIds=[instance_id])
# Extract public IP address
try:
    public_ip_address = response['Reservations'][0]['Instances'][0]['PublicIpAddress']
    logging.info(f"Public IP address of instance {instance_id}: {public_ip_address}")
except KeyError:
    logging.info(f"No public IP address found for instance {instance_id}")

# Initialize the EC2 resource
ec2_resource = boto3.resource('ec2')

# Get the instance object
instance = ec2_resource.Instance(instance_id)

# Wait until the instance is running
instance.wait_until_running()

logging.info(f"Instance {instance_id} is now running.")

## Configure Attestor service
# Install Ansible
logging.info("Checking Ansible connection to the newly created EC2 instance...")
ansible_command = [
    "ansible",
    "all", 
    "-i", f'{public_ip_address},',
    "-u", "ubuntu",
    "-m", "ping",
    "--private-key", f"{new_key_name}.pem"
]
subprocess.run(ansible_command, capture_output=True)
ansible_process = subprocess.run(ansible_command, capture_output=True)
for attempt in range(2):
    if ansible_process.returncode == 0:
        logging.info("Ansible connection test successful. You can now proceed with further configurations.✅")
        break
    else:
        print("Checking security group rules...")
        if check_port(public_ip_address, 22):
            logging.info("Port 22 is open. The issue might be with Ansible configuration.")
        else:
            logging.info("Port 22 is not open. Updating security group rules.")
            add_sg_rule(security_group_id)
            logging.info("Security group rules updated. Retrying Ansible connection test...")



# sudo_pass = pwinput.pwinput(prompt=f"Input sudo password: ",mask='X')

# yescrypt_hash = generate_yescrypt_hash(sudo_pass)
# github_username = input("Enter a github user name: ").strip()
# github_pass = pwinput.pwinput(prompt=f"Input Github Password: ",mask='X')

# Store Attestor MTLS Certificate and Keys on AWS Secret manager
# key_value_pairs = [
#     ("sudo_pass", "Input sudo password")
# ]
# print("Configuring sudoers...")
# sudo_secret_name = get_input("Enter secret name for sudo password", "dev/verulink/attestor/sudo_pass")
# sudo_secret_arn, sudo_secret_data = create_secret( sudo_secret_name, "dev/verulink/attestor/sudo_pass", key_value_pairs, file = False)


# Zip code repo
temp_dir = './.temp'
if os.path.exists(temp_dir):
    try:
        print("Cleaning up temp files")
        shutil.rmtree(temp_dir)
    except OSError as e:
        print(f"Error: {temp_dir} : {e.strerror}")

os.makedirs(temp_dir, exist_ok=True)
branch, url = get_branch_and_repo()
clone_command = ['git', 'clone', '--single-branch', '--branch', branch, url, temp_dir]
# subprocess.run(clone_command, check=True)
try:
    result = subprocess.run(clone_command, check=True, timeout=600)
except subprocess.TimeoutExpired:
    print("Command timed out. Handle slow network or long-running command scenario.")
except subprocess.CalledProcessError as e:
    print(f"Command failed with return code {e.returncode}.")        
zip_file = shutil.make_archive(temp_dir, 'zip', temp_dir)

def get_machine_id():
    return uuid.getnode()

def get_instance_id():
    try:
        response = requests.get("http://169.254.169.254/latest/meta-data/instance-id", timeout=2)
        if response.status_code == 200:
            return response.text
        else:
            raise Exception("Unable to retrieve instance-id.")
    except requests.RequestException as e:
        print(f"Error fetching instance-id: {e}")
        random_id = ''.join(random.choices(string.ascii_lowercase + string.digits, k=10))
        return f"i-{random_id}"
    

# Create a dictionary with the parameters
current_directory = os.path.abspath(os.getcwd())
secret_data = {
    "public_ip_address": public_ip_address,
    "secret_name": secret_name,
    "mtls_secret_name": mtls_secret_name,
    "install_artifact": zip_file,
    # "sudo_password": sudo_secret_name,
    # "sudo_secret_name": sudo_secret_name,
    "ssh_private_key": new_key_name,
    "ansible_playbook": playbook_path,
    "attestor_name": attestor_name,
    "aws_region": region,
    "signer_username": get_machine_id(),
    "signer_password": get_instance_id(),
    "collector_service_url": collector_service_url,
    "prometheus_pushgateway_url": prometheus_pushgateway_url
    # "github_username": github_username,
    # "github_pass": github_pass
}

try:
    os.chmod('./scripts/aws/secret.json', 0o600)
except Exception as e:
    print("Cound not change permission")

# Write the dictionary to a JSON file named secret.json
with open('./scripts/aws/secret.json', 'w') as json_file:
    json.dump(secret_data, json_file)

os.chmod('./scripts/aws/secret.json', 0o400)
# Specify the filename for the inventory file
inventory_file = "inventory.txt"

# Write the inventory content to the file
with open(inventory_file, "w") as f:
    f.write("[all]\n")
    f.write(public_ip_address)

# convert chainService config.yaml to ansible jinja2 template
create_config_template('./attestor/chainService/config.yaml')
## Set configuration done flag
with open("./.temp/config.done", 'w') as file:
    file.write('OK')
print("### ☁️ Attestor node configuration complete ✅")
deploy_attestor()