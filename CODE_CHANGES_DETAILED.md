# Detailed Code Changes for Kubernetes Deployment

This document shows the exact code changes made to each file.

---

## 1. Makefile

### ADDITION: New target `check-k8s-auth`

**Location:** After `attach-instance-profile` target (after line 78)

```makefile
# 1c. Check Kubernetes cluster authentication
check-k8s-auth:
	@echo "🔍 Checking Kubernetes cluster authentication..."
	@if ! command -v kubectl &>/dev/null; then \
		echo "❌ Error: kubectl not found. Please install kubectl first."; \
		echo "   Install: https://kubernetes.io/docs/tasks/tools/"; \
		exit 1; \
	fi
	@echo "✅ kubectl found: $$(kubectl version --client --short 2>/dev/null || echo 'version unknown')"
	@echo ""
	@echo "📋 Current Context:"
	@kubectl config current-context 2>/dev/null || (echo "❌ No context set" && exit 1)
	@echo ""
	@echo "📋 Current User:"
	@kubectl config view --minify -o jsonpath='{.users[0].name}' 2>/dev/null || echo "Unknown"
	@echo ""
	@echo "🔗 Testing cluster connection..."
	@if kubectl cluster-info &>/dev/null; then \
		echo "✅ Cluster connection successful"; \
		echo ""; \
		echo "📊 Cluster Information:"; \
		kubectl cluster-info | head -1; \
		echo ""; \
		echo "📦 Available Namespaces:"; \
		kubectl get namespaces --no-headers 2>/dev/null | awk '{print "  - " $$1}' || echo "  (Unable to list namespaces)"; \
		echo ""; \
		echo "🔐 Testing permissions..."; \
		if kubectl auth can-i create secrets &>/dev/null; then \
			echo "✅ Can create secrets"; \
		else \
			echo "⚠️  Cannot create secrets (may need additional permissions)"; \
		fi; \
		if kubectl auth can-i create deployments &>/dev/null; then \
			echo "✅ Can create deployments"; \
		else \
			echo "⚠️  Cannot create deployments (may need additional permissions)"; \
		fi; \
		if kubectl auth can-i create namespaces &>/dev/null; then \
			echo "✅ Can create namespaces"; \
		else \
			echo "⚠️  Cannot create namespaces (may need additional permissions)"; \
		fi; \
	else \
		echo "❌ Cluster connection failed"; \
		echo ""; \
		echo "💡 Troubleshooting:"; \
		echo "  1. Check your kubeconfig: export KUBECONFIG=~/.kube/config"; \
		echo "  2. Verify cluster is accessible: kubectl cluster-info"; \
		echo "  3. For GKE: gcloud container clusters get-credentials <cluster> --zone <zone>"; \
		echo "  4. For EKS: aws eks update-kubeconfig --name <cluster> --region <region>"; \
		exit 1; \
	fi
```

### MODIFICATION: Help section

**Location:** Around line 200-202

**Change:**
```makefile
# BEFORE:
	@echo "🔐 Secrets:"
	@echo "  make upload-secrets            - Upload secrets to AWS/GCP Secret Manager"
	@echo "  make attach-instance-profile   - Create + attach AWS Instance Profile or GCP Service Account"

# AFTER:
	@echo "🔐 Secrets:"
	@echo "  make upload-secrets            - Upload secrets to AWS/GCP Secret Manager or Kubernetes"
	@echo "  make attach-instance-profile   - Create + attach AWS Instance Profile or GCP Service Account"
	@echo "  make check-k8s-auth            - Check Kubernetes cluster authentication"
```

### MODIFICATION: Examples section

**Location:** Around line 210-216

**Change:**
```makefile
# BEFORE:
	@echo "Examples:"
	@echo "  make upload-secrets"
	@echo "  make attach-instance-profile"
	@echo "  make deploy ENV=staging"
	@echo "  make deploy ENV=prod DEPLOYMENT_TYPE=k8s"
	@echo "  make deploy ENV=staging BRANCH=feature-branch"
	@echo "  make update ENV=staging BRANCH=feature-branch"

# AFTER:
	@echo "Examples:"
	@echo "  make upload-secrets"
	@echo "  make attach-instance-profile"
	@echo "  make check-k8s-auth                    # Check K8s cluster connection"
	@echo "  make deploy ENV=staging"
	@echo "  make deploy ENV=prod DEPLOYMENT_TYPE=k8s"
	@echo "  make deploy ENV=staging BRANCH=feature-branch"
	@echo "  make update ENV=staging BRANCH=feature-branch"
```

