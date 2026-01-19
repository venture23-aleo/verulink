# Define variables
IMAGE_NAME := myapp
DOCKER_COMPOSE_FILE := ./attestor/compose.yaml  # Updated Docker Compose file location
AWS_PROFILE := attestor
AWS_REGION := us-west-2
TAR_FILE := attestor.tar.gz

# Ansible deployment variables
ANSIBLE_DIR := scripts/ansible
VENV_DIR := venv
ENV ?= dev
DEPLOYMENT_TYPE ?= docker
INVENTORY := $(ANSIBLE_DIR)/inventories/$(ENV)/hosts.yml

SECRET_STORE_SCRIPT := $(ANSIBLE_DIR)/scripts/secret_store.sh
VM_IDENTITY_SCRIPT := $(ANSIBLE_DIR)/scripts/vm_identity.sh

# Default target
all: help

# =========================
#  Docker Build / Run
# =========================

# Build the Docker images
build:
	docker-compose -f $(DOCKER_COMPOSE_FILE) build

# Local deploy
deploy-local:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d attestor

# Deploy with AWS Secrets Manager
deploy-secretmanager:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) docker-compose -f $(DOCKER_COMPOSE_FILE) up -d attestor

# Configure AWS locally
configure-aws:
	aws configure --profile $(AWS_PROFILE)

# Install Python dependencies
install-dependencies:
	pip3 install -r scripts/aws/requirements.txt >/dev/null

# Tarball of attestor folder
tar-attestor:
	tar -czf $(TAR_FILE) ./attestor

# Deploy attestor using Python script
deploy-to-aws:
	python3 ./scripts/aws/deploy_attestor.py

# Create python venv
python-venv:
	python3 -m venv venv
	. venv/bin/activate && pip3 install -r scripts/aws/requirements.txt

# =========================
#  Secrets Management
# =========================

# 1. Upload secrets (interactive)
upload-secrets:
	@if [ ! -f "$(SECRET_STORE_SCRIPT)" ]; then \
		echo "❌ Error: Secret store script not found at $(SECRET_STORE_SCRIPT)"; \
		exit 1; \
	fi
	@echo "📤 Uploading secrets to cloud Secret Manager..."
	@bash "$(SECRET_STORE_SCRIPT)"

# 1b. Create instance profile / GCP service account
attach-instance-profile:
	@if [ ! -f "$(VM_IDENTITY_SCRIPT)" ]; then \
		echo "❌ Error: VM identity script not found at $(VM_IDENTITY_SCRIPT)"; \
		exit 1; \
	fi
	@echo "🔐 Creating + attaching VM instance profile / GCP service account..."
	@bash "$(VM_IDENTITY_SCRIPT)"

# =========================
#  Ansible Setup & Deploy
# =========================

setup-venv:
	@echo "🐍 Creating Python virtual environment..."
	@if [ -d "$(VENV_DIR)" ]; then \
		echo "⚠️  Virtual environment already exists at $(VENV_DIR)"; \
		echo "   Remove it first if you want to recreate: rm -rf $(VENV_DIR)"; \
	else \
		python3 -m venv $(VENV_DIR); \
		echo "✅ Virtual environment created"; \
	fi

	@echo "📦 Installing Ansible..."
	@. $(VENV_DIR)/bin/activate && \
		pip install --upgrade pip && \
		pip install ansible

	@echo "📦 Installing Ansible collections..."
	@. $(VENV_DIR)/bin/activate && \
		cd $(ANSIBLE_DIR) && \
		ansible-galaxy collection install -r requirements.yml

	@echo "✅ Ansible installation complete"
	@echo ""
	@echo "📝 Cloud CLIs will be installed on the remote machines"
	@echo "   - GCP: verulink-attestor-sa.json"
	@echo "   - AWS: cloud_user_accessKeys.csv"
	@echo ""
	@echo "💡 To activate your venv:"
	@echo "   source $(VENV_DIR)/bin/activate"

deploy: check-venv check-inventory check-vars
	@echo "🚀 Deploying Verulink Attestor to $(ENV)... (type=$(DEPLOYMENT_TYPE))"
	@VARS_FILE=$$( \
		if [ "$(ENV)" = "dev" ]; then echo "devnet_vars.yml"; \
		elif [ "$(ENV)" = "staging" ]; then echo "staging_vars.yml"; \
		elif [ "$(ENV)" = "prod" ]; then echo "mainnet_vars.yml"; \
		else echo "devnet_vars.yml"; fi ) && \
	. $(VENV_DIR)/bin/activate && \
	cd $(ANSIBLE_DIR) && \
	ansible-playbook playbooks/deploy.yml \
		-i "inventories/$(ENV)/hosts.yml" \
		-e "@$$VARS_FILE" \
		-e "deployment_type=$(DEPLOYMENT_TYPE)" \
		-e "overwrite_secret=true" \
		$$([ -n "$(BRANCH)" ] && echo "-e branch=$(BRANCH)" || true)
	@echo "✅ Deployment complete"

patch: check-venv check-inventory check-vars
	@echo "🔧 Patching Verulink Attestor..."
	@VARS_FILE=$$( \
		if [ "$(ENV)" = "dev" ]; then echo "devnet_vars.yml"; \
		elif [ "$(ENV)" = "staging" ]; then echo "staging_vars.yml"; \
		elif [ "$(ENV)" = "prod" ]; then echo "mainnet_vars.yml"; \
		else echo "devnet_vars.yml"; fi ) && \
	. $(VENV_DIR)/bin/activate && \
	cd $(ANSIBLE_DIR) && \
	ansible-playbook playbooks/patch.yml \
		-i "inventories/$(ENV)/hosts.yml" \
		-e "@$$VARS_FILE" \
		-e "deployment_type=$(DEPLOYMENT_TYPE)"
	@echo "✅ Patch complete"

