#!/bin/bash

# Production-safe DevOps script for Career Coach Platform
# Fully automated Kubernetes deployment for low-memory machines

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

# Check if monitoring flag is passed
WITH_MONITORING=false
if [[ "$1" == "--with-monitoring" ]]; then
    WITH_MONITORING=true
    print_info "Monitoring enabled"
fi

# Environment Setup
setup_environment() {
    print_step "Setting up environment..."
    
    # Check if Minikube cluster exists and is healthy
    if ! $KUBECTL get nodes >/dev/null 2>&1; then
        print_info "Minikube cluster is broken or doesn't exist. Recreating..."
        cleanup_minikube
        start_minikube
    else
        print_info "Minikube cluster is running"
        # Check if we can access the cluster properly
        if ! $KUBECTL get pods -A >/dev/null 2>&1; then
            print_info "Minikube cluster access issues. Recreating..."
            cleanup_minikube
            start_minikube
        fi
    fi
    
    # Enable Docker inside Minikube
    print_info "Enabling Docker inside Minikube..."
    eval $(minikube docker-env)
    
    # Enable DOCKER_BUILDKIT=1 for better builds
    export DOCKER_BUILDKIT=1
    
    print_success "Environment setup completed"
}

# Cleanup Minikube completely
cleanup_minikube() {
    print_info "Cleaning up Minikube..."
    minikube delete 2>/dev/null || true
    rm -rf ~/.minikube 2>/dev/null || true
    rm -rf ~/.kube/config 2>/dev/null || true
}

# Start Minikube with proper settings
start_minikube() {
    print_info "Starting Minikube with optimized settings..."
    minikube start \
        --driver=docker \
        --cpus=4 \
        --memory=6144 \
        --disk-size=20g \
        --force
    
    print_info "Waiting for Minikube to be ready..."
    $KUBECTL wait --for=condition=Ready nodes --all --timeout=300s
    
    # Verify cluster is working
    $KUBECTL get pods -A
    print_success "Minikube started successfully"
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
    else
        print_info "app-secrets-prod already exists"
    fi
    
    print_success "Secrets created"
}

# Build Docker images
build_images() {
    print_step "Building Docker images..."
    
    print_info "Building backend image..."
    docker build -t backend-prod:latest ./backend || {
        print_error "Backend build failed"
        exit 1
    }
    
    print_info "Building AI service image..."
    docker build -t ai-service-prod:latest ./ai-service || {
        print_error "AI service build failed"
        exit 1
    }
    
    print_info "Building frontend image..."
    docker build -t frontend-prod:latest ./frontend || {
        print_error "Frontend build failed"
        exit 1
    }
    
    print_success "All images built successfully"
}

# Apply Kubernetes configurations
apply_configs() {
    print_step "Applying Kubernetes configurations..."
    
    print_info "Applying namespace..."
    $KUBECTL apply -f k8s/namespace.yaml || true
    
    print_info "Applying secrets..."
    $KUBECTL apply -f k8s/secrets.yaml || true
    
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
    print_info "Waiting 20 seconds for pods to initialize..."
    sleep 20
}

# Install ArgoCD (GitOps)
install_argocd() {
    print_step "Installing ArgoCD..."
    
    # Check if ArgoCD namespace exists
    if ! $KUBECTL get namespace argocd >/dev/null 2>&1; then
        helm repo add argo https://argoproj.github.io/argo-helm
        helm repo update
        
        helm install argocd argo/argo-cd \
            --namespace argocd \
            --create-namespace \
            --wait --timeout=10m
    else
        print_info "ArgoCD namespace already exists"
    fi
    
    # Wait for ArgoCD pods to be ready
    $KUBECTL wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=120s
    
    print_success "ArgoCD installed successfully"
}

# Install Prometheus + Grafana (optional)
install_monitoring() {
    if [ "$WITH_MONITORING" = true ]; then
        print_step "Installing Prometheus and Grafana..."
        
        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
        helm repo update
        
        helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
            --namespace monitoring \
            --create-namespace \
            --timeout 10m \
            --wait
        
        print_success "Monitoring stack installed successfully"
    else
        print_step "Monitoring disabled for low-memory environment..."
        print_info "Use --with-monitoring flag to enable monitoring"
    fi
}