### MODIFICATION: .PHONY list

**Location:** Around line 221-224

**Change:**
```makefile
# BEFORE:
.PHONY: all build deploy-local deploy-secretmanager configure-aws \
	upload-secrets attach-instance-profile \
	setup-venv deploy patch update \
	check-venv check-inventory check-vars help

# AFTER:
.PHONY: all build deploy-local deploy-secretmanager configure-aws \
	upload-secrets attach-instance-profile check-k8s-auth \
	setup-venv deploy patch update \
	check-venv check-inventory check-vars help
```

---

## 2. scripts/ansible/scripts/secret_store.sh

### MODIFICATION: Provider selection menu

**Location:** Around line 538-563

**Change:**
```bash
# BEFORE:
    # Step 1: Select cloud provider
    print_section "Cloud Provider Selection"
    echo -e "${CYAN}1. AWS Secrets Manager${NC}"
    echo -e "${CYAN}2. GCP Secret Manager${NC}"
    read_input "Select cloud provider (1 or 2)" PROVIDER_CHOICE "1"

    case "$PROVIDER_CHOICE" in
        1)
            CLOUD_PROVIDER="aws"
            read_input "AWS Region" AWS_REGION "us-east-1"
            ;;
        2)
            CLOUD_PROVIDER="gcp"
            read_input "GCP Project ID" GCP_PROJECT ""
            if [[ -z "$GCP_PROJECT" ]]; then
                echo -e "${RED}Error: GCP Project ID is required${NC}"
                exit 1
            fi
            read_input "GCP Region" GCP_REGION "us-central1"
            ;;
        *)
            echo -e "${RED}Error: Invalid choice${NC}"
            exit 1
            ;;
    esac

# AFTER:
    # Step 1: Select cloud provider
    print_section "Cloud Provider Selection"
    echo -e "${CYAN}1. AWS Secrets Manager${NC}"
    echo -e "${CYAN}2. GCP Secret Manager${NC}"
    echo -e "${CYAN}3. Kubernetes Secrets${NC}"
    read_input "Select provider (1, 2, or 3)" PROVIDER_CHOICE "1"

    case "$PROVIDER_CHOICE" in
        1)
            CLOUD_PROVIDER="aws"
            read_input "AWS Region" AWS_REGION "us-east-1"
            ;;
        2)
            CLOUD_PROVIDER="gcp"
            read_input "GCP Project ID" GCP_PROJECT ""
            if [[ -z "$GCP_PROJECT" ]]; then
                echo -e "${RED}Error: GCP Project ID is required${NC}"
                exit 1
            fi
            read_input "GCP Region" GCP_REGION "us-central1"
            ;;
        3)
            CLOUD_PROVIDER="k8s"
            # Check kubectl availability
            if ! command -v kubectl &>/dev/null; then
                echo -e "${RED}Error: kubectl not found. Please install kubectl first.${NC}"
                echo -e "${YELLOW}Install: https://kubernetes.io/docs/tasks/tools/${NC}"
                exit 1
            fi
            # Check cluster connection
            if ! kubectl cluster-info &>/dev/null; then
                echo -e "${RED}Error: Cannot connect to Kubernetes cluster.${NC}"
                echo -e "${YELLOW}Please configure kubectl:${NC}"
                echo -e "  ${CYAN}export KUBECONFIG=~/.kube/config${NC}"
                echo -e "  ${CYAN}kubectl cluster-info${NC}"
                exit 1
            fi
            read_input "Kubernetes Namespace" K8S_NAMESPACE "verulink-attestor"
            read_input "Secret Name" K8S_SECRET_NAME "attestor-secret"
            echo -e "${GREEN}✓ Connected to cluster: $(kubectl config current-context)${NC}"
            ;;
        *)
            echo -e "${RED}Error: Invalid choice${NC}"
            exit 1
            ;;
    esac
```

### ADDITION: New function `store_to_k8s()`

**Location:** After `store_to_gcp()` function (after line 390)

