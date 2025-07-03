import google.auth
import google.auth.exceptions
import google.cloud.compute_v1 as compute_v1
import google.cloud.secretmanager_v1 as secretmanager
from googleapiclient import discovery
from googleapiclient.errors import HttpError
import getpass
import json
import time
import subprocess
import sys
import os
import pwinput
import logging
import socket
import shutil
from pathlib import Path
import random
import string
import yaml
import uuid
import requests
from google.auth import default
from google.cloud import secretmanager_v1
from google.cloud import compute_v1
from google.api_core import exceptions as google_exceptions
from google.oauth2 import service_account
from google.auth import default
from google.auth.transport.requests import Request
import re
from googleapiclient.discovery import build

# Set up logging configuration
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S')

# Global color definitions
BOLD_START = "\033[1m"
BOLD_END = "\033[0m"
INPUT_EMOJI = "⌨️"
SUCCESS_EMOJI = "✅"
ERROR_EMOJI = "❌"
CLOUD_EMOJI = "☁️"
RED = '\033[91m'
GREEN = '\033[92m'
BLUE = '\033[94m'
YELLOW = '\033[93m'
END_COLOR = '\033[0m'

chainservice_config = './chainservice/config.yaml'
playbook_path = './scripts/gcp/deploy.yml'
secret_file = './scripts/gcp/secret.json'
config_file = './scripts/gcp/config.json'

def prompt_deployment_mode():
    """Prompt user to choose deployment mode"""
    print(f"\n{BLUE}🚀 Choose Deployment Mode:{END_COLOR}")
    print(f"{BLUE}1. Default Network - Create new GCP instance with default network{END_COLOR}")
    print(f"{BLUE}2. User-Configured Machine - Deploy to existing machine (provide IP and SSH key){END_COLOR}")
    
    while True:
        choice = input(f"{BOLD_START}{INPUT_EMOJI}  Enter your choice (1 or 2): {BOLD_END}").strip()
        if choice in ['1', '2']:
            return choice
        print(f"{RED}❌ Invalid choice. Please enter 1 or 2.{END_COLOR}")

def get_user_machine_details():
    """Get IP address and SSH key details from user for existing machine"""
    while True:  # Main retry loop
        print(f"\n{BLUE}📋 User-Configured Machine Details:{END_COLOR}")
        
        # Get IP address
        while True:
            ip_address = input(f"{BOLD_START}{INPUT_EMOJI}  Enter the machine's IP address: {BOLD_END}").strip()
            if ip_address:
                # Basic IP validation
                try:
                    socket.inet_aton(ip_address)
                    break
                except socket.error:
                    print(f"{RED}❌ Invalid IP address format. Please enter a valid IP address.{END_COLOR}")
            else:
                print(f"{RED}❌ IP address is required.{END_COLOR}")
        
        # Get SSH key path
        while True:
            ssh_key_path = input(f"{BOLD_START}{INPUT_EMOJI}  Enter path to SSH private key file: {BOLD_END}").strip()
            if ssh_key_path and os.path.exists(ssh_key_path):
                break
            elif not ssh_key_path:
                print(f"{RED}❌ SSH key path is required.{END_COLOR}")
            else:
                print(f"{RED}❌ SSH key file not found at: {ssh_key_path}{END_COLOR}")
        
        # Test SSH connection
        print(f"\n{BLUE}🔍 Testing SSH connection to {ip_address}...{END_COLOR}")
        ssh_test_command = [
            "ssh", "-i", ssh_key_path, "-o", "ConnectTimeout=10", 
            "-o", "StrictHostKeyChecking=no", f"ubuntu@{ip_address}", "echo 'SSH connection successful'"
        ]
        
        try:
            result = subprocess.run(ssh_test_command, capture_output=True, text=True, timeout=15)
            if result.returncode == 0:
                print(f"{GREEN}✅ SSH connection successful!{END_COLOR}")
                return ip_address, ssh_key_path
            else:
                print(f"{RED}❌ SSH connection failed: {result.stderr.strip()}{END_COLOR}")
                retry = input(f"{BOLD_START}Do you want to retry with different details? (y/n): {BOLD_END}").strip().lower()
                if retry != 'y':
                    sys.exit(1)
                # Continue the main loop to ask for details again
                continue
        except subprocess.TimeoutExpired:
            print(f"{RED}❌ SSH connection timed out.{END_COLOR}")
            retry = input(f"{BOLD_START}Do you want to retry with different details? (y/n): {BOLD_END}").strip().lower()
            if retry != 'y':
                sys.exit(1)
            # Continue the main loop to ask for details again
            continue
        except Exception as e:
            print(f"{RED}❌ SSH connection error: {e}{END_COLOR}")
            retry = input(f"{BOLD_START}Do you want to retry with different details? (y/n): {BOLD_END}").strip().lower()
            if retry != 'y':
                sys.exit(1)
            # Continue the main loop to ask for details again
            continue

def get_machine_id():
    return uuid.getnode()