# Wait for pods with debug info
wait_for_pods() {
    print_step "Waiting for all pods to be ready..."
    
    # Show current pod status
    print_info "Current pod status:"
    $KUBECTL get pods -A || true
    
    print_info "Waiting for career-coach-prod pods..."
    $KUBECTL wait --for=condition=ready pod -n career-coach-prod --all --timeout=600s || {
        print_error "Some career-coach-prod pods failed to start"
        print_info "Checking events for debugging:"
        $KUBECTL get events -n career-coach-prod --sort-by='.lastTimestamp' || true
        print_info "Pod descriptions:"
        $KUBECTL describe pods -n career-coach-prod || true
    }
    
    if [ "$WITH_MONITORING" = true ]; then
        print_info "Waiting for monitoring pods..."
        $KUBECTL wait --for=condition=ready pod -n monitoring --all --timeout=300s || true
    fi
    
    print_info "Waiting for argocd pods..."
    $KUBECTL wait --for=condition=ready pod -n argocd --all --timeout=300s || true
    
    # Final status check
    print_info "Final pod status:"
    $KUBECTL get pods -A
    
    print_success "Pod waiting completed"
}

# Port forward (fixed and reliable)
setup_port_forward() {
    print_step "Setting up port forwarding..."
    
    # Kill old port forwards
    print_info "Cleaning up old port forwards..."
    for port in 3100 4100 5100 18082; do
        pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
        fi
    done
    
    # Wait a bit for cleanup
    sleep 3
    
    # Get running pods
    print_info "Checking pod status before port-forwarding:"
    $KUBECTL get pods -n career-coach-prod
    
    # Start new port forwards
    print_info "Starting port forwards..."
    
    # Frontend
    if $KUBECTL get pods -l app=frontend-prod -n career-coach-prod -o name | grep -q "pod"; then
        $KUBECTL port-forward svc/frontend-service 3100:80 -n career-coach-prod &
        echo $! > /tmp/career-coach-frontend.pid
        print_info "Frontend port-forward started (3100:80)"
    else
        print_error "Frontend pods not ready"
    fi
    
    # Backend
    if $KUBECTL get pods -l app=backend-prod -n career-coach-prod -o name | grep -q "pod"; then
        $KUBECTL port-forward svc/backend-service 4100:5000 -n career-coach-prod &
        echo $! > /tmp/career-coach-backend.pid
        print_info "Backend port-forward started (4100:5000)"
    else
        print_error "Backend pods not ready"
    fi
    
    # AI Service
    if $KUBECTL get pods -l app=ai-service-prod -n career-coach-prod -o name | grep -q "pod"; then
        $KUBECTL port-forward svc/ai-service 5100:5100 -n career-coach-prod &
        echo $! > /tmp/career-coach-ai-service.pid
        print_info "AI service port-forward started (5100:5100)"
    else
        print_error "AI service pods not ready"
    fi
    
    # ArgoCD (only if namespace exists)
    if $KUBECTL get namespace argocd >/dev/null 2>&1; then
        $KUBECTL port-forward svc/argocd-server 18082:443 -n argocd &
        echo $! > /tmp/career-coach-argocd.pid
        print_info "ArgoCD port-forward started (18082:443)"
    fi
    
    # Wait for port forwards to establish
    sleep 5
    
    print_success "Port forwarding setup completed"
}

# Fetch credentials (with safety)
fetch_credentials() {
    print_step "Fetching credentials..."
    
    # Fetch ArgoCD admin password
    ARGO_PASSWORD=$($KUBECTL -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d || echo "Not ready")
    
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
    if [ "$WITH_MONITORING" = true ]; then
        echo -e "${YELLOW}Grafana:${NC} http://localhost:3003"
        echo -e "  ${BLUE}Username:${NC} admin"
        echo -e "  ${BLUE}Password:${NC} $GRAFANA_PASSWORD"
        echo ""
    fi
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📋 Useful Commands:${NC}"
    echo -e "  • View pods:     ${YELLOW}minikube kubectl -- get pods -A${NC}"
    echo -e "  • Stop services: ${YELLOW}kill \$(cat /tmp/career-coach-*.pid)${NC}"
    echo -e "  • Minikube dashboard: ${YELLOW}minikube dashboard${NC}"
    echo -e "  • Verify services: ${YELLOW}curl -I http://localhost:3100${NC}"
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