```bash
# Store to Kubernetes Secrets
store_to_k8s() {
    print_section "Storing to Kubernetes Secrets"

    echo -e "${CYAN}Namespace: $K8S_NAMESPACE${NC}"
    echo -e "${CYAN}Secret Name: $K8S_SECRET_NAME${NC}"
    echo -e "${CYAN}Cluster: $(kubectl config current-context)${NC}"

    # Check if namespace exists, create if not
    if ! kubectl get namespace "$K8S_NAMESPACE" &>/dev/null; then
        echo -e "${YELLOW}Namespace '$K8S_NAMESPACE' does not exist.${NC}"
        read_input "Create namespace? (yes/no)" CREATE_NS "yes"
        if [[ "$CREATE_NS" == "yes" ]]; then
            if kubectl create namespace "$K8S_NAMESPACE"; then
                echo -e "${GREEN}✓ Namespace created${NC}"
            else
                echo -e "${RED}✗ Failed to create namespace${NC}"
                return 1
            fi
        else
            echo -e "${RED}Error: Namespace is required${NC}"
            return 1
        fi
    fi

    # Read certificate files and base64 encode them
    local ca_cert_base64
    local attestor_cert_base64
    local attestor_key_base64

    echo -e "${CYAN}Encoding certificates...${NC}"
    ca_cert_base64=$(base64 -w 0 < "$CA_CERT_FILE" 2>/dev/null || base64 < "$CA_CERT_FILE")
    attestor_cert_base64=$(base64 -w 0 < "$ATTESTOR_CERT_FILE" 2>/dev/null || base64 < "$ATTESTOR_CERT_FILE")
    attestor_key_base64=$(base64 -w 0 < "$ATTESTOR_KEY_FILE" 2>/dev/null || base64 < "$ATTESTOR_KEY_FILE")

    # Check if secret already exists
    if kubectl get secret "$K8S_SECRET_NAME" -n "$K8S_NAMESPACE" &>/dev/null; then
        echo -e "${YELLOW}Secret '$K8S_SECRET_NAME' already exists in namespace '$K8S_NAMESPACE'.${NC}"
        read_input "Update existing secret? (yes/no)" UPDATE_SECRET "no"
        if [[ "$UPDATE_SECRET" != "yes" ]]; then
            echo -e "${YELLOW}Skipping secret storage${NC}"
            return 0
        fi
        # Delete existing secret to recreate
        kubectl delete secret "$K8S_SECRET_NAME" -n "$K8S_NAMESPACE" &>/dev/null
    fi

    # Create secret using kubectl create secret generic
    if kubectl create secret generic "$K8S_SECRET_NAME" \
        --namespace="$K8S_NAMESPACE" \
        --from-literal=CA_MTLS_CERT="$ca_cert_base64" \
        --from-literal=ATTESTOR_MTLS_CERT="$attestor_cert_base64" \
        --from-literal=ATTESTOR_MTLS_KEY="$attestor_key_base64" \
        --from-literal=ALEO_PRIVATE_KEY="$ALEO_PRIVATE_KEY" \
        --from-literal=BSC_PRIVATE_KEY="$BSC_PRIVATE_KEY" \
        --from-literal=ETHEREUM_PRIVATE_KEY="$ETHEREUM_PRIVATE_KEY" \
        --from-literal=SIGNING_SERVICE_USERNAME="$SIGNING_SERVICE_USERNAME" \
        --from-literal=SIGNING_SERVICE_PASSWORD="$SIGNING_SERVICE_PASSWORD" \
        --dry-run=client -o yaml | kubectl apply -f -; then
        echo -e "${GREEN}✓ Secret created/updated successfully${NC}"
        
        # Verify secret
        echo -e "${CYAN}Verifying secret...${NC}"
        if kubectl get secret "$K8S_SECRET_NAME" -n "$K8S_NAMESPACE" &>/dev/null; then
            echo -e "${GREEN}✓ Secret verified in namespace '$K8S_NAMESPACE'${NC}"
            
            # Show secret keys (not values)
            echo -e "${CYAN}Secret keys:${NC}"
            kubectl get secret "$K8S_SECRET_NAME" -n "$K8S_NAMESPACE" -o jsonpath='{.data}' | \
                python3 -c "import sys, json; data = json.load(sys.stdin); print('\n'.join(['  - ' + k for k in data.keys()]))" 2>/dev/null || \
                echo "  (Unable to list keys)"
            
            return 0
        else
            echo -e "${RED}✗ Secret verification failed${NC}"
            return 1
        fi
    else
        echo -e "${RED}✗ Failed to create secret${NC}"
        echo -e "${YELLOW}Please check:${NC}"
        echo -e "  - kubectl is properly configured"
        echo -e "  - You have permissions to create secrets in namespace '$K8S_NAMESPACE'"
        echo -e "  - Cluster is accessible"
        return 1
    fi
}
```