def deploy_to_user_machine(ip_address, ssh_key_path):
    """Deploy attestor to user-provided machine"""
    print(f"\n{BLUE}🚀 Deploying to user-provided machine: {ip_address}{END_COLOR}")
    
    # Load saved configuration
    saved_config = load_config()
    
    # Create GCP clients (only for Secret Manager)
    secret_manager_client = secretmanager.SecretManagerServiceClient()
    
    # Attestor name
    default_name = "mainnet-attestor-verulink-" + generate_random_string(5).lower()
    attestor_name = get_input_with_default("Enter attestor name", default_name, "attestor_name", saved_config)
    
    # Sanitize the attestor name for GCP compliance
    attestor_name = sanitize_resource_name(attestor_name)
    logging.info(f"Using sanitized attestor name: {attestor_name}")
    
    # Create secrets (same as default mode)
    secret_data = {}
    
    key_value_pairs = [
        ("ethereum_private_key", "Enter Ethereum private key"),
        ("ethereum_wallet_address", "Enter Ethereum wallet address"),
        ("aleo_private_key", "Enter Aleo private key"),
        ("aleo_wallet_address", "Enter Aleo wallet address")
    ]
    
    # Get input for the secret name
    secret_name = get_input_with_default("Enter secret name", "devnet-verulink-attestor-signingservice", "secret_name", saved_config)
    secret_path, secret_data = create_secret(secret_manager_client, project_id, secret_name, "devnet-verulink-attestor-signingservice", key_value_pairs)
    
    # Store Attestor MTLS Certificate and Keys on GCP Secret Manager
    key_value_pairs = [
        ("ca_certificate", "Enter MTLS ca certificate file"),
        ("attestor_certificate", "Enter attestor certificate file"),
        ("attestor_key", "Enter attestor key file")
    ]
    print("Configuring MTLS...")
    mtls_secret_name = get_input_with_default("Enter MTLS secret name", "devnet-verulink-attestor-mtls", "mtls_secret_name", saved_config)
    mtls_secret_path, mtls_secret_data = create_secret(secret_manager_client, project_id, mtls_secret_name, "devnet-verulink-attestor-mtls", key_value_pairs, file=True)
    
    print("Configuring DB Service and Prometheus Connection..")
    collector_service_url = get_input_with_default("Enter collector service url", "", "collector_service_url", saved_config)
    prometheus_pushgateway_url = get_input_with_default("Enter prometheus pushgateway url", "", "prometheus_pushgateway_url", saved_config)
    
    # Create service account for the user-provided machine
    print(f"\n{BLUE}🔐 Creating GCP Service Account for user-provided machine...{END_COLOR}")
    service_account_name = "verulink-attestor-sa"
    service_account_email = f"{service_account_name}@{project_id}.iam.gserviceaccount.com"
    
    # Define custom role variables
    custom_role_id = "AttestorSecretManagerReadAccess"
    custom_role_name = f"projects/{project_id}/roles/{custom_role_id}"
    
    # Create service account
    print(f"{BLUE}Creating service account: {service_account_email}{END_COLOR}")
    create_service_account(project_id, service_account_name, service_account_email)
    
    # Check if service account already has the required roles
    has_custom_role, has_builtin_role = check_service_account_roles(
        project_id, service_account_email, custom_role_name, "roles/secretmanager.secretAccessor"
    )
    
    # Only create/bind roles if they don't already exist
    if not has_custom_role and not has_builtin_role:
        # Create custom role for Secret Manager access
        print(f"{BLUE}Creating custom role for Secret Manager access{END_COLOR}")
        custom_role_created = create_custom_role(project_id, custom_role_id, custom_role_name)
        if custom_role_created:
            # Bind role to service account
            print(f"{BLUE}Binding role to service account{END_COLOR}")
            bind_role_to_service_account(project_id, service_account_email, custom_role_name, custom_role_id)
        else:
            # Use built-in Secret Manager role as fallback
            print(f"{BLUE}Binding built-in Secret Manager role to service account{END_COLOR}")
            bind_builtin_role_to_service_account(project_id, service_account_email, "roles/secretmanager.secretAccessor")
    else:
        print(f"{GREEN}✅ Service account already has required permissions{END_COLOR}")
    
    # Grant service account user permissions
    print(f"{BLUE}Granting service account user permissions{END_COLOR}")
    # Get caller identity for service account user grant
    try:
        from google.auth import default
        creds, project = default()
        caller_identity = creds.service_account_email if hasattr(creds, 'service_account_email') else None
        if caller_identity:
            # Check if service account user permission is already granted
            if not check_service_account_user_permission(project_id, service_account_email, caller_identity):
                grant_service_account_user(project_id, service_account_email, caller_identity, creds)
            else:
                print(f"{GREEN}✅ Service account user permission already granted{END_COLOR}")
    except Exception as e:
        print(f"{YELLOW}⚠️  Warning: Could not grant service account user permissions: {e}{END_COLOR}")
        print(f"{BLUE}   You may need to manually grant permissions to the service account{END_COLOR}")
    
    print(f"{GREEN}✅ Service account created and configured successfully!{END_COLOR}")
    
    # Automatically attach service account to the user-provided machine using GCP SDK
    print(f"{BLUE}🔗 Automatically attaching service account to user-provided machine...{END_COLOR}")
    
    try:
        # Use GCP SDK to attach service account to VM
        # First, we need to find the VM instance by IP address
        compute = build('compute', 'v1', credentials=creds)
        
        # List all instances in the project to find the one with matching IP
        print(f"{BLUE}🔍 Searching for VM instance with IP {ip_address}...{END_COLOR}")
        
        # Get all zones in the project
        zones_response = compute.zones().list(project=project_id).execute()
        zones = [zone['name'] for zone in zones_response.get('items', [])]
        
        instance_found = False
        target_instance = None
        target_zone = None
        
        for zone in zones:
            try:
                instances_response = compute.instances().list(project=project_id, zone=zone).execute()
                instances = instances_response.get('items', [])
                
                for instance in instances:
                    # Check network interfaces for the IP address
                    for network_interface in instance.get('networkInterfaces', []):
                        if network_interface.get('accessConfigs'):
                            for access_config in network_interface['accessConfigs']:
                                if access_config.get('natIP') == ip_address:
                                    target_instance = instance
                                    target_zone = zone
                                    instance_found = True
                                    break
                        if instance_found:
                            break
                    if instance_found:
                        break
                if instance_found:
                    break
            except Exception as e:
                print(f"{BLUE}   Checking zone {zone}... (skipped due to error: {e}){END_COLOR}")
                continue
        
        if not instance_found:
            print(f"{YELLOW}⚠️  Could not find VM instance with IP {ip_address}{END_COLOR}")
            print(f"{BLUE}   The VM might not be in this GCP project or the IP might be different{END_COLOR}")
            print(f"{BLUE}   You need to manually attach the service account:{END_COLOR}")
            print(f"{BLUE}   Service Account Email: {service_account_email}{END_COLOR}")
            print(f"\n{BLUE}📋 Manual Steps:{END_COLOR}")
            print(f"{BLUE}1. Go to Google Cloud Console: https://console.cloud.google.com{END_COLOR}")
            print(f"{BLUE}2. Navigate to Compute Engine > VM instances{END_COLOR}")
            print(f"{BLUE}3. Find your VM instance and click on it{END_COLOR}")
            print(f"{BLUE}4. Click 'Edit' at the top of the page{END_COLOR}")
            print(f"{BLUE}5. Scroll down to 'Security and access' section{END_COLOR}")
            print(f"{BLUE}6. Under 'Service account', select 'Custom'{END_COLOR}")
            print(f"{BLUE}7. Choose the service account: {service_account_email}{END_COLOR}")
            print(f"{BLUE}8. Set access scopes to: 'Allow full access to all Cloud APIs' (recommended) or custom scopes:{END_COLOR}")
            print(f"{BLUE}   - Cloud Platform, Compute Engine, Secret Manager{END_COLOR}")
            print(f"{BLUE}9. Click 'Save' at the bottom{END_COLOR}")
            print(f"{BLUE}10. Wait for the instance to restart{END_COLOR}")
            print(f"\n{YELLOW}⚠️  Note: The VM must be powered off before you can change the service account.{END_COLOR}")
            print(f"{YELLOW}   If the VM is running, stop it first, then make the changes, and restart it.{END_COLOR}")
            print(f"\n{YELLOW}⚠️  Note: If your VM has an ephemeral IP address, the IP may change after restart.{END_COLOR}")
            print(f"{YELLOW}   You may need to update the IP address in scripts/gcp/secret.json after the restart.{END_COLOR}")
            
            while True:
                choice = input(f"\n{BOLD_START}Press Enter to continue with deployment, or 'q' to quit: {BOLD_END}").strip().lower()
                if choice == 'q':
                    print(f"{BLUE}Deployment cancelled. You can run the script again later.{END_COLOR}")
                    sys.exit(0)
                elif choice == '':
                    print(f"{BLUE}Continuing with deployment...{END_COLOR}")
                    break
                else:
                    print(f"{RED}Invalid input. Press Enter to continue or 'q' to quit.{END_COLOR}")
        else:
            print(f"{GREEN}✅ Found VM instance: {target_instance['name']} in zone: {target_zone}{END_COLOR}")
            
            # Check if service account is already attached
            current_service_account = target_instance.get('serviceAccounts', [{}])[0].get('email', '')
            if current_service_account == service_account_email:
                print(f"{GREEN}✅ Service account is already attached to the VM{END_COLOR}")
            else:
                # Attach the service account to the VM
                print(f"{BLUE}🔗 Attaching service account to VM...{END_COLOR}")
                
                # Prepare the request body for updating the instance
                instance_body = target_instance.copy()
                
                # Update service accounts
                instance_body['serviceAccounts'] = [{
                    'email': service_account_email,
                    'scopes': [
                        'https://www.googleapis.com/auth/cloud-platform',
                        'https://www.googleapis.com/auth/compute',
                        'https://www.googleapis.com/auth/secretmanager'
                    ]
                }]
                
                # Remove fields that can't be updated
                for field in ['id', 'creationTimestamp', 'selfLink', 'status', 'statusMessage', 'zone']:
                    instance_body.pop(field, None)
                
                # Update the instance
                operation = compute.instances().update(
                    project=project_id,
                    zone=target_zone,
                    instance=target_instance['name'],
                    body=instance_body
                ).execute()
                
                # Wait for the operation to complete
                print(f"{BLUE}⏳ Waiting for service account attachment to complete...{END_COLOR}")
                wait_for_operation(compute, project_id, target_zone, operation['name'])
                
                print(f"{GREEN}✅ Service account attached successfully!{END_COLOR}")
    
    except Exception as e:
        print(f"{YELLOW}⚠️  Automatic service account attachment failed: {e}{END_COLOR}")
        print(f"{BLUE}   You need to manually attach the service account:{END_COLOR}")
        print(f"{BLUE}   Service Account Email: {service_account_email}{END_COLOR}")
        print(f"\n{BLUE}📋 Manual Steps:{END_COLOR}")
        print(f"{BLUE}1. Go to Google Cloud Console: https://console.cloud.google.com{END_COLOR}")
        print(f"{BLUE}2. Navigate to Compute Engine > VM instances{END_COLOR}")
        print(f"{BLUE}3. Find your VM instance and click on it{END_COLOR}")
        print(f"{BLUE}4. Click 'Edit' at the top of the page{END_COLOR}")
        print(f"{BLUE}5. Scroll down to 'Security and access' section{END_COLOR}")
        print(f"{BLUE}6. Under 'Service account', select 'Custom'{END_COLOR}")
        print(f"{BLUE}7. Choose the service account: {service_account_email}{END_COLOR}")
        print(f"{BLUE}8. Set access scopes to: 'Allow full access to all Cloud APIs' (recommended) or custom scopes:{END_COLOR}")
        print(f"{BLUE}   - Cloud Platform, Compute Engine, Secret Manager{END_COLOR}")
        print(f"{BLUE}9. Click 'Save' at the bottom{END_COLOR}")
        print(f"{BLUE}10. Wait for the instance to restart{END_COLOR}")
        print(f"\n{YELLOW}⚠️  Note: The VM must be powered off before you can change the service account.{END_COLOR}")
        print(f"{YELLOW}   If the VM is running, stop it first, then make the changes, and restart it.{END_COLOR}")
        print(f"\n{YELLOW}⚠️  Note: If your VM has an ephemeral IP address, the IP may change after restart.{END_COLOR}")
        print(f"{YELLOW}   You may need to update the IP address in scripts/gcp/secret.json after the restart.{END_COLOR}")
        
        while True:
            choice = input(f"\n{BOLD_START}Press Enter to continue with deployment, or 'q' to quit: {BOLD_END}").strip().lower()
            if choice == 'q':
                print(f"{BLUE}Deployment cancelled. You can run the script again later.{END_COLOR}")
                sys.exit(0)
            elif choice == '':
                print(f"{BLUE}Continuing with deployment...{END_COLOR}")
                break
            else:
                print(f"{RED}Invalid input. Press Enter to continue or 'q' to quit.{END_COLOR}")
    
    print(f"{GREEN}✅ Service account setup complete!{END_COLOR}")
    
    # Create temp directory and zip file
    temp_dir = './.temp'
    if os.path.exists(temp_dir):
        try:
            shutil.rmtree(temp_dir)
        except OSError as e:
            print(f"Error: {temp_dir} : {e.strerror}")
    
    os.makedirs(temp_dir, exist_ok=True)
    branch, url = get_branch_and_repo()
    
    if url:
        try:
            clone_command = ['git', 'clone', '--single-branch', '--branch', branch, url, temp_dir]
            result = subprocess.run(clone_command, check=True, timeout=600)
            print(f"Successfully cloned branch: {branch}")
        except subprocess.CalledProcessError as e:
            print(f"Failed to clone branch '{branch}': {e}")
            clone_command_fallback = ['git', 'clone', url, temp_dir]
            try:
                result = subprocess.run(clone_command_fallback, check=True, timeout=600)
                print("Successfully cloned repository (using default branch)")
            except subprocess.CalledProcessError as e2:
                print(f"Failed to clone repository: {e2}")
                with open(os.path.join(temp_dir, 'README.md'), 'w') as f:
                    f.write("# Attestor Deployment\n\nGit clone failed, using dummy file.")
    else:
        print("No repository URL found, creating dummy zip file")
        with open(os.path.join(temp_dir, 'README.md'), 'w') as f:
            f.write("# Attestor Deployment\n\nNo repository URL available.")
    
    zip_file = shutil.make_archive(temp_dir, 'zip', temp_dir)
    
    # Create secret data (same structure as default mode)
    secret_data = {
        "public_ip_address": ip_address,
        "secret_name": secret_name,
        "mtls_secret_name": mtls_secret_name,
        "install_artifact": zip_file,
        "ssh_private_key": ssh_key_path,
        "ansible_playbook": playbook_path,
        "attestor_name": attestor_name,
        "gcp_project": project_id,
        "signer_username": get_machine_id(),
        "signer_password": str(uuid.uuid4()),
        "collector_service_url": collector_service_url,
        "prometheus_pushgateway_url": prometheus_pushgateway_url
    }
    
    # Save current configuration for next run (same structure as default mode)
    current_config = {
        "deployment_mode": "user_machine",
        "attestor_name": attestor_name,
        "network": "user_provided",
        "public_ip_address": ip_address,
        "ssh_key_path": ssh_key_path,
        "secret_name": secret_name,
        "mtls_secret_name": mtls_secret_name,
        "collector_service_url": collector_service_url,
        "prometheus_pushgateway_url": prometheus_pushgateway_url,
        "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    with open(config_file, 'w') as f:
        json.dump(current_config, f, indent=2)
    with open(secret_file, 'w') as f:
        json.dump(secret_data, f, indent=2)
        os.chmod(secret_file, 0o600)
    
    # Create inventory file
    inventory_file = "inventory.txt"
    with open(inventory_file, "w") as f:
        f.write("[all]\n")
        f.write(ip_address)
    
    # Convert config to template
    config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'attestor', 'chainService', 'config.yaml')
    create_config_template(config_path)
    
    # Set configuration done flag
    with open("./.temp/config.done", 'w') as file:
        file.write('OK')
    
    print("### ☁️ Attestor node configuration complete ✅")
    deploy_attestor()

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
        '--private-key', f"{ssh_keyfile}"
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

def check_gcp_authentication():
    

    print(f"\n{BLUE}{CLOUD_EMOJI} Checking GCP Authentication...{END_COLOR}")
    
    # Check environment variables for service account auth
    project_id = os.getenv('GOOGLE_CLOUD_PROJECT')
    credentials_path = os.getenv('GOOGLE_APPLICATION_CREDENTIALS')
    
    if project_id and credentials_path and os.path.exists(credentials_path):
        try:
            credentials = service_account.Credentials.from_service_account_file(credentials_path)
            print(f"{GREEN}{SUCCESS_EMOJI} GCP Authentication Successful!{END_COLOR}")
            print(f"{GREEN}   Method: Service Account Key{END_COLOR}")
            print(f"{GREEN}   Project: {project_id}{END_COLOR}")
            print(f"{GREEN}   Service Account: {credentials.service_account_email}{END_COLOR}")
            return True, project_id
        except Exception as e:
            print(f"{RED}{ERROR_EMOJI} Service account authentication failed: {e}{END_COLOR}")
    
    # Fallback to gcloud CLI
    try:
        # Confirm gcloud CLI is available
        subprocess.run(['gcloud', '--version'], capture_output=True, text=True, check=True)
        print(f"{GREEN}{SUCCESS_EMOJI} gcloud CLI is available{END_COLOR}")
        
        # Get current project
        project_result = subprocess.run(['gcloud', 'config', 'get-value', 'project'],
                                        capture_output=True, text=True, check=True)
        current_project = project_result.stdout.strip()
        
        # Get current authenticated account
        account_result = subprocess.run(['gcloud', 'auth', 'list', '--filter=status:ACTIVE', '--format=value(account)'],
                                        capture_output=True, text=True, check=True)
        account_email = account_result.stdout.strip()
        
        if current_project and account_email:
            print(f"{GREEN}{SUCCESS_EMOJI} GCP Authentication Successful!{END_COLOR}")
            print(f"{GREEN}   Method: gcloud CLI{END_COLOR}")
            print(f"{GREEN}   Project: {current_project}{END_COLOR}")
            print(f"{GREEN}   Account: {account_email}{END_COLOR}")
            return True, current_project
        else:
            print(f"{RED}{ERROR_EMOJI} No active account or project set in gcloud CLI{END_COLOR}")
            print(f"{BLUE}Run: gcloud auth login && gcloud config set project YOUR_PROJECT_ID{END_COLOR}")
            return False, None

    except subprocess.CalledProcessError as e:
        print(f"{RED}{ERROR_EMOJI} gcloud CLI error: {e}{END_COLOR}")
        return False, None
    except FileNotFoundError:
        print(f"{RED}{ERROR_EMOJI} gcloud CLI not installed or not in PATH{END_COLOR}")
        return False, None

    print(f"{RED}{ERROR_EMOJI} GCP Authentication Failed{END_COLOR}")
    print(f"{RED}No authentication method worked.{END_COLOR}")
    return False, None


