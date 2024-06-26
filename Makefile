# Define variables
IMAGE_NAME := myapp
DOCKER_COMPOSE_FILE := ./attestor/compose.yaml  # Updated Docker Compose file location
AWS_PROFILE := attestor  # Changed AWS profile name
AWS_REGION := us-west-2
TAR_FILE := attestor.tar.gz

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

# Deploy automatically and run Python script
deploy-to-aws: install-dependencies tar-attestor run-aws-deploy-script

# Install Python dependencies using pip
install-dependencies:
	pip3 install -r scripts/aws/requirements.txt >/dev/null

# Create a tar.gz archive of the 'attestor' folder
tar-attestor:
	tar -czf $(TAR_FILE) ./attestor


# Run the deploy_attestor.py script
run-aws-deploy-script:
	python3 ./scripts/aws/deploy_attestor.py

# Create a virtual environment using venv
python-venv:
	python3 -m venv venv
	source venv/bin/activate && pip3 install -r scripts/aws/requirements.txt

# Help target to display available targets
help:
	@echo "Available targets:"
	@echo "  make build              	- Build the Docker images"
	@echo "  make deploy-local       	- Deploy the application locally"
	@echo "  make deploy-secretmanager	- Deploy the application with AWS Secrets Manager"
	@echo "  make configure-aws       	- Configure AWS access (set AWS credentials)"
	@echo "  make deploy-auto         	- Deploy automatically and run Python script"
	@echo "  make tar-attestor        	- Create a tar.gz file of the 'attestor' folder"
	@echo "  make create-venv         	- Create a virtual environment using venv"
	@echo "  make help               	- Display this help message"

# Ensure that 'make' without arguments runs the 'help' target
.PHONY: all build deploy-local deploy-secretmanager configure-aws deploy-auto run-script help