### MODIFICATION: Storage logic in main function

**Location:** Around line 628-639

**Change:**
```bash
# BEFORE:
    # Step 8: Store to cloud
    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        if ! store_to_aws; then
            echo -e "${RED}Failed to store secret to AWS${NC}"
            exit 1
        fi
    else
        if ! store_to_gcp; then
            echo -e "${RED}Failed to store secret to GCP${NC}"
            exit 1
        fi
    fi

# AFTER:
    # Step 8: Store to cloud
    if [[ "$CLOUD_PROVIDER" == "aws" ]]; then
        if ! store_to_aws; then
            echo -e "${RED}Failed to store secret to AWS${NC}"
            exit 1
        fi
    elif [[ "$CLOUD_PROVIDER" == "gcp" ]]; then
        if ! store_to_gcp; then
            echo -e "${RED}Failed to store secret to GCP${NC}"
            exit 1
        fi
    elif [[ "$CLOUD_PROVIDER" == "k8s" ]]; then
        if ! store_to_k8s; then
            echo -e "${RED}Failed to store secret to Kubernetes${NC}"
            exit 1
        fi
    fi
```

---

## 3. scripts/ansible/roles/k8s/tasks/main.yml

### ADDITION: Secret verification tasks

**Location:** After namespace creation (after line 17)

```yaml
- name: Verify Kubernetes secret exists
  kubernetes.core.k8s_info:
    kind: Secret
    name: "{{ k8s_secret_name | default('attestor-secret') }}"
    namespace: "{{ k8s_namespace }}"
  register: k8s_secret_check
  failed_when: false

- name: Fail if secret does not exist
  ansible.builtin.fail:
    msg: |
      Kubernetes secret '{{ k8s_secret_name | default("attestor-secret") }}' not found in namespace '{{ k8s_namespace }}'.
      
      Please create the secret first using:
        make upload-secrets
        # Select: 3) Kubernetes
      
      Or manually create the secret:
        kubectl create secret generic {{ k8s_secret_name | default("attestor-secret") }} \
          --namespace={{ k8s_namespace }} \
          --from-literal=CA_MTLS_CERT='<base64-encoded>' \
          --from-literal=ATTESTOR_MTLS_CERT='<base64-encoded>' \
          --from-literal=ATTESTOR_MTLS_KEY='<base64-encoded>' \
          --from-literal=ALEO_PRIVATE_KEY='<key>' \
          --from-literal=BSC_PRIVATE_KEY='<key>' \
          --from-literal=ETHEREUM_PRIVATE_KEY='<key>' \
          --from-literal=SIGNING_SERVICE_USERNAME='<username>' \
          --from-literal=SIGNING_SERVICE_PASSWORD='<password>'
  when: k8s_secret_check.resources | length == 0
```

---

## 4. scripts/ansible/roles/k8s/vars/main.yaml

### ADDITION: Secret name variable

**Location:** After `k8s_namespace` (after line 3)

```yaml
k8s_secret_name: attestor-secret  # Name of the Kubernetes secret containing attestor secrets
```

---

## 5. attestor/attestor-chart/templates/serviceaccount.yaml

### NEW FILE: Complete content

```yaml
{{- if .Values.serviceAccount.create -}}
apiVersion: v1
kind: ServiceAccount
metadata:
  name: {{ .Values.serviceAccount.name | default "verulink-attestor-sa" }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "verulink-attestor.labels" . | nindent 4 }}
  {{- with .Values.serviceAccount.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
{{- end }}
```

---

## 6. attestor/attestor-chart/templates/rbac.yaml

### NEW FILE: Complete content