def test_credentials(project_id):
    """Test actual API access with current credentials (like AWS sts get-caller-identity)"""
    print(f"\n{BLUE}🔐 Testing API Access with Current Credentials...{END_COLOR}")
    
    # Test 1: Get project info (like AWS sts get-caller-identity)
    try:
        from google.cloud import resourcemanager_v3
        client = resourcemanager_v3.ProjectsClient()
        project_name = f"projects/{project_id}"
        project = client.get_project(name=project_name)
        print(f"{GREEN}✅ Project Access: {project.display_name} ({project.project_id}){END_COLOR}")
    except Exception as e:
        print(f"{RED}❌ Project Access Failed: {e}{END_COLOR}")
        return False
    
    # Test 2: List compute instances (read permission)
    try:
        compute_client = compute_v1.InstancesClient()
        request = compute_v1.ListInstancesRequest(
            project=project_id,
            zone="us-central1-a",
            max_results=1
        )
        instances = list(compute_client.list(request=request))
        print(f"{GREEN}✅ Compute Engine Access{END_COLOR}")
    except Exception as e:
        print(f"{RED}❌ Compute Engine Access Failed: {e}{END_COLOR}")
        return False
    
    # Test 3: List secrets (Secret Manager access)
    try:
        secret_manager_client = secretmanager.SecretManagerServiceClient()
        parent = f"projects/{project_id}"
        request = secretmanager.ListSecretsRequest(parent=parent, page_size=1)
        secrets = list(secret_manager_client.list_secrets(request=request))
        print(f"{GREEN}✅ Secret Manager Access{END_COLOR}")
    except Exception as e:
        print(f"{RED}❌ Secret Manager Access Failed: {e}{END_COLOR}")
        return False
    
    print(f"{GREEN}✅ All API access tests passed!{END_COLOR}")
    return True

def check_gcp_permissions(project_id):
    """Check if the service account has all required permissions"""
    return test_credentials(project_id)

# Check GCP authentication status
auth_success, project_id = check_gcp_authentication()
if not auth_success:
    print(f"\n{BLUE}To set up GCP authentication, please use one of the following methods:{END_COLOR}")
    print(f"\n{BLUE}Method 1 - gcloud SDK (Recommended):{END_COLOR}")
    print(f"  1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install")
    print(f"  2. Run: gcloud auth login")
    print(f"  3. Run: gcloud config set project YOUR_PROJECT_ID")
    print(f"\n{BLUE}Method 2 - Service Account Key:{END_COLOR}")
    print(f"  1. Create a service account in your GCP project")
    print(f"  2. Download the service account key as JSON")
    print(f"  3. Set environment variables:")
    print(f"     export GOOGLE_CLOUD_PROJECT='your-project-id'")
    print(f"     export GOOGLE_APPLICATION_CREDENTIALS='/path/to/service-account-key.json'")
    print(f"\nThen run: python3 scripts/gcp/deploy_attestor.py")
    sys.exit(1)



# Check GCP permissions
if not check_gcp_permissions(project_id):
    print(f"\n{RED}❌ Permission check failed. Please ensure your service account has the required roles:{END_COLOR}")
    print(f"   - roles/secretmanager.admin")
    print(f"   - roles/compute.instanceAdmin.v1")
    print(f"   - roles/iam.serviceAccountUser (optional)")
    print(f"\nYou can add these roles in the GCP Console under IAM & Admin > IAM")
    sys.exit(1)