update: check-venv check-inventory check-vars
	@echo "🔄 Updating Verulink Attestor..."
	@VARS_FILE=$$( \
		if [ "$(ENV)" = "dev" ]; then echo "devnet_vars.yml"; \
		elif [ "$(ENV)" = "staging" ]; then echo "staging_vars.yml"; \
		elif [ "$(ENV)" = "prod" ]; then echo "mainnet_vars.yml"; \
		else echo "devnet_vars.yml"; fi ) && \
	. $(VENV_DIR)/bin/activate && \
	cd $(ANSIBLE_DIR) && \
	ansible-playbook playbooks/update.yml \
		-i "inventories/$(ENV)/hosts.yml" \
		-e "@$$VARS_FILE" \
		-e "deployment_type=$(DEPLOYMENT_TYPE)" \
		$$([ -n "$(BRANCH)" ] && echo "-e branch=$(BRANCH)" || true)
	@echo "✅ Update complete"

update-config: check-venv check-inventory check-vars
	@echo "⚙️  Updating Verulink Attestor Config (no secret refresh)..."
	@VARS_FILE=$$( \
		if [ "$(ENV)" = "dev" ]; then echo "devnet_vars.yml"; \
		elif [ "$(ENV)" = "staging" ]; then echo "staging_vars.yml"; \
		elif [ "$(ENV)" = "prod" ]; then echo "mainnet_vars.yml"; \
		else echo "devnet_vars.yml"; fi ) && \
	. $(VENV_DIR)/bin/activate && \
	cd $(ANSIBLE_DIR) && \
	ansible-playbook playbooks/update-config.yml \
		-i "inventories/$(ENV)/hosts.yml" \
		-e "@$$VARS_FILE" \
		$$([ -n "$(BRANCH)" ] && echo "-e branch=$(BRANCH)" || true) \
		$$([ -n "$(DEPLOY_DIR)" ] && echo "-e deploy_dir=$(DEPLOY_DIR)" || true)
	@echo "✅ Config update complete"

# =========================
#  Validation Helpers
# =========================

check-venv:
	@if [ ! -d "$(VENV_DIR)" ]; then \
		echo "❌ Virtual environment not found. Run 'make setup-venv' first."; \
		exit 1; \
	fi
	@if [ ! -f "$(VENV_DIR)/bin/ansible-playbook" ]; then \
		echo "❌ Ansible not installed. Run 'make setup-venv' first."; \
		exit 1; \
	fi

check-inventory:
	@if [ ! -f "$(INVENTORY)" ]; then \
		echo "❌ Inventory file not found: $(INVENTORY)"; \
		echo "   Available: dev, staging, prod"; \
		exit 1; \
	fi

check-vars:
	@VARS_FILE=$$( \
		if [ "$(ENV)" = "dev" ]; then echo "$(ANSIBLE_DIR)/devnet_vars.yml"; \
		elif [ "$(ENV)" = "staging" ]; then echo "$(ANSIBLE_DIR)/staging_vars.yml"; \
		elif [ "$(ENV)" = "prod" ]; then echo "$(ANSIBLE_DIR)/mainnet_vars.yml"; \
		else echo "$(ANSIBLE_DIR)/devnet_vars.yml"; fi ); \
	if [ ! -f "$$VARS_FILE" ]; then \
		echo "❌ Variables file missing: $$VARS_FILE"; \
		exit 1; \
	fi

# =========================
#  Help
# =========================

help:
	@echo "Available targets:"
	@echo ""
	@echo "📦 Docker:"
	@echo "  make build"
	@echo "  make deploy-local"
	@echo "  make tar-attestor"
	@echo ""
	@echo "🔐 Secrets:"
	@echo "  make upload-secrets            - Upload secrets to AWS/GCP Secret Manager"
	@echo "  make attach-instance-profile   - Create + attach AWS Instance Profile or GCP Service Account"
	@echo ""
	@echo "🚀 Deployment:"
	@echo "  make setup-venv"
	@echo "  make deploy ENV=dev [BRANCH=branch-name]"
	@echo "  make patch ENV=dev"
	@echo "  make update ENV=dev [BRANCH=branch-name]  # Full update with secret refresh"
	@echo "  make update-config ENV=dev  # Config-only update (no secret refresh)"
	@echo ""
	@echo "Examples:"
	@echo "  make upload-secrets"
	@echo "  make attach-instance-profile"
	@echo "  make deploy ENV=staging"
	@echo "  make deploy ENV=prod DEPLOYMENT_TYPE=k8s"
	@echo "  make deploy ENV=staging BRANCH=feature-branch"
	@echo "  make update ENV=staging BRANCH=feature-branch"
	@echo "  make update ENV=staging  # Full update with secret refresh"
	@echo "  make update-config ENV=staging  # Config-only update (no secret refresh)"

.DEFAULT:
	@$(MAKE) help

.PHONY: all build deploy-local deploy-secretmanager configure-aws \
	upload-secrets attach-instance-profile \
	setup-venv deploy patch update update-config \
	check-venv check-inventory check-vars help
