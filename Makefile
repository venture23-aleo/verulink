# Define variables
IMAGE_NAME := verulink-attestor
DOCKER_COMPOSE_FILE := ./attestor/compose.yaml  # Updated Docker Compose file location
AWS_PROFILE := attestor  # Changed AWS profile name
AWS_REGION := us-west-2
TAR_FILE := attestor.tar.gz
SHELL := /bin/bash

# Default target, will be executed when you run just 'make' without any arguments
all: help

# Build the Docker images
build:
	docker-compose -f $(DOCKER_COMPOSE_FILE) build

# Deploy the application locally
deploy-local:
	docker-compose -f $(DOCKER_COMPOSE_FILE) up -d attestor

# Deploy the application with AWS Secrets Manager
deploy-secretmanager:
	AWS_PROFILE=$(AWS_PROFILE) AWS_REGION=$(AWS_REGION) docker-compose -f $(DOCKER_COMPOSE_FILE) up -d attestor

# Configure AWS access (set AWS credentials)
configure-aws:
	aws configure --profile $(AWS_PROFILE)

# Install Python dependencies using pip
install-dependencies:
	pip3 install -r scripts/aws/requirements.txt >/dev/null

# Create a tar.gz archive of the 'attestor' folder
tar-attestor:
	tar -czf $(TAR_FILE) ./attestor


# Run the deploy_attestor.py script
deploy-to-aws:
	python3 ./scripts/aws/deploy_attestor.py

# Run the GCP deploy_attestor.py script
deploy-to-gcp:
	python3 ./scripts/gcp/deploy_attestor.py

# Create a virtual environment using venv
python-venv-aws:
	python3 -m venv venv
	. venv/bin/activate && pip3 install -r scripts/aws/requirements.txt

python-venv-gcp:
	python3 -m venv venv
	. venv/bin/activate && pip3 install -r scripts/gcp/requirements.txt

# Help target to display available targets
help:
	@echo "Available targets:"
	@echo "  make build              	- Build the Docker images"
	@echo "  make deploy-local       	- Deploy the application locally"
	@echo "  make deploy-secretmanager	- Deploy the application with AWS Secrets Manager"
	@echo "  make configure-aws       	- Configure AWS access (set AWS credentials)"
	@echo "  make deploy-auto         	- Deploy automatically and run Python script"
	@echo "  make deploy-to-aws       	- Deploy to AWS using the Python script"
	@echo "  make deploy-to-gcp       	- Deploy to GCP using the Python script"
	@echo "  make tar-attestor        	- Create a tar.gz file of the 'attestor' folder"
	@echo "  make create-venv-aws	     	- Create a virtual environment using venv for AWS"
	@echo "  make create-venv-gcp     	- Create a virtual environment using venv for GCP"
	@echo "  make help               	- Display this help message"

# Ensure that 'make' without arguments runs the 'help' target
.PHONY: all build deploy-local deploy-secretmanager configure-aws deploy-auto deploy-to-aws deploy-to-gcp run-script help