```yaml
{{- if .Values.rbac.create -}}
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: {{ .Values.rbac.roleName | default "verulink-attestor-role" }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "verulink-attestor.labels" . | nindent 4 }}
rules:
  # Read-only access to secrets (required for pod to access secrets)
  - apiGroups: [""]
    resources: ["secrets"]
    verbs: ["get", "list"]
    resourceNames:
      - {{ .Values.secret_name }}
  # Read-only access to configmaps (required for pod to access configmaps)
  - apiGroups: [""]
    resources: ["configmaps"]
    verbs: ["get", "list"]
    resourceNames:
      - attestor-config
      - attestor-chain-service-config
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: {{ .Values.rbac.roleBindingName | default "verulink-attestor-rolebinding" }}
  namespace: {{ .Release.Namespace }}
  labels:
    {{- include "verulink-attestor.labels" . | nindent 4 }}
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: Role
  name: {{ .Values.rbac.roleName | default "verulink-attestor-role" }}
subjects:
  - kind: ServiceAccount
    name: {{ .Values.serviceAccount.name | default "verulink-attestor-sa" }}
    namespace: {{ .Release.Namespace }}
{{- end }}
```

---

## 7. attestor/attestor-chart/templates/chainservice-deployment.yaml

### MODIFICATION: Add ServiceAccount reference

**Location:** In `spec.template.spec` section (around line 14)

**Change:**
```yaml
# BEFORE:
    spec:
      initContainers:

# AFTER:
    spec:
      {{- if .Values.serviceAccount.create }}
      serviceAccountName: {{ .Values.serviceAccount.name | default "verulink-attestor-sa" }}
      {{- end }}
      initContainers:
```

---

## 8. attestor/attestor-chart/templates/signingservice-deployment.yaml

### MODIFICATION: Add ServiceAccount reference

**Location:** In `spec.template.spec` section (around line 14)

**Change:**
```yaml
# BEFORE:
    spec:
      initContainers:

# AFTER:
    spec:
      {{- if .Values.serviceAccount.create }}
      serviceAccountName: {{ .Values.serviceAccount.name | default "verulink-attestor-sa" }}
      {{- end }}
      initContainers:
```

---

## 9. attestor/attestor-chart/values.yaml

### ADDITION: ServiceAccount and RBAC configuration

**Location:** End of file (after line 52)

```yaml
## Service Account Configuration
serviceAccount:
  # Specifies whether a ServiceAccount should be created
  create: true
  # The name of the ServiceAccount to use.
  # If not set and create is true, a name is generated using the fullname template
  name: "verulink-attestor-sa"
  # Annotations to add to the ServiceAccount
  annotations: {}
    # Example: eks.amazonaws.com/role-arn: arn:aws:iam::123456789012:role/verulink-attestor-role

## RBAC Configuration
rbac:
  # Specifies whether RBAC resources should be created
  create: true
  # The name of the Role to create
  roleName: "verulink-attestor-role"
  # The name of the RoleBinding to create
  roleBindingName: "verulink-attestor-rolebinding"
```

---

## 10. scripts/ansible/roles/README.md

### MODIFICATION: k8s role documentation

**Location:** Around line 101-114

**Change:**
```markdown
# BEFORE:
### k8s
Manages Kubernetes/Helm deployment.

**Tasks:**
- Installs Helm if needed
- Creates Kubernetes namespace
- Adds Verulink Helm repository
- Deploys or upgrades Verulink Attestor via Helm
- Supports patching with additional values files

**Variables:**
- `k8s_namespace`: Kubernetes namespace (default: `verulink-attestor`)
- `helm_repo_url`: Helm repository URL
- `patch_files`: List of additional values files for patching

# AFTER:
### k8s
Manages Kubernetes/Helm deployment.

**Tasks:**
- Verifies Kubernetes secret exists before deployment
- Installs Helm if needed
- Creates Kubernetes namespace
- Adds Verulink Helm repository
- Deploys or upgrades Verulink Attestor via Helm
- Supports patching with additional values files

**Variables:**
- `k8s_namespace`: Kubernetes namespace (default: `verulink-attestor`)
- `k8s_secret_name`: Kubernetes secret name (default: `attestor-secret`)
- `helm_repo_url`: Helm repository URL
- `patch_files`: List of additional values files for patching
```

---

## Summary

- **2 new files created** (ServiceAccount and RBAC templates)
- **9 files modified** with specific additions shown above
- All changes are backward compatible (conditional logic used)
- Security features: ServiceAccount, RBAC with minimal permissions, secret verification

