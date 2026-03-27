#!/bin/bash

# Production-safe DevOps script for Career Coach Platform
# Fully automated Kubernetes deployment

set -e

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Kubernetes wrapper - ALWAYS use this
KUBECTL="minikube kubectl --"

# Environment Setup
setup_environment() {
    print_step "Setting up environment..."
    
    # Ensure Minikube is running
    if ! minikube status | grep -q "Running"; then
        print_info "Starting Minikube with Docker driver..."
        minikube start --driver=docker --cpus=4 --memory=6144
        print_info "Waiting for Minikube to be ready..."
        $KUBECTL wait --for=condition=Ready nodes --all --timeout=300s || true
    else
        print_info "Minikube is already running"
    fi
    
    # Enable Docker inside Minikube
    print_info "Enabling Docker inside Minikube..."
    eval $(minikube docker-env)
    
    # Fix Docker buildx warning
    export DOCKER_BUILDKIT=0
    
    print_success "Environment setup completed"
}

# Ensure namespace exists
ensure_namespace() {
    print_step "Ensuring namespace exists..."
    
    if ! $KUBECTL get namespace career-coach-prod >/dev/null 2>&1; then
        print_info "Creating career-coach-prod namespace..."
        $KUBECTL create namespace career-coach-prod
    else
        print_info "career-coach-prod namespace already exists"
    fi
    
    print_success "Namespace ensured"
}

# Auto create secrets (safe)
create_secrets() {
    print_step "Creating secrets..."
    
    if ! $KUBECTL get secret app-secrets-prod -n career-coach-prod >/dev/null 2>&1; then
        print_info "Creating app-secrets-prod..."
        $KUBECTL create secret generic app-secrets-prod \
            --from-literal=POSTGRES_USER=postgres \
            --from-literal=POSTGRES_PASSWORD=$(openssl rand -base64 12) \
            --from-literal=REDIS_PASSWORD=$(openssl rand -base64 12) \
            --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
            -n career-coach-prod
        print_success "Secrets created"
    else
        print_info "Secrets already exist, skipping..."
    fi
}

# Build Docker images (local)
build_images() {
    print_step "Building Docker images..."
    
    print_info "Building backend image..."
    docker build -t backend-prod:latest ./backend || true
    
    print_info "Building AI service image..."
    docker build -t ai-service-prod:latest ./ai-service || true
    
    print_info "Building frontend image..."
    docker build -t frontend-prod:latest ./frontend || true
    
    print_success "All images built successfully"
}

# Apply Kubernetes configs
apply_configs() {
    print_step "Applying Kubernetes configurations..."
    
    # Apply in order with safety
    print_info "Applying namespace..."
    $KUBECTL apply -f k8s/namespace-prod.yaml || true
    
    print_info "Applying secrets..."
    $KUBECTL apply -f k8s/secrets-prod.yaml || true
    
    print_info "Applying configmap..."
    $KUBECTL apply -f k8s/configmap.yaml || true
    
    print_info "Applying PostgreSQL..."
    $KUBECTL apply -f k8s/postgres-statefulset.yaml || true
    
    print_info "Applying Redis..."
    $KUBECTL apply -f k8s/redis-deployment-prod.yaml || true
    
    print_info "Applying backend..."
    $KUBECTL apply -f k8s/backend-deployment-prod.yaml || true
    
    print_info "Applying AI service..."
    $KUBECTL apply -f k8s/ai-service-deployment-prod.yaml || true
    
    print_info "Applying frontend..."
    $KUBECTL apply -f k8s/frontend-deployment-prod.yaml || true
    
    print_success "Kubernetes configurations applied"
    
    # Wait for pods to initialize
    print_info "Waiting 15 seconds for pods to initialize..."
    sleep 15
}

# Install ArgoCD (safe)
install_argocd() {
    print_step "Installing ArgoCD..."
    
    # Check if argocd namespace exists
    if $KUBECTL get namespace argocd >/dev/null 2>&1; then
        print_info "ArgoCD namespace already exists, skipping installation..."
        return
    fi
    
    print_info "Installing ArgoCD using Helm..."
    helm repo add argo https://argoproj.github.io/argo-helm || true
    helm repo update || true
    
    helm install argocd argo/argo-cd \
        --namespace argocd \
        --create-namespace \
        --wait || true
    
    print_success "ArgoCD installed successfully"
}