def load_config():
    """Load configuration from JSON file"""
    config_file = './scripts/gcp/config.json'
    if os.path.exists(config_file):
        try:
            with open(config_file, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            logging.warning(f"Could not load config file: {e}")
    return {}


def get_input_with_default(prompt, default, config_key=None, saved_config=None):
    """Get input with option to use saved value"""
    if saved_config and config_key and config_key in saved_config:
        saved_value = saved_config[config_key]
        print(f"{BLUE}📝 {prompt}{END_COLOR}")
        print(f"{BLUE}   Saved value: '{saved_value}'{END_COLOR}")
        reuse = input(f"{BOLD_START}{INPUT_EMOJI}  Press Enter to use saved value, or type new value: {BOLD_END}").strip()
        if reuse == "":
            return saved_value
        else:
            return reuse
    else:
        return get_input(prompt, default)

def get_input(prompt, default):
    user_input = input(f"{BOLD_START}{INPUT_EMOJI}  {prompt} (default: {default}): {BOLD_END}").strip()
    return user_input if user_input else default

def get_latest_ubuntu_jammy_image(project_id, zone):
    compute_client = compute_v1.ImagesClient()
    
    # List Ubuntu images from Canonical
    request = compute_v1.ListImagesRequest(
        project=project_id,
        filter="name:ubuntu-2204-jammy-v* AND status=READY"
    )
    
    try:
        images = compute_client.list(request=request)
        # Get the latest Ubuntu 22.04 image
        latest_image = None
        for image in images:
            if 'ubuntu-2204-jammy' in image.name and image.status == 'READY':
                if latest_image is None or image.creation_timestamp > latest_image.creation_timestamp:
                    latest_image = image
        
        if latest_image:
            return latest_image.self_link
        else:
            # Fallback to a known Ubuntu 22.04 image
            return f"projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts"
    except Exception as e:
        logging.info(f"Error getting latest Ubuntu image: {e}")
        return f"projects/ubuntu-os-cloud/global/images/family/ubuntu-2204-lts"

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
    home_dir = os.path.expanduser('~')
    backup_dir = os.path.join(home_dir, 'attestor_ssh_key_backup')
    
    # Create backup directory if it doesn't exist
    try:
        os.makedirs(backup_dir, mode=0o700, exist_ok=True)
        logging.info(f"Created backup directory: {backup_dir}")
    except OSError as e:
        logging.error(f"Error creating backup directory: {e}")
        return
    
    # Set proper permissions on the key file
    os.chmod(key_file_path, 0o600)
    
    # Copy key to backup directory
    backup_key_path = os.path.join(backup_dir, f"{key_name}.pem")
    try:
        # Remove existing backup if it exists
        if os.path.exists(backup_key_path):
            os.remove(backup_key_path)
        subprocess.run(["cp", key_file_path, backup_key_path], check=True)
        # Set restrictive permissions on the backup key
        os.chmod(backup_key_path, 0o400)
        logging.info(f"The key '{key_name}.pem' has been successfully copied to {backup_dir}.✅")
        logging.info(f"Backup location: {backup_key_path}")
    except subprocess.CalledProcessError as e:
        logging.error(f"Error copying key to backup directory: {e}")
    except PermissionError as e:
        logging.warning(f"Permission denied copying key to backup directory: {e}")
        logging.info("Continuing without backup...")
    
    # Set restrictive permissions on the original key
    os.chmod(key_file_path, 0o400)

def create_key_pair(compute_client, project_id, zone, key_name):
    try:
        # Generate SSH key pair locally
        private_key_path = f"{key_name}.pem"
        public_key_path = f"{key_name}.pem.pub"  # ssh-keygen creates .pub file with .pem.pub extension
        
        # Check if key already exists
        if os.path.exists(private_key_path) and os.path.exists(public_key_path):
            reuse_key = input(f"SSH key '{key_name}' already exists. Do you want to reuse it? (yes/no): ").strip().lower()
            if reuse_key == "yes":
                # Read existing public key
                with open(public_key_path, 'r') as f:
                    public_key = f.read().strip()
                
                metadata_key = f"ssh-keys"
                metadata_value = f"ubuntu:{public_key}"
                
                logging.info(f"Reusing existing SSH key pair '{key_name}' ✅")
                copy_key_to_home_directory(key_name)
                return key_name, metadata_key, metadata_value
            else:
                # Remove existing keys and create new ones
                cleanup_keypair(key_name)
        
        # Generate private key
        subprocess.run([
            "ssh-keygen", "-t", "rsa", "-b", "2048", 
            "-f", private_key_path, "-N", ""
        ], check=True)
        
        # Wait a moment for file to be written
        time.sleep(1)
        
        # Check if public key was created
        if not os.path.exists(public_key_path):
            logging.error(f"Public key file not found at {public_key_path}")
            create_public = input("Public key file not found. Do you want to create it manually? (yes/no): ").strip().lower()
            if create_public == "yes":
                # Try to create public key from private key
                try:
                    subprocess.run([
                        "ssh-keygen", "-y", "-f", private_key_path, "-N", ""
                    ], stdout=open(public_key_path, 'w'), check=True)
                    logging.info(f"Public key created from private key ✅")
                except subprocess.CalledProcessError as e:
                    logging.error(f"Failed to create public key: {e}")
                    raise e
            else:
                raise FileNotFoundError(f"Public key file not found and user chose not to create it")
        
        # Read public key
        with open(public_key_path, 'r') as f:
            public_key = f.read().strip()
        
        # Create metadata entry for the key
        metadata_key = f"ssh-keys"
        metadata_value = f"ubuntu:{public_key}"
        
        logging.info(f"SSH key pair '{key_name}' created successfully ✅")
        copy_key_to_home_directory(key_name)
        
        return key_name, metadata_key, metadata_value
        
    except subprocess.CalledProcessError as e:
        logging.error(f"Error creating SSH key pair: {e}")
        raise e
    except FileNotFoundError as e:
        logging.error(f"File not found: {e}")
        raise e

def sanitize_resource_name(name):
    """Sanitize resource name to be GCP-compliant"""
    # Convert to lowercase and replace any non-alphanumeric characters with hyphens
    sanitized = re.sub(r'[^a-z0-9-]', '-', name.lower())
    # Remove multiple consecutive hyphens
    sanitized = re.sub(r'-+', '-', sanitized)
    # Remove leading/trailing hyphens
    sanitized = sanitized.strip('-')
    # Ensure it starts with a letter
    if sanitized and not sanitized[0].isalpha():
        sanitized = 'a' + sanitized
    # Ensure it's not too long (GCP limit is 63 characters)
    if len(sanitized) > 63:
        sanitized = sanitized[:63]
    return sanitized

def sanitize_secret_name(secret_name):
    """Sanitize secret name by replacing forward slashes with hyphens"""
    return secret_name.replace('/', '-')

def create_secret(secret_manager_client, project_id, secret_name, default_secret_name, key_value_pairs, file=False):
    secret_data_local = {}
    parent = f"projects/{project_id}"
    
    # Sanitize the secret name for GCP Secret Manager
    sanitized_secret_name = sanitize_secret_name(secret_name)
    
    # Check if secret exists
    try:
        secret_path = f"{parent}/secrets/{sanitized_secret_name}"
        secret_manager_client.get_secret(request={"name": secret_path})
        existing_secret = True
    except google_exceptions.NotFound:
        existing_secret = False
    
    if existing_secret:
        reuse_secret = input(f"A secret with the name '{sanitized_secret_name}' already exists. Do you want to reuse it? (yes/no): ").strip().lower()
        if reuse_secret == "yes":
            logging.info(f"Reusing existing secret '{sanitized_secret_name}'")
            
            # Get current secret version
            secret_version_path = f"{secret_path}/versions/latest"
            response = secret_manager_client.access_secret_version(request={"name": secret_version_path})
            secret_data_local = json.loads(response.payload.data.decode("UTF-8"))
            
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
                    logging.info(f"The key '{key}' does not exist. Adding new value.")
                    value = pwinput.pwinput(prompt=f"{prompt_message}: ", mask='X')
                    if value:
                        secret_data_local[key] = value
            
            # Update the secret
            secret_value_updated = json.dumps(secret_data_local).encode("UTF-8")
            secret_manager_client.add_secret_version(
                request={
                    "parent": secret_path,
                    "payload": {"data": secret_value_updated}
                }
            )
            logging.info(f"Secret updated successfully")
            
        else:
            # User doesn't want to reuse existing secret, ask for new name
            new_secret_name = get_input("Enter a new secret name", sanitize_secret_name(default_secret_name))
            sanitized_new_secret_name = sanitize_secret_name(new_secret_name)
            
            # Check if the new secret name also exists
            try:
                new_secret_path = f"{parent}/secrets/{sanitized_new_secret_name}"
                secret_manager_client.get_secret(request={"name": new_secret_path})
                logging.error(f"Secret '{sanitized_new_secret_name}' also exists. Please choose a different name.")
                return create_secret(secret_manager_client, project_id, new_secret_name, default_secret_name, key_value_pairs, file)
            except google_exceptions.NotFound:
                # New secret name doesn't exist, proceed with creation
                pass
            
            # Get values for the new secret
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

            # Create the new secret
            secret_value = json.dumps(secret_data_local).encode("UTF-8")
            secret_manager_client.create_secret(
                request={
                    "parent": parent,
                    "secret_id": sanitized_new_secret_name,
                    "secret": {
                        "replication": {
                            "user_managed": {
                                "replicas": [
                                    {"location": "us-central1"}
                                ]
                            }
                        }
                    }
                }
            )
            secret_manager_client.add_secret_version(
                request={
                    "parent": f"{parent}/secrets/{sanitized_new_secret_name}",
                    "payload": {"data": secret_value}
                }
            )
            logging.info(f"Secret '{sanitized_new_secret_name}' created successfully")
            return f"{parent}/secrets/{sanitized_new_secret_name}", secret_data_local
    else:
        # Secret does not exist, create a new one
        logging.info(f"Creating new secret '{sanitized_secret_name}'")
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

        secret_value = json.dumps(secret_data_local).encode("UTF-8")
        secret_manager_client.create_secret(
            request={
                "parent": parent,
                "secret_id": sanitized_secret_name,
                "secret": {
                    "replication": {
                        "user_managed": {
                            "replicas": [
                                {"location": "us-central1"}
                            ]
                        }
                    }
                }
            }
        )
        secret_manager_client.add_secret_version(
            request={
                "parent": f"{parent}/secrets/{sanitized_secret_name}",
                "payload": {"data": secret_value}
            }
        )
        logging.info(f"Secret created successfully")

    return f"{parent}/secrets/{sanitized_secret_name}", secret_data_local

def check_network_exists(project_id, network_name):
    """Check if a specific network exists in the project"""
    try:
        credentials, _ = default()
        compute = build('compute', 'v1', credentials=credentials)
        
        # Try to get the specific network
        compute.networks().get(project=project_id, network=network_name).execute()
        return True
    except Exception as e:
        if "NOT_FOUND" in str(e) or "404" in str(e):
            return False
        else:
            logging.warning(f"Error checking network '{network_name}': {e}")
            return False

def get_network_info(project_id, network_name):
    """Get network information including subnetworks"""
    try:
        credentials, _ = default()
        compute = build('compute', 'v1', credentials=credentials)
        
        # Get network details
        network = compute.networks().get(project=project_id, network=network_name).execute()
        
        # Get subnetworks in this network by listing all regions
        subnetworks = []
        
        # First, get all regions
        regions_request = compute.regions().list(project=project_id)
        while regions_request is not None:
            regions_response = regions_request.execute()
            if 'items' in regions_response:
                for region in regions_response['items']:
                    region_name = region['name']
                    try:
                        # List subnetworks in this region
                        subnetworks_request = compute.subnetworks().list(
                            project=project_id, 
                            region=region_name,
                            filter=f"network eq .*{network_name}"
                        )
                        while subnetworks_request is not None:
                            subnetworks_response = subnetworks_request.execute()
                            if 'items' in subnetworks_response:
                                for subnetwork in subnetworks_response['items']:
                                    subnetworks.append({
                                        'name': subnetwork['name'],
                                        'region': region_name,
                                        'ipCidrRange': subnetwork.get('ipCidrRange', 'N/A')
                                    })
                            subnetworks_request = compute.subnetworks().list_next(
                                previous_request=subnetworks_request, 
                                previous_response=subnetworks_response
                            )
                    except Exception as region_error:
                        # Skip regions where we can't list subnetworks
                        logging.debug(f"Could not list subnetworks in region {region_name}: {region_error}")
                        continue
            regions_request = compute.regions().list_next(
                previous_request=regions_request, 
                previous_response=regions_response
            )
        
        return {
            'network': network,
            'subnetworks': subnetworks,
            'autoCreateSubnetworks': network.get('autoCreateSubnetworks', False)
        }
    except Exception as e:
        logging.warning(f"Error getting network info for '{network_name}': {e}")
        return None

def add_firewall_rule(compute_client, project_id, network, firewall_name):
    try:
        print(f"{BLUE}🔧 Configuring firewall rule for network '{network}'...{END_COLOR}")
        
        # Check if this is a retry attempt (firewall was already configured)
        if hasattr(add_firewall_rule, 'configured_firewalls'):
            if firewall_name in add_firewall_rule.configured_firewalls:
                print(f"{BLUE}📋 Firewall rule '{firewall_name}' was already configured in this session{END_COLOR}")
                return
        else:
            add_firewall_rule.configured_firewalls = set()
        
        # Create credentials and compute client
        credentials, _ = default()
        compute = build('compute', 'v1', credentials=credentials)
        
        # Define the expected firewall configuration
        expected_firewall_body = {
            "name": firewall_name,
            "network": f"projects/{project_id}/global/networks/{network}",
            "allowed": [{
                "IPProtocol": "tcp",
                "ports": ["22"]
            }],
            "direction": "INGRESS",
            "priority": 1000,
            "targetTags": ["ssh-access"],
            "sourceRanges": ["0.0.0.0/0"],
            "description": f"Allow SSH access for {firewall_name} in network {network}"
        }
        
        # Check if firewall rule exists
        existing_firewall = None
        try:
            existing_firewall = compute.firewalls().get(project=project_id, firewall=firewall_name).execute()
            print(f"{BLUE}📋 Found existing firewall rule '{firewall_name}'{END_COLOR}")
        except Exception as e:
            if "NOT_FOUND" in str(e) or "404" in str(e):
                print(f"{BLUE}📋 Firewall rule '{firewall_name}' does not exist, will create it{END_COLOR}")
                existing_firewall = None
            else:
                raise e
        
        # Check if firewall needs to be updated or recreated
        needs_update = False
        needs_recreation = False
        
        if existing_firewall:
            # Normalize network URLs for comparison (remove https://www.googleapis.com/compute/v1/ prefix)
            current_network = existing_firewall.get('network', '')
            expected_network = expected_firewall_body['network']
            
            # Extract just the project/network part for comparison
            def normalize_network_url(url):
                if url.startswith('https://www.googleapis.com/compute/v1/'):
                    return url.replace('https://www.googleapis.com/compute/v1/', '')
                return url
            
            current_normalized = normalize_network_url(current_network)
            expected_normalized = normalize_network_url(expected_network)
            
            # Check if network matches (this cannot be changed, so we need to recreate if different)
            if current_normalized != expected_normalized:
                print(f"{YELLOW}⚠️ Firewall rule '{firewall_name}' exists but is configured for different network{END_COLOR}")
                print(f"{BLUE}   Current: {current_network}{END_COLOR}")
                print(f"{BLUE}   Expected: {expected_network}{END_COLOR}")
                print(f"{BLUE}   Note: Network cannot be changed for existing firewall rules{END_COLOR}")
                
                while True:
                    choice = input(f"{BLUE}Do you want to:{END_COLOR}\n"
                                  f"{BLUE}1. Delete existing firewall rule and create new one{END_COLOR}\n"
                                  f"{BLUE}2. Use a different firewall rule name{END_COLOR}\n"
                                  f"{BLUE}3. Skip firewall configuration{END_COLOR}\n"
                                  f"{BLUE}Enter your choice (1/2/3): {END_COLOR}").strip()
                    
                    if choice == "1":
                        needs_recreation = True
                        break
                    elif choice == "2":
                        new_firewall_name = input(f"{BLUE}Enter new firewall rule name: {END_COLOR}").strip()
                        if new_firewall_name:
                            firewall_name = new_firewall_name
                            expected_firewall_body["name"] = new_firewall_name
                            expected_firewall_body["description"] = f"Allow SSH access for {new_firewall_name} in network {network}"
                            print(f"{BLUE}📋 Using new firewall rule name: '{new_firewall_name}'{END_COLOR}")
                            # Check if new name already exists
                            try:
                                compute.firewalls().get(project=project_id, firewall=new_firewall_name).execute()
                                print(f"{RED}❌ Firewall rule '{new_firewall_name}' already exists{END_COLOR}")
                                continue
                            except Exception:
                                # New name doesn't exist, proceed
                                break
                        else:
                            print(f"{RED}❌ Firewall rule name cannot be empty{END_COLOR}")
                    elif choice == "3":
                        print(f"{YELLOW}⚠️ Skipping firewall configuration{END_COLOR}")
                        return
                    else:
                        print(f"{RED}Invalid choice. Please enter 1, 2, or 3.{END_COLOR}")
            
            # Check if other configurations match (only if network is correct)
            elif not needs_recreation:
                for key in ['allowed', 'direction', 'priority', 'targetTags', 'sourceRanges']:
                    if existing_firewall.get(key) != expected_firewall_body[key]:
                        print(f"{YELLOW}⚠️ Firewall rule '{firewall_name}' configuration mismatch for '{key}'{END_COLOR}")
                        needs_update = True
                        break
        
        if existing_firewall and not needs_update and not needs_recreation:
            print(f"{GREEN}✅ Firewall rule '{firewall_name}' is already properly configured for network '{network}'{END_COLOR}")
            add_firewall_rule.configured_firewalls.add(firewall_name)
            return
        elif needs_recreation:
            print(f"{BLUE}🗑️ Deleting existing firewall rule '{firewall_name}'...{END_COLOR}")
            try:
                compute.firewalls().delete(project=project_id, firewall=firewall_name).execute()
                print(f"{GREEN}✅ Existing firewall rule deleted successfully{END_COLOR}")
            except Exception as delete_error:
                print(f"{RED}❌ Failed to delete existing firewall rule: {delete_error}{END_COLOR}")
                print(f"{YELLOW}⚠️ Please delete it manually and try again{END_COLOR}")
                return
            
            # Wait for deletion to complete and verify it's gone
            print(f"{BLUE}⏳ Waiting for firewall rule deletion to complete...{END_COLOR}")
            max_wait_time = 60  # 1 minute timeout
            wait_interval = 5   # Check every 5 seconds
            elapsed_time = 0
            
            while elapsed_time < max_wait_time:
                try:
                    # Check if firewall rule still exists
                    compute.firewalls().get(project=project_id, firewall=firewall_name).execute()
                    # If we get here, firewall rule still exists
                    print(f"{BLUE}   Still deleting... ({elapsed_time}s elapsed){END_COLOR}")
                    time.sleep(wait_interval)
                    elapsed_time += wait_interval
                except Exception as e:
                    # Firewall rule not found - deletion completed
                    if "NOT_FOUND" in str(e) or "404" in str(e):
                        print(f"{GREEN}✅ Firewall rule deletion completed successfully{END_COLOR}")
                        break
                    else:
                        # Some other error, wait a bit more
                        print(f"{BLUE}   Checking deletion status... ({elapsed_time}s elapsed){END_COLOR}")
                        time.sleep(wait_interval)
                        elapsed_time += wait_interval
            
            if elapsed_time >= max_wait_time:
                print(f"{RED}❌ Firewall rule deletion timeout. Please check manually.{END_COLOR}")
                return
            
            print(f"{BLUE}🆕 Creating new firewall rule '{firewall_name}' for network '{network}'...{END_COLOR}")
            try:
                compute.firewalls().insert(project=project_id, body=expected_firewall_body).execute()
                print(f"{GREEN}✅ New firewall rule '{firewall_name}' created successfully{END_COLOR}")
                add_firewall_rule.configured_firewalls.add(firewall_name)
            except Exception as create_error:
                if "alreadyExists" in str(create_error):
                    print(f"{RED}❌ Firewall rule '{firewall_name}' still exists after deletion{END_COLOR}")
                    print(f"{YELLOW}⚠️ Please wait a moment and try again, or delete it manually{END_COLOR}")
                    return
                else:
                    raise create_error
        elif needs_update:
            print(f"{BLUE}🔄 Updating firewall rule '{firewall_name}' configuration...{END_COLOR}")
            # Update existing firewall rule (network stays the same)
            compute.firewalls().update(
                project=project_id, 
                firewall=firewall_name, 
                body=expected_firewall_body
            ).execute()
            print(f"{GREEN}✅ Firewall rule '{firewall_name}' updated successfully{END_COLOR}")
            add_firewall_rule.configured_firewalls.add(firewall_name)
        else:
            print(f"{BLUE}🆕 Creating firewall rule '{firewall_name}' for network '{network}'...{END_COLOR}")
            # Create new firewall rule
            compute.firewalls().insert(project=project_id, body=expected_firewall_body).execute()
            print(f"{GREEN}✅ Firewall rule '{firewall_name}' created successfully{END_COLOR}")
            add_firewall_rule.configured_firewalls.add(firewall_name)
                
    except Exception as e:
        logging.error(f"Error configuring firewall rule: {e}")
        print(f"{RED}❌ Failed to configure firewall rule: {e}{END_COLOR}")
        print(f"{YELLOW}⚠️ Continuing with deployment, but SSH access may not work{END_COLOR}")
        print(f"{BLUE}   You may need to manually configure firewall rules in GCP Console{END_COLOR}")

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
    characters = string.ascii_lowercase + string.digits
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


def wait_for_operation(compute, project, zone, operation_name):
    print(f"⏳ Waiting for operation {operation_name} to complete...")
    start_time = time.time()
    timeout = 120  # 2 minutes timeout
    check_interval = 5  # Check every 5 seconds
    
    while True:
        result = compute.zoneOperations().get(
            project=project,
            zone=zone,
            operation=operation_name
        ).execute()

        if result['status'] == 'DONE':
            print("✅ Operation complete.")
            if 'error' in result:
                raise Exception(result['error'])
            break
        time.sleep(2)

def create_service_account(project_id, service_account_name, service_account_email):
    """Create a service account if it doesn't exist"""
    print(f"🔧 Creating service account '{service_account_name}' if not exists...")
    try:
        # Use the same authentication method as the rest of the script
        credentials, _ = default()
        iam = discovery.build("iam", "v1", credentials=credentials)
        
        # Check if service account already exists
        try:
            iam.projects().serviceAccounts().get(name=f"projects/{project_id}/serviceAccounts/{service_account_email}").execute()
            print(f"ℹ️ Service account '{service_account_name}' already exists.")
            return True
        except HttpError as e:
            if e.resp.status == 404:
                # Service account doesn't exist, create it
                pass
            else:
                raise e
        
        # Create service account
        service_account_body = {
            "accountId": service_account_name,
            "serviceAccount": {
                "displayName": f"Attestor Service Account for {service_account_name}",
                "description": f"Service account for Attestor deployment {service_account_name}"
            }
        }
        
        iam.projects().serviceAccounts().create(
            name=f"projects/{project_id}",
            body=service_account_body
        ).execute()
        
        print(f"✅ Created service account: {service_account_email}")
        
        # Wait a moment for the service account to propagate
        print("⏳ Waiting for service account to propagate...")
        time.sleep(10)
        
        return True
        
    except HttpError as e:
        if e.resp.status == 409:
            print(f"ℹ️ Service account '{service_account_name}' already exists.")
            return True
        elif e.resp.status == 403:
            print(f"{YELLOW}⚠️ Permission denied: Cannot create service account. This requires 'iam.serviceAccounts.create' permission.{END_COLOR}")            
            raise Exception("Permission denied: Cannot create service account")
        else:
            print(f"{RED}❌ Error creating service account: {e}{END_COLOR}")
            raise
    except Exception as e:
        print(f"{RED}❌ Unexpected error creating service account: {e}{END_COLOR}")
        raise

def check_service_account_roles(project_id, service_account_email, custom_role_name=None, builtin_role_name=None):
    """Check if service account already has the required roles"""
    print(f"🔍 Checking existing roles for service account '{service_account_email}'...")
    try:
        credentials, _ = default()
        crm = discovery.build("cloudresourcemanager", "v1", credentials=credentials)
        policy = crm.projects().getIamPolicy(resource=project_id, body={}).execute()
        
        sa_member = f"serviceAccount:{service_account_email}"
        has_custom_role = False
        has_builtin_role = False
        
        for binding in policy.get("bindings", []):
            if binding["role"] == custom_role_name and sa_member in binding["members"]:
                has_custom_role = True
                print(f"✅ Service account already has custom role: {custom_role_name}")
            elif binding["role"] == builtin_role_name and sa_member in binding["members"]:
                has_builtin_role = True
                print(f"✅ Service account already has built-in role: {builtin_role_name}")
        
        return has_custom_role, has_builtin_role
        
    except Exception as e:
        print(f"{YELLOW}⚠️ Could not check existing roles: {e}{END_COLOR}")
        return False, False

def check_service_account_user_permission(project_id, service_account_email, caller_identity):
    """Check if caller already has service account user permission"""
    print(f"🔍 Checking if '{caller_identity}' already has service account user permission...")
    try:
        credentials, _ = default()
        iam = discovery.build("iam", "v1", credentials=credentials)
        
        sa_resource = f"projects/{project_id}/serviceAccounts/{service_account_email}"
        policy = iam.projects().serviceAccounts().getIamPolicy(resource=sa_resource).execute()
        
        member = f"serviceAccount:{caller_identity}"
        has_permission = False
        
        for binding in policy.get("bindings", []):
            if binding["role"] == "roles/iam.serviceAccountUser" and member in binding["members"]:
                has_permission = True
                print(f"✅ '{caller_identity}' already has service account user permission")
                break
        
        return has_permission
        
    except Exception as e:
        print(f"{YELLOW}⚠️ Could not check service account user permission: {e}{END_COLOR}")
        return False


def create_custom_role(project_id, custom_role_id, custom_role_name):
    print("🔧 Creating custom role if not exists...")
    credentials, _ = default()
    iam = discovery.build("iam", "v1", credentials=credentials)
    role_body = {
        "roleId": custom_role_id,
        "role": {
            "title": "Attestor Secret Manager Read Access",
            "description": "Custom role to access Secrets from Attestor",
            "includedPermissions": [
                "secretmanager.versions.access",
                "secretmanager.secrets.get",
                "secretmanager.secrets.list",
                "secretmanager.secrets.create",
                "secretmanager.secrets.update",
                "secretmanager.secrets.delete",
                "secretmanager.secrets.setIamPolicy",
            ],
            "stage": "GA"
        }
    }
    try:
        iam.projects().roles().create(parent=f"projects/{project_id}", body=role_body).execute()
        print(f"✅ Created role: {custom_role_name}")
        return True
    except HttpError as e:
        if e.resp.status == 409:
            print(f"ℹ️ Role {custom_role_id} already exists.")
            return True
        elif e.resp.status == 403:
            print(f"{YELLOW}⚠️ Permission denied: cannot create custom role. Will use built-in Secret Manager role instead.{END_COLOR}")
            return False
        else:
            raise

def bind_role_to_service_account(project_id, service_account_email, custom_role_name, custom_role_id):
    print("🔗 Binding custom role to service account...")
    credentials, _ = default()
    crm = discovery.build("cloudresourcemanager", "v1", credentials=credentials)
    policy = crm.projects().getIamPolicy(resource=project_id, body={}).execute()

    sa_member = f"serviceAccount:{service_account_email}"
    binding_found = False

    for binding in policy.get("bindings", []):
        if binding["role"] == custom_role_name:
            if sa_member not in binding["members"]:
                binding["members"].append(sa_member)
            binding_found = True
            break

    if not binding_found:
        policy["bindings"].append({
            "role": custom_role_name,
            "members": [sa_member]
        })

    crm.projects().setIamPolicy(resource=project_id, body={"policy": policy}).execute()
    print(f"✅ Role {custom_role_id} bound to {service_account_email}")

def bind_builtin_role_to_service_account(project_id, service_account_email, role_name):
    print(f"🔗 Binding built-in role {role_name} to service account...")
    credentials, _ = default()
    crm = discovery.build("cloudresourcemanager", "v1", credentials=credentials)
    policy = crm.projects().getIamPolicy(resource=project_id, body={}).execute()

    sa_member = f"serviceAccount:{service_account_email}"
    binding_found = False

    for binding in policy.get("bindings", []):
        if binding["role"] == role_name:
            if sa_member not in binding["members"]:
                binding["members"].append(sa_member)
            binding_found = True
            break

    if not binding_found:
        policy["bindings"].append({
            "role": role_name,
            "members": [sa_member]
        })

    crm.projects().setIamPolicy(resource=project_id, body={"policy": policy}).execute()
    print(f"✅ Built-in role {role_name} bound to {service_account_email}")

def grant_service_account_user(project_id, target_service_account_email, caller_identity, creds):
    from googleapiclient import discovery
    from googleapiclient.errors import HttpError

    iam = discovery.build("iam", "v1", credentials=creds)

    print(f"🔐 Ensuring '{caller_identity}' has 'roles/iam.serviceAccountUser' on '{target_service_account_email}'...")
    
    sa_resource = f"projects/{project_id}/serviceAccounts/{target_service_account_email}"
    
    policy = iam.projects().serviceAccounts().getIamPolicy(resource=sa_resource).execute()
    if "bindings" not in policy:
        policy["bindings"] = []

    member = f"serviceAccount:{caller_identity}"
    binding_found = False

    for binding in policy["bindings"]:
        if binding["role"] == "roles/iam.serviceAccountUser":
            if member not in binding["members"]:
                binding["members"].append(member)
            binding_found = True
            break

    if not binding_found:
        policy["bindings"].append({
            "role": "roles/iam.serviceAccountUser",
            "members": [member]
        })

    iam.projects().serviceAccounts().setIamPolicy(
        resource=sa_resource,
        body={"policy": policy}
    ).execute()

    print(f"✅ Granted 'roles/iam.serviceAccountUser' to '{caller_identity}'")

def attach_service_account_to_vm(project_id, zone, vm_name, service_account_email):
    print("🔗 Attaching service account to VM...")
    credentials, _ = default()
    compute = discovery.build("compute", "v1", credentials=credentials)

    instance = compute.instances().get(project=project_id, zone=zone, instance=vm_name).execute()
    status = instance.get("status")
    print(f"ℹ️ Current VM status: {status}")

    if status == "RUNNING":
        print("🛑 Stopping VM...")
        stop_op = compute.instances().stop(project=project_id, zone=zone, instance=vm_name).execute()
        wait_for_operation(compute, project_id, zone, stop_op['name'])

    print("🔁 Setting service account on VM...")
    set_sa_op = compute.instances().setServiceAccount(
        project=project_id,
        zone=zone,
        instance=vm_name,
        body={
            "email": service_account_email,
            "scopes": ["https://www.googleapis.com/auth/cloud-platform"]
        }
    ).execute()
    wait_for_operation(compute, project_id, zone, set_sa_op['name'])

    print("🚀 Starting VM...")
    start_op = compute.instances().start(project=project_id, zone=zone, instance=vm_name).execute()
    wait_for_operation(compute, project_id, zone, start_op['name'])

    print("✅ Service account attached and VM restarted.")


######################################
###  GCP Configuration starts here ###
######################################  

# Prompt user for deployment mode
deployment_mode = prompt_deployment_mode()

if deployment_mode == "2":
    # User-configured machine mode
    ip_address, ssh_key_path = get_user_machine_details()
    deploy_to_user_machine(ip_address, ssh_key_path)
    sys.exit(0)

# Default network mode - continue with existing flow
print(f"\n{BLUE}🌐 Using Default Network Mode{END_COLOR}")

# Load saved configuration
saved_config = load_config()

# Get GCP configuration
zone = get_input_with_default("Enter GCP zone", "us-central1-a", "zone", saved_config)
region = zone.rsplit('-', 1)[0]  # Extract region from zone
machine_type = get_input_with_default("Enter machine type", "e2-medium", "machine_type", saved_config)

# Get network configuration
print(f"\n{BLUE}🌐 Network Configuration{END_COLOR}")
print(f"{GREEN}✅ Using default network (no custom network setup required){END_COLOR}")
network = "default"

print(f"{GREEN}✅ Selected network: {network}{END_COLOR}")

# Validate network exists and check subnetworks (unless it's the default network)
if network and network != "default":
    print(f"{BLUE}🔍 Validating network '{network}' exists...{END_COLOR}")
    if not check_network_exists(project_id, network):
        print(f"{RED}❌ Network '{network}' does not exist in project '{project_id}'{END_COLOR}")
        while True:
            choice = input(f"{BLUE}Do you want to:{END_COLOR}\n"
                          f"{BLUE}1. Enter a different network name{END_COLOR}\n"
                          f"{BLUE}2. Use default network{END_COLOR}\n"
                          f"{BLUE}Enter your choice (1/2): {END_COLOR}").strip()
            
            if choice == "1":
                network = input(f"{BLUE}Enter network name: {END_COLOR}").strip()
                if network and check_network_exists(project_id, network):
                    print(f"{GREEN}✅ Network '{network}' validated successfully{END_COLOR}")
                    break
                elif network:
                    print(f"{RED}❌ Network '{network}' still does not exist{END_COLOR}")
                else:
                    print(f"{RED}❌ Network name cannot be empty{END_COLOR}")
            elif choice == "2":
                network = "default"
                print(f"{GREEN}✅ Using default network{END_COLOR}")
                break
            else:
                print(f"{RED}Invalid choice. Please enter 1 or 2.{END_COLOR}")
    else:
        print(f"{GREEN}✅ Network '{network}' validated successfully{END_COLOR}")
        
        # Check if network has subnetworks (required for custom networks)
        network_info = get_network_info(project_id, network)
        if network_info:
            if not network_info['autoCreateSubnetworks'] and not network_info['subnetworks']:
                print(f"{RED}❌ Network '{network}' is a custom network but has no subnetworks{END_COLOR}")
                print(f"{BLUE}   Custom networks require at least one subnetwork to be created{END_COLOR}")
                while True:
                    choice = input(f"{BLUE}Do you want to:{END_COLOR}\n"
                                  f"{BLUE}1. Use default network instead{END_COLOR}\n"
                                  f"{BLUE}2. Enter a different network name{END_COLOR}\n"
                                  f"{BLUE}Enter your choice (1/2): {END_COLOR}").strip()
                    
                    if choice == "1":
                        network = "default"
                        print(f"{GREEN}✅ Using default network{END_COLOR}")
                        break
                    elif choice == "2":
                        network = input(f"{BLUE}Enter network name: {END_COLOR}").strip()
                        if network and check_network_exists(project_id, network):
                            network_info = get_network_info(project_id, network)
                            if network_info and (network_info['autoCreateSubnetworks'] or network_info['subnetworks']):
                                print(f"{GREEN}✅ Network '{network}' validated successfully{END_COLOR}")
                                break
                            else:
                                print(f"{RED}❌ Network '{network}' also has no subnetworks{END_COLOR}")
                        elif network:
                            print(f"{RED}❌ Network '{network}' does not exist{END_COLOR}")
                        else:
                            print(f"{RED}❌ Network name cannot be empty{END_COLOR}")
                    else:
                        print(f"{RED}Invalid choice. Please enter 1 or 2.{END_COLOR}")
            elif network_info['subnetworks']:
                print(f"{BLUE}📋 Found {len(network_info['subnetworks'])} subnetworks in network '{network}':{END_COLOR}")
                for i, subnet in enumerate(network_info['subnetworks'], 1):
                    print(f"{BLUE}  {i}. {subnet['name']} (Region: {subnet['region']}, CIDR: {subnet['ipCidrRange']}){END_COLOR}")
                print(f"{GREEN}✅ Network '{network}' has subnetworks and is ready to use{END_COLOR}")

# Get the latest Ubuntu Jammy image
image_link = get_latest_ubuntu_jammy_image(project_id, zone)
logging.info(f"Using Ubuntu image: {image_link}")

# Create GCP clients
compute_client = compute_v1.InstancesClient()
secret_manager_client = secretmanager.SecretManagerServiceClient()

# Attestor name
default_name = "mainnet-attestor-verulink-" + generate_random_string(5).lower()
attestor_name = get_input_with_default("Enter attestor name", default_name, "attestor_name", saved_config)

# Sanitize the attestor name for GCP compliance
attestor_name = sanitize_resource_name(attestor_name)
logging.info(f"Using sanitized attestor name: {attestor_name}")

key_name = attestor_name
new_key_name, metadata_key, metadata_value = create_key_pair(compute_client, project_id, zone, key_name)

# Store SSH key path in config for future reference
ssh_key_path = os.path.abspath(f"{new_key_name}.pem")

# Create secrets
secret_data = {}

key_value_pairs = [
    ("ethereum_private_key", "Enter Ethereum private key"),
    ("ethereum_wallet_address", "Enter Ethereum wallet address"),
    ("aleo_private_key", "Enter Aleo private key"),
    ("aleo_wallet_address", "Enter Aleo wallet address")
]

# Get input for the secret name
secret_name = get_input_with_default("Enter secret name", "devnet-verulink-attestor-signingservice", "secret_name", saved_config)
secret_path, secret_data = create_secret(secret_manager_client, project_id, secret_name, "devnet-verulink-attestor-signingservice", key_value_pairs)

# Store Attestor MTLS Certificate and Keys on GCP Secret Manager
key_value_pairs = [
    ("ca_certificate", "Enter MTLS ca certificate file"),
    ("attestor_certificate", "Enter attestor certificate file"),
    ("attestor_key", "Enter attestor key file")
]
print("Configuring MTLS...")
mtls_secret_name = get_input_with_default("Enter MTLS secret name", "devnet-verulink-attestor-mtls", "mtls_secret_name", saved_config)
mtls_secret_path, mtls_secret_data = create_secret(secret_manager_client, project_id, mtls_secret_name, "devnet-verulink-attestor-mtls", key_value_pairs, file=True)

print("Configuring DB Service and Prometheus Connection..")
collector_service_url = get_input_with_default("Enter collector service url", "", "collector_service_url", saved_config)
prometheus_pushgateway_url = get_input_with_default("Enter prometheus pushgateway url", "", "prometheus_pushgateway_url", saved_config)

# Create service account for the instance
service_account_name = "verulink-attestor-sa"
service_account_email = f"{service_account_name}@{project_id}.iam.gserviceaccount.com"

# Define custom role variables
custom_role_id = "AttestorSecretManagerReadAccess"
custom_role_name = f"projects/{project_id}/roles/{custom_role_id}"

# Create firewall rule
firewall_name = f"{attestor_name}-firewall"
add_firewall_rule(compute_client, project_id, network, firewall_name)

# Check if an instance with the same name already exists
try:
    instances = compute_client.list(
        request={
            "project": project_id,
            "zone": zone,
            "filter": f"name={attestor_name}"
        }
    )
    existing_instances = list(instances)
    
    if existing_instances:
        existing_instance = existing_instances[0]
        instance_status = existing_instance.status
        instance_ip = existing_instance.network_interfaces[0].access_configs[0].nat_i_p if existing_instance.network_interfaces and existing_instance.network_interfaces[0].access_configs else "No external IP"
        instance_id = existing_instance.id
        print(f"\n{BLUE}⚠️  Instance '{attestor_name}' already exists!{END_COLOR}")
        print(f"{BLUE}   Status: {instance_status}{END_COLOR}")
        print(f"{BLUE}   IP Address: {instance_ip}{END_COLOR}")
        print(f"{BLUE}   Zone: {zone}{END_COLOR}")
        
        while True:
            choice = input(f"\n{BLUE}What would you like to do?{END_COLOR}\n"
                          f"{BLUE}1. Reuse existing instance (skip creation){END_COLOR}\n"
                          f"{BLUE}2. Delete and recreate instance{END_COLOR}\n"
                          f"{BLUE}3. Cancel deployment{END_COLOR}\n"
                          f"{BLUE}Enter your choice (1/2/3): {END_COLOR}").strip()
            
            if choice == "1":
                logging.info(f"Reusing existing instance: {existing_instance.name}")
                instance_name = existing_instance.name
                public_ip_address = instance_ip
                # Update secret.json with current IP address
                if os.path.exists(secret_file):
                    try:
                        with open(secret_file, 'r') as f:
                            secret_data = json.load(f)
                        secret_data['public_ip_address'] = public_ip_address
                        with open(secret_file, 'w') as f:
                            json.dump(secret_data, f, indent=2)
                        os.chmod(secret_file, 0o600)
                        logging.info(f"Updated public_ip_address in secret.json: {public_ip_address}")
                    except PermissionError:
                        try:
                            os.chmod(secret_file, 0o600)
                            with open(secret_file, 'r') as f:
                                secret_data = json.load(f)
                            secret_data['public_ip_address'] = public_ip_address
                            with open(secret_file, 'w') as f:
                                json.dump(secret_data, f, indent=2)
                            os.chmod(secret_file, 0o600)
                            logging.info(f"Updated public_ip_address in secret.json: {public_ip_address}")
                        except Exception as e:
                            logging.warning(f"Could not update IP address in secret.json: {e}")
                    except Exception as e:
                        logging.warning(f"Could not update IP address in secret.json: {e}")
                goto_deployment = True
                
                # Set up service account and custom role for the existing instance
                try:
                    print(f"\n{BLUE}🔧 Setting up service account and permissions for existing instance...{END_COLOR}")
                    create_service_account(project_id, service_account_name, service_account_email)
                    
                    # Check if service account already has the required roles
                    has_custom_role, has_builtin_role = check_service_account_roles(
                        project_id, service_account_email, custom_role_name, "roles/secretmanager.secretAccessor"
                    )
                    
                    # Only create/bind roles if they don't already exist
                    if not has_custom_role and not has_builtin_role:
                        # Try to create custom role, fallback to built-in role if permission denied
                        custom_role_created = create_custom_role(project_id, custom_role_id, custom_role_name)
                        if custom_role_created:
                            bind_role_to_service_account(project_id, service_account_email, custom_role_name, custom_role_id)
                        else:
                            # Use built-in Secret Manager role as fallback
                            print(f"{BLUE}🔗 Binding built-in Secret Manager role to service account...{END_COLOR}")
                            bind_builtin_role_to_service_account(project_id, service_account_email, "roles/secretmanager.secretAccessor")
                    else:
                        print(f"{GREEN}✅ Service account already has required permissions{END_COLOR}")
                    
                    # Get credentials and caller identity for grant_service_account_user
                    credentials, _ = default()
                    caller_identity = credentials.service_account_email if hasattr(credentials, 'service_account_email') else None
                    if not caller_identity:
                        try:
                            if hasattr(credentials, 'signer_email'):
                                caller_identity = credentials.signer_email
                            elif hasattr(credentials, 'client_id'):
                                from google.auth.transport.requests import Request
                                token_info = credentials.token_info(Request())
                                if 'email' in token_info:
                                    caller_identity = token_info['email']
                        except Exception:
                            print("⚠️ Could not determine caller identity, skipping service account user grant")
                            caller_identity = None
                    
                    if caller_identity:
                        # Check if service account user permission is already granted
                        if not check_service_account_user_permission(project_id, service_account_email, caller_identity):
                            grant_service_account_user(project_id, service_account_email, caller_identity, credentials)
                        else:
                            print(f"{GREEN}✅ Service account user permission already granted{END_COLOR}")
                    
                    attach_service_account_to_vm(project_id, zone, instance_name, service_account_email)
                    print(f"{GREEN}✅ Service account setup completed{END_COLOR}")
                except Exception as e:
                    error_msg = str(e)
                    if "Permission denied" in error_msg:
                        print(f"{RED}❌ Service account setup failed due to insufficient permissions:{END_COLOR}")
                        print(f"{BLUE}   - The service account needs 'iam.serviceAccounts.create' and 'iam.roles.create' permissions{END_COLOR}")
                        print(f"{BLUE}   - You can add these permissions in GCP Console under IAM & Admin > IAM{END_COLOR}")
                        print(f"{BLUE}   - Or run: gcloud projects add-iam-policy-binding {project_id} --member='user:$(gcloud config get-value account)' --role='roles/iam.serviceAccountAdmin'{END_COLOR}")
                        print(f"{BLUE}   - And: gcloud projects add-iam-policy-binding {project_id} --member='user:$(gcloud config get-value account)' --role='roles/iam.roleAdmin'{END_COLOR}")
                        print(f"{RED}   - The attestor service requires Secret Manager access to function properly{END_COLOR}")
                        print(f"{RED}❌ Deployment cannot continue without proper service account permissions.{END_COLOR}")
                        sys.exit(1)
                    else:
                        print(f"{RED}❌ Service account setup failed: {e}{END_COLOR}")
                        print(f"{RED}❌ The attestor service requires Secret Manager access to function properly.{END_COLOR}")
                        print(f"{RED}❌ Deployment cannot continue without proper service account setup.{END_COLOR}")
                        sys.exit(1)
                
                break
            elif choice == "2":
                logging.info(f"Deleting existing instance: {existing_instance.name}")
                try:
                    # Delete existing instance
                    compute_client.delete(
                        request={
                            "project": project_id,
                            "zone": zone,
                            "instance": existing_instance.name
                        }
                    )
                    logging.info("Instance deletion initiated.")
                    
                    # Wait for deletion to complete with verification
                    print(f"{BLUE}⏳ Waiting for instance deletion to complete...{END_COLOR}")
                    
                    max_wait_time = 300  # 5 minutes
                    wait_interval = 10   # Check every 10 seconds
                    elapsed_time = 0
                    
                    while elapsed_time < max_wait_time:
                        try:
                            # Check if instance still exists
                            instance = compute_client.get(
                                request={
                                    "project": project_id,
                                    "zone": zone,
                                    "instance": existing_instance.name
                                }
                            )
                            # If we get here, instance still exists
                            print(f"{BLUE}   Still deleting... ({elapsed_time}s elapsed){END_COLOR}")
                            time.sleep(wait_interval)
                            elapsed_time += wait_interval
                        except Exception as e:
                            # Instance not found - deletion completed
                            if "NOT_FOUND" in str(e) or "404" in str(e):
                                print(f"{GREEN}✅ Instance deletion completed successfully{END_COLOR}")
                                goto_deployment = False
                                break
                            else:
                                # Some other error, wait a bit more
                                print(f"{BLUE}   Checking deletion status... ({elapsed_time}s elapsed){END_COLOR}")
                                time.sleep(wait_interval)
                                elapsed_time += wait_interval
                    
                    if elapsed_time >= max_wait_time:
                        print(f"{RED}❌ Instance deletion timeout. Please check manually.{END_COLOR}")
                        sys.exit(1)
                    
                    # Break out of the outer while loop after successful deletion
                    break
                        
                except Exception as delete_error:
                    logging.error(f"Failed to delete existing instance: {delete_error}")
                    print(f"{RED}❌ Failed to delete existing instance. Please delete it manually and try again.{END_COLOR}")
                    sys.exit(1)
            elif choice == "3":
                logging.info("Deployment cancelled by user.")
                sys.exit(0)
            else:
                print(f"{RED}Invalid choice. Please enter 1, 2, or 3.{END_COLOR}")
    else:
        goto_deployment = False
except Exception as e:
    logging.info(f"No existing instances found: {e}")
    goto_deployment = False

if not goto_deployment:
    # Set up service account and custom role BEFORE creating the instance
    try:
        print(f"\n{BLUE}🔧 Setting up service account and permissions...{END_COLOR}")
        create_service_account(project_id, service_account_name, service_account_email)
        
        # Check if service account already has the required roles
        has_custom_role, has_builtin_role = check_service_account_roles(
            project_id, service_account_email, custom_role_name, "roles/secretmanager.secretAccessor"
        )
        
        # Only create/bind roles if they don't already exist
        if not has_custom_role and not has_builtin_role:
            # Try to create custom role, fallback to built-in role if permission denied
            custom_role_created = create_custom_role(project_id, custom_role_id, custom_role_name)
            if custom_role_created:
                bind_role_to_service_account(project_id, service_account_email, custom_role_name, custom_role_id)
            else:
                # Use built-in Secret Manager role as fallback
                print(f"{BLUE}🔗 Binding built-in Secret Manager role to service account...{END_COLOR}")
                bind_builtin_role_to_service_account(project_id, service_account_email, "roles/secretmanager.secretAccessor")
        else:
            print(f"{GREEN}✅ Service account already has required permissions{END_COLOR}")
        
        # Get credentials and caller identity for grant_service_account_user
        credentials, _ = default()
        caller_identity = credentials.service_account_email if hasattr(credentials, 'service_account_email') else None
        if not caller_identity:
            try:
                if hasattr(credentials, 'signer_email'):
                    caller_identity = credentials.signer_email
                elif hasattr(credentials, 'client_id'):
                    from google.auth.transport.requests import Request
                    token_info = credentials.token_info(Request())
                    if 'email' in token_info:
                        caller_identity = token_info['email']
            except Exception:
                print("⚠️ Could not determine caller identity, skipping service account user grant")
                caller_identity = None
        
        if caller_identity:
            # Check if service account user permission is already granted
            if not check_service_account_user_permission(project_id, service_account_email, caller_identity):
                grant_service_account_user(project_id, service_account_email, caller_identity, credentials)
            else:
                print(f"{GREEN}✅ Service account user permission already granted{END_COLOR}")
        
        print(f"{GREEN}✅ Service account setup completed{END_COLOR}")
    except Exception as e:
        error_msg = str(e)
        if "Permission denied" in error_msg:
            print(f"{RED}❌ Service account setup failed due to insufficient permissions:{END_COLOR}")
            print(f"{BLUE}   - The service account needs 'iam.serviceAccounts.create' and 'iam.roles.create' permissions{END_COLOR}")
            print(f"{BLUE}   - You can add these permissions in GCP Console under IAM & Admin > IAM{END_COLOR}")
            print(f"{BLUE}   - Or run: gcloud projects add-iam-policy-binding {project_id} --member='user:$(gcloud config get-value account)' --role='roles/iam.serviceAccountAdmin'{END_COLOR}")
            print(f"{BLUE}   - And: gcloud projects add-iam-policy-binding {project_id} --member='user:$(gcloud config get-value account)' --role='roles/iam.roleAdmin'{END_COLOR}")
            print(f"{RED}   - The attestor service requires Secret Manager access to function properly{END_COLOR}")
            print(f"{RED}❌ Deployment cannot continue without proper service account permissions.{END_COLOR}")
            sys.exit(1)
        else:
            print(f"{RED}❌ Service account setup failed: {e}{END_COLOR}")
            print(f"{RED}❌ The attestor service requires Secret Manager access to function properly.{END_COLOR}")
            print(f"{RED}❌ Deployment cannot continue without proper service account setup.{END_COLOR}")
            sys.exit(1)
    
    # Create the instance
    logging.info("Creating GCP instance...")
    
    # Configure the instance
    instance_resource = compute_v1.Instance()
    instance_resource.name = attestor_name
    instance_resource.machine_type = f"zones/{zone}/machineTypes/{machine_type}"
    
    # Set the boot disk
    disk = compute_v1.AttachedDisk()
    disk.auto_delete = True
    disk.boot = True
    disk.type_ = "PERSISTENT"
    
    # Set the source image and size
    disk.initialize_params = compute_v1.AttachedDiskInitializeParams()
    disk.initialize_params.source_image = image_link
    disk.initialize_params.disk_size_gb = 25
    
    instance_resource.disks = [disk]
    
    # Configure network interface
    network_interface = compute_v1.NetworkInterface()
    network_interface.name = "nic0"
    network_interface.network = f"projects/{project_id}/global/networks/{network}"
    
    # Handle subnetwork configuration based on network type
    if network == "default":
        # For default network, use the default subnetwork
        network_interface.subnetwork = f"projects/{project_id}/regions/{region}/subnetworks/default"
        print(f"{BLUE}📋 Using default subnetwork for default network{END_COLOR}")
    else:
        # For custom networks, ask user to select a subnetwork
        network_info = get_network_info(project_id, network)
        if network_info and network_info['subnetworks']:
            print(f"\n{BLUE}🌐 Subnetwork Selection for Network '{network}'{END_COLOR}")
            print(f"{BLUE}Available subnetworks:{END_COLOR}")
            
            for i, subnet in enumerate(network_info['subnetworks'], 1):
                region_match = "✅" if subnet['region'] == region else "⚠️"
                print(f"{BLUE}  {i}. {subnet['name']} (Region: {subnet['region']}, CIDR: {subnet['ipCidrRange']}) {region_match}{END_COLOR}")
            
            while True:
                try:
                    choice = input(f"\n{BLUE}Select subnetwork (1-{len(network_info['subnetworks'])}) or press Enter for first option: {END_COLOR}").strip()
                    
                    if not choice:  # Empty input - use first subnetwork
                        selected_subnet = network_info['subnetworks'][0]
                        break
                    elif choice.isdigit():
                        choice_num = int(choice)
                        if 1 <= choice_num <= len(network_info['subnetworks']):
                            selected_subnet = network_info['subnetworks'][choice_num - 1]
                            break
                        else:
                            print(f"{RED}Invalid choice. Please enter a number between 1 and {len(network_info['subnetworks'])}.{END_COLOR}")
                    else:
                        print(f"{RED}Invalid input. Please enter a number.{END_COLOR}")
                except ValueError:
                    print(f"{RED}Invalid input. Please enter a number.{END_COLOR}")
            
            # Set the selected subnetwork
            subnetwork_name = selected_subnet['name']
            subnetwork_region = selected_subnet['region']
            network_interface.subnetwork = f"projects/{project_id}/regions/{subnetwork_region}/subnetworks/{subnetwork_name}"
            print(f"{GREEN}✅ Selected subnetwork: '{subnetwork_name}' in region '{subnetwork_region}'{END_COLOR}")
            
            # Warn if subnetwork is in different region than zone
            if subnetwork_region != region:
                print(f"{YELLOW}⚠️ Warning: Subnetwork '{subnetwork_name}' is in region '{subnetwork_region}' but VM will be in zone '{zone}'{END_COLOR}")
                print(f"{YELLOW}   This may cause connectivity issues. Consider using a subnetwork in the same region.{END_COLOR}")
        else:
            # No subnetworks found - this should have been caught in validation
            print(f"{RED}❌ No subnetworks found in network '{network}'. This should not happen.{END_COLOR}")
            raise Exception(f"No subnetworks found in network '{network}'")
    
    # Add external IP
    access_config = compute_v1.AccessConfig()
    access_config.name = "External NAT"
    access_config.type_ = "ONE_TO_ONE_NAT"
    network_interface.access_configs = [access_config]
    
    instance_resource.network_interfaces = [network_interface]
    
    # Set service account for the instance
    service_account_config = compute_v1.ServiceAccount()
    service_account_config.email = service_account_email
    service_account_config.scopes = ["https://www.googleapis.com/auth/cloud-platform"]
    instance_resource.service_accounts = [service_account_config]
    
    # Set metadata
    instance_resource.metadata = compute_v1.Metadata()
    instance_resource.metadata.items = [
        compute_v1.Items(key=metadata_key, value=metadata_value)
    ]
    
    # Set labels
    instance_resource.labels = {
        "project": "verulink",
        "name": attestor_name,
        "environment": "mainnet"
    }
    
    # Set tags for firewall rule
    instance_resource.tags = compute_v1.Tags()
    instance_resource.tags.items = ["ssh-access"]
    
    # Create the instance
    operation = compute_client.insert(
        request={
            "project": project_id,
            "zone": zone,
            "instance_resource": instance_resource
        }
    )
    
    # Wait for the operation to complete
    logging.info("Waiting for instance to be created...")
    # Wait for operation to complete using polling
    zone_operations_client = compute_v1.ZoneOperationsClient()
    while True:
        time.sleep(3)  # Shorter polling interval like the working example
        operation = zone_operations_client.get(
            request={
                "project": project_id,
                "zone": zone,
                "operation": operation.name
            }
        )
        
        # Handle both string and numeric status values
        status = operation.status
        if isinstance(status, int):
            # Convert numeric status to string for comparison
            if status == 1:  # DONE
                status = 'DONE'
            elif status == 2:  # RUNNING
                status = 'RUNNING'
            else:
                status = 'UNKNOWN'
        
        if status == 'DONE':
            if hasattr(operation, 'error') and operation.error:
                logging.error(f"Operation failed: {operation.error}")
                raise Exception(f"Instance creation failed: {operation.error}")
            logging.info("✅ Instance creation operation completed successfully")
            break
        elif status == 'RUNNING':
            logging.info(f"⏳ Operation status: {status}")
            continue
        else:
            logging.error(f"Operation failed with status: {operation.status}")
            # Try to get more details about the error
            if hasattr(operation, 'error') and operation.error:
                logging.error(f"Operation error details: {operation.error}")
            break
    
    # Get the created instance
    try:
        instance = compute_client.get(
            request={
                "project": project_id,
                "zone": zone,
                "instance": attestor_name
            }
        )
        
        instance_id = instance.id
        instance_name = instance.name
        public_ip_address = instance.network_interfaces[0].access_configs[0].nat_i_p
        
        logging.info(f"Instance {instance_name} created successfully with IP {public_ip_address}")
        
    except Exception as e:
        logging.error(f"Failed to get instance details: {e}")
        # Try to list instances to see if it was created
        try:
            instances = compute_client.list(
                request={
                    "project": project_id,
                    "zone": zone,
                    "filter": f"name={attestor_name}"
                }
            )
            instance_list = list(instances)
            if instance_list:
                instance = instance_list[0]
                instance_name = instance.name
                public_ip_address = instance.network_interfaces[0].access_configs[0].nat_i_p
                logging.info(f"Found instance {instance_name} with IP {public_ip_address}")
            else:
                raise Exception("Instance not found after creation")
        except Exception as list_error:
            logging.error(f"Failed to list instances: {list_error}")
            raise Exception(f"Instance creation may have failed: {e}")

# Test Ansible connection
logging.info("Checking Ansible connection to the newly created GCP instance...")
ansible_command = [
    "ansible",
    "all", 
    "-i", f'{public_ip_address},',
    "-u", "ubuntu",
    "-m", "ping",
    "--private-key", f"{new_key_name}.pem"
]

max_attempts = 3
connection_successful = False

for attempt in range(1, max_attempts + 1):
    print(f"{BLUE}⏳ Ansible connection attempt {attempt}/{max_attempts}...{END_COLOR}")
    
    ansible_process = subprocess.run(ansible_command, capture_output=True, text=True)
    
    if ansible_process.returncode == 0:
        logging.info("✅ Ansible connection test successful!")
        connection_successful = True
        break
    else:
        print(f"{RED}❌ Ansible connection failed (attempt {attempt}/{max_attempts}){END_COLOR}")
        if ansible_process.stderr:
            print(f"{RED}   Error: {ansible_process.stderr.strip()}{END_COLOR}")
        
        if attempt < max_attempts:
            print(f"{BLUE}🔍 Checking connectivity...{END_COLOR}")
            
            # Check if port 22 is open
            if check_port(public_ip_address, 22):
                print(f"{BLUE}   Port 22 is open. The issue might be with SSH key or Ansible configuration.{END_COLOR}")
                print(f"{BLUE}   Waiting 10 seconds before retry...{END_COLOR}")
                time.sleep(10)
            else:
                print(f"{BLUE}   Port 22 is not open. Updating firewall rules...{END_COLOR}")
                add_firewall_rule(compute_client, project_id, network, firewall_name)
                print(f"{BLUE}   Firewall rules updated. Waiting 15 seconds before retry...{END_COLOR}")
                time.sleep(15)
        else:
            print(f"{RED}❌ All Ansible connection attempts failed.{END_COLOR}")
            print(f"{BLUE}   You may need to check:{END_COLOR}")
            print(f"{BLUE}   - SSH key permissions{END_COLOR}")
            print(f"{BLUE}   - Firewall rules{END_COLOR}")
            print(f"{BLUE}   - Instance SSH configuration{END_COLOR}")

if not connection_successful:
    print(f"\n{RED}❌ Ansible connection failed after {max_attempts} attempts.{END_COLOR}")
    print(f"{RED}🚫 Deployment stopped due to SSH connection failure.{END_COLOR}")
    print(f"\n{BLUE}🔧 Manual SSH Troubleshooting Steps:{END_COLOR}")
    print(f"{BLUE}1. Check SSH key permissions: chmod 400 {new_key_name}.pem{END_COLOR}")
    print(f"{BLUE}2. Test SSH connection manually: ssh -i {new_key_name}.pem ubuntu@{public_ip_address}{END_COLOR}")
    print(f"{BLUE}3. Verify firewall rules allow SSH (port 22) to {public_ip_address}{END_COLOR}")
    print(f"{BLUE}4. Check GCP console for instance status and network configuration{END_COLOR}")
    print(f"{BLUE}5. Ensure the instance is fully booted and SSH service is running{END_COLOR}")
    print(f"\n{BLUE}📋 Instance Details:{END_COLOR}")
    print(f"{BLUE}   Instance Name: {attestor_name}{END_COLOR}")
    print(f"{BLUE}   Public IP: {public_ip_address}{END_COLOR}")
    print(f"{BLUE}   SSH Key: {new_key_name}.pem{END_COLOR}")
    print(f"{BLUE}   Zone: {zone}{END_COLOR}")
    print(f"\n{BLUE}🔄 To retry deployment after fixing SSH issues, run: make deploy-to-gcp{END_COLOR}")
    
    # Clean up temp files
    temp_dir = './.temp'
    if os.path.exists(temp_dir):
        try:
            shutil.rmtree(temp_dir)
        except OSError as e:
            print(f"Error cleaning up temp files: {e}")
    
    sys.exit(1)

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

if url:
    # Try to clone with the current branch first
    clone_command = ['git', 'clone', '--single-branch', '--branch', branch, url, temp_dir]
    
    try:
        result = subprocess.run(clone_command, check=True, timeout=600)
        print(f"Successfully cloned branch: {branch}")
    except subprocess.CalledProcessError as e:
        print(f"Failed to clone branch '{branch}': {e}")
        # Try cloning without specifying branch (will use default)
        print("Trying to clone without specifying branch...")
        clone_command_fallback = ['git', 'clone', url, temp_dir]
        try:
            result = subprocess.run(clone_command_fallback, check=True, timeout=600)
            print("Successfully cloned repository (using default branch)")
        except subprocess.CalledProcessError as e2:
            print(f"Failed to clone repository: {e2}")
            # Create a dummy zip file if git clone fails
            print("Creating dummy zip file due to git clone failure")
            with open(os.path.join(temp_dir, 'README.md'), 'w') as f:
                f.write("# Attestor Deployment\n\nGit clone failed, using dummy file.")
else:
    print("No repository URL found, creating dummy zip file")
    with open(os.path.join(temp_dir, 'README.md'), 'w') as f:
        f.write("# Attestor Deployment\n\nNo repository URL available.")

zip_file = shutil.make_archive(temp_dir, 'zip', temp_dir)

def get_machine_id():
    return uuid.getnode()


# Create a dictionary with the parameters
current_directory = os.path.abspath(os.getcwd())
secret_data = {
    "public_ip_address": public_ip_address,
    "secret_name": secret_name,
    "mtls_secret_name": mtls_secret_name,
    "install_artifact": zip_file,
    "ssh_private_key": ssh_key_path,
    "ansible_playbook": playbook_path,
    "attestor_name": attestor_name,
    "gcp_project": project_id,
    "gcp_zone": zone,
    "signer_username": get_machine_id(),
    "signer_password": instance_id,
    "collector_service_url": collector_service_url,
    "prometheus_pushgateway_url": prometheus_pushgateway_url
}

# Save current configuration for next run
current_config = {
    "zone": zone,
    "machine_type": machine_type,
    "attestor_name": attestor_name,
    "network": network,
    "public_ip_address": public_ip_address,
    "ssh_key_path": ssh_key_path,
    "secret_name": secret_name,
    "mtls_secret_name": mtls_secret_name,
    "collector_service_url": collector_service_url,
    "prometheus_pushgateway_url": prometheus_pushgateway_url,
    "last_updated": time.strftime("%Y-%m-%d %H:%M:%S")
}

# Save current configuration for next run
with open(config_file, 'w') as f:
    json.dump(current_config, f, indent=2)
with open(secret_file, 'w') as f:
    json.dump(secret_data, f, indent=2)
    os.chmod(secret_file, 0o600)




# Specify the filename for the inventory file
inventory_file = "inventory.txt"

# Write the inventory content to the file
with open(inventory_file, "w") as f:
    f.write("[all]\n")
    f.write(public_ip_address)

# convert chainService config.yaml to ansible jinja2 template
config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'attestor', 'chainService', 'config.yaml')
create_config_template(config_path)

## Set configuration done flag
with open("./.temp/config.done", 'w') as file:
    file.write('OK')

print("### ☁️ Attestor node configuration complete ✅")
deploy_attestor()