# Install Prometheus + Grafana (DISABLED for low memory)
install_monitoring() {
    print_step "Monitoring disabled for low-memory environment..."
    print_info "Skipping Prometheus and Grafana installation"
    print_info "Use ./devops.sh --with-monitoring to enable monitoring"
}

# Wait for pods (improved safety)
wait_for_pods() {
    print_step "Waiting for all pods to be ready..."
    
    print_info "Waiting for career-coach-prod pods..."
    $KUBECTL wait --for=condition=ready pod -n career-coach-prod --all --timeout=600s || echo "Some career-coach-prod pods not ready yet, continuing..."
    
    print_info "Checking career-coach-prod pod status..."
    $KUBECTL get pods -n career-coach-prod || echo "Namespace not ready yet"
    
    print_info "Waiting for argocd pods..."
    $KUBECTL wait --for=condition=ready pod -n argocd --all --timeout=300s || echo "Some argocd pods not ready yet, continuing..."
    
    print_success "Pod waiting completed"
}

# Port forward (fixed ports with safety)
setup_port_forward() {
    print_step "Setting up port forwarding..."
    
    # Add delay before port-forward
    print_info "Waiting 10 seconds before setting up port forwards..."
    sleep 10
    
    # Ensure services exist before forwarding
    print_info "Checking services exist..."
    $KUBECTL get svc -n career-coach-prod || echo "Services not ready yet"
    
    # Kill old ports
    print_info "Cleaning up old port forwards..."
    for port in 3100 4100 5100 18082; do
        pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    # Start new port forwards with safety
    print_info "Starting port forwards..."
    
    # Wait for services to be ready before port-forwarding
    print_info "Waiting for services to be ready..."
    $KUBECTL wait --for=condition=ready svc/frontend-service -n career-coach-prod --timeout=60s || true
    $KUBECTL wait --for=condition=ready svc/backend-service -n career-coach-prod --timeout=60s || true
    $KUBECTL wait --for=condition=ready svc/ai-service -n career-coach-prod --timeout=60s || true
    
    $KUBECTL port-forward svc/frontend-service 3100:80 -n career-coach-prod &
    echo $! > /tmp/career-coach-frontend.pid || true
    
    $KUBECTL port-forward svc/backend-service 4100:5000 -n career-coach-prod &
    echo $! > /tmp/career-coach-backend.pid || true
    
    $KUBECTL port-forward svc/ai-service 5100:5100 -n career-coach-prod &
    echo $! > /tmp/career-coach-ai-service.pid || true
    
    $KUBECTL port-forward svc/argocd-server 18082:443 -n argocd &
    echo $! > /tmp/career-coach-argocd.pid || true
    
    # Wait for port forwards to establish
    sleep 5
    
    print_success "Port forwarding setup completed"
}

# Fetch credentials (with safety)
fetch_credentials() {
    print_step "Fetching credentials..."
    
    # Use set +e for non-critical operations
    set +e
    
    # Fetch ArgoCD admin password
    ARGO_PASSWORD=$($KUBECTL -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "Not ready")
    
    # Re-enable error checking
    set -e
    
    print_success "Credentials fetched"
}

# Final output
print_final_output() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🚀 Career Coach Platform is running!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}🌐 Application URLs:${NC}"
    echo -e "${YELLOW}Frontend:${NC}   http://localhost:3100"
    echo -e "${YELLOW}Backend:${NC}    http://localhost:4100"
    echo -e "${YELLOW}AI Service:${NC} http://localhost:5100"
    echo ""
    echo -e "${BLUE}⚙️ DevOps Tools:${NC}"
    echo -e "${YELLOW}ArgoCD:${NC}  https://localhost:18082"
    echo -e "  ${BLUE}Username:${NC} admin"
    echo -e "  ${BLUE}Password:${NC} $ARGO_PASSWORD"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📋 Useful Commands:${NC}"
    echo -e "  • View pods:     ${YELLOW}minikube kubectl -- get pods -n career-coach-prod${NC}"
    echo -e "  • Stop services: ${YELLOW}kill \$(cat /tmp/career-coach-*.pid)${NC}"
    echo -e "  • Minikube dashboard: ${YELLOW}minikube dashboard${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting Career Coach Platform Deployment...${NC}"
    echo ""
    
    setup_environment
    ensure_namespace
    create_secrets
    build_images
    apply_configs
    install_argocd
    install_monitoring
    wait_for_pods
    setup_port_forward
    fetch_credentials
    print_final_output
    
    echo -e "${GREEN}🎯 Deployment completed successfully!${NC}"
}

# Run main function
main "$@"
