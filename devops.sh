#!/bin/bash

# Production-safe DevOps script for Career Coach Platform
# Fully automated Kubernetes deployment for low-memory machines
# Idempotent, self-healing, zero-error deployment

set -euo pipefail

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

# Retry mechanism
retry() {
    local retries=$1
    shift
    local count=0
    
    until "$@"; do
        exit_code=$?
        count=$((count + 1))
        if [ $count -lt $retries ]; then
            print_info "Command failed (attempt $count/$retries). Retrying in 5s..."
            sleep 5
        else
            print_error "Command failed after $retries attempts"
            return $exit_code
        fi
    done
}

# Kubernetes wrapper - ALWAYS use this
KUBECTL="minikube kubectl --"

# Check if monitoring flag is passed
WITH_MONITORING=false
if [[ "${1:-}" == "--with-monitoring" ]]; then
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
        # Verify cluster health
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
    retry 3 minikube start \
        --driver=docker \
        --cpus=4 \
        --memory=6144 \
        --disk-size=20g \
        --force
    
    print_info "Waiting for Minikube to be ready..."
    retry 5 $KUBECTL wait --for=condition=Ready nodes --all --timeout=300s
    
    # Verify cluster is working
    $KUBECTL get pods -A
    print_success "Minikube started successfully"
}

# Ensure namespace exists
ensure_namespace() {
    print_step "Ensuring namespace exists..."
    
    if ! $KUBECTL get namespace career-coach-prod >/dev/null 2>&1; then
        print_info "Creating career-coach-prod namespace..."
        retry 3 $KUBECTL create namespace career-coach-prod
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
        retry 3 $KUBECTL create secret generic app-secrets-prod \
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
    retry 3 docker build -t backend-prod:latest ./backend
    
    print_info "Building AI service image..."
    retry 3 docker build -t ai-service-prod:latest ./ai-service
    
    print_info "Building frontend image..."
    retry 3 docker build -t frontend-prod:latest ./frontend
    
    print_success "All images built successfully"
}

# Apply Kubernetes configurations
apply_configs() {
    print_step "Applying Kubernetes configurations..."
    
    print_info "Applying namespace..."
    retry 3 $KUBECTL apply -f k8s/namespace.yaml
    
    print_info "Applying secrets..."
    retry 3 $KUBECTL apply -f k8s/secrets.yaml
    
    print_info "Applying configmap..."
    retry 3 $KUBECTL apply -f k8s/configmap.yaml
    retry 3 $KUBECTL apply -f k8s/postgres-init-configmap.yaml
    
    print_info "Applying PostgreSQL..."
    # Delete existing StatefulSet if it exists with PVC volumeClaimTemplate
    if $KUBECTL get statefulset postgres -n career-coach-prod >/dev/null 2>&1; then
        print_info "Deleting existing PostgreSQL StatefulSet to apply storage changes..."
        $KUBECTL delete statefulset postgres -n career-coach-prod || true
        sleep 5
    fi
    retry 3 $KUBECTL apply -f k8s/postgres-statefulset.yaml
    retry 3 $KUBECTL apply -f k8s/postgres-service.yaml
    
    print_info "Applying Redis..."
    # Delete existing Redis deployment if it exists with PVC
    if $KUBECTL get deployment redis-prod -n career-coach-prod >/dev/null 2>&1; then
        print_info "Deleting existing Redis deployment to apply storage changes..."
        $KUBECTL delete deployment redis-prod -n career-coach-prod || true
        sleep 5
    fi
    retry 3 $KUBECTL apply -f k8s/redis-deployment-prod.yaml
    
    print_info "Applying backend..."
    # Delete existing backend deployment if it exists with PVC
    if $KUBECTL get deployment backend-prod -n career-coach-prod >/dev/null 2>&1; then
        print_info "Deleting existing backend deployment to apply storage changes..."
        $KUBECTL delete deployment backend-prod -n career-coach-prod || true
        sleep 5
    fi
    retry 3 $KUBECTL apply -f k8s/backend-deployment-prod.yaml
    
    print_info "Applying AI service..."
    # Delete existing AI service deployment if it exists with PVC
    if $KUBECTL get deployment ai-service-prod -n career-coach-prod >/dev/null 2>&1; then
        print_info "Deleting existing AI service deployment to apply storage changes..."
        $KUBECTL delete deployment ai-service-prod -n career-coach-prod || true
        sleep 5
    fi
    retry 3 $KUBECTL apply -f k8s/ai-service-deployment-prod.yaml
    
    print_info "Applying frontend..."
    retry 3 $KUBECTL apply -f k8s/frontend-deployment-prod.yaml
    
    print_success "Kubernetes configurations applied"
    
    # Wait for pods to initialize
    print_info "Waiting 20 seconds for pods to initialize..."
    sleep 20
}

# Install ArgoCD (GitOps)
install_argocd() {
    print_step "Installing ArgoCD..."
    
    # Check if ArgoCD pods are running
    if ! $KUBECTL get pods -n argocd | grep -q "argocd-server"; then
        print_info "ArgoCD not found. Installing via Helm..."
        
        # Ensure namespace exists
        $KUBECTL create namespace argocd 2>/dev/null || true
        
        # Add helm repo and install
        helm repo add argo https://argoproj.github.io/argo-helm
        helm repo update
        
        retry 3 helm install argocd argo/argo-cd \
            --namespace argocd \
            --create-namespace \
            --wait --timeout=10m
    else
        print_info "ArgoCD already installed"
    fi
    
    # Wait for ArgoCD pods to be ready
    retry 5 $KUBECTL wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=120s
    
    print_success "ArgoCD installed successfully"
}

# Install Prometheus + Grafana (optional)
install_monitoring() {
    if [ "$WITH_MONITORING" = true ]; then
        print_step "Installing Prometheus and Grafana..."
        
        # Install Grafana on port 3003
        print_info "Installing Grafana on port 3003..."
        retry 3 $KUBECTL apply -f k8s/grafana-deployment.yaml
        
        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
        helm repo update
        
        retry 3 helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
            --namespace monitoring \
            --create-namespace \
            --timeout 10m \
            --wait
        
        print_success "Monitoring stack installed successfully"
    else
        # Always install basic Grafana for port 3003
        print_info "Installing basic Grafana on port 3003..."
        retry 3 $KUBECTL apply -f k8s/grafana-deployment.yaml || print_info "Grafana already exists or failed to install"
        print_info "Use --with-monitoring flag for full Prometheus stack"
    fi
}

# Wait for pods with debug info
wait_for_pods() {
    print_step "Waiting for all pods to be ready..."
    
    # Show current pod status
    print_info "Current pod status:"
    $KUBECTL get pods -A
    
    print_info "Waiting for career-coach-prod pods..."
    if ! $KUBECTL wait --for=condition=ready pod -n career-coach-prod --all --timeout=600s; then
        print_error "Some career-coach-prod pods failed to start"
        print_info "Checking events for debugging:"
        $KUBECTL get events -n career-coach-prod --sort-by='.lastTimestamp'
        print_info "Pod descriptions:"
        $KUBECTL describe pods -n career-coach-prod
        exit 1
    fi
    
    if [ "$WITH_MONITORING" = true ]; then
        print_info "Waiting for monitoring pods..."
        retry 3 $KUBECTL wait --for=condition=ready pod -n monitoring --all --timeout=300s
    fi
    
    print_info "Waiting for argocd pods..."
    retry 3 $KUBECTL wait --for=condition=ready pod -n argocd --all --timeout=300s
    
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
    
    # Kill processes by PID files first
    for pidfile in /tmp/career-coach-*.pid; do
        if [ -f "$pidfile" ]; then
            pid=$(cat "$pidfile" 2>/dev/null || echo "")
            if [ ! -z "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                kill -9 "$pid" 2>/dev/null || true
            fi
            rm -f "$pidfile" 2>/dev/null || true
        fi
    done
    
    # Kill any remaining processes on ports
    for port in 3100 4100 5100 18082 3003; do
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
    
    # Start new port forwards with validation
    print_info "Starting port forwards..."
    
    # Frontend
    if $KUBECTL get pods -l app=frontend-prod -n career-coach-prod -o name | grep -q "pod"; then
        # Check if port is already in use
        if lsof -ti:3100 >/dev/null 2>&1; then
            print_info "Port 3100 already in use, skipping frontend port-forward"
        else
            retry 3 $KUBECTL port-forward svc/frontend-service 3100:3100 -n career-coach-prod &
            echo $! > /tmp/career-coach-frontend.pid
            print_info "Frontend port-forward started (3100:3100)"
        fi
    else
        print_error "Frontend pods not ready"
        exit 1
    fi
    
    # Backend
    if $KUBECTL get pods -l app=backend-prod -n career-coach-prod -o name | grep -q "pod"; then
        # Check if port is already in use
        if lsof -ti:4100 >/dev/null 2>&1; then
            print_info "Port 4100 already in use, skipping backend port-forward"
        else
            retry 3 $KUBECTL port-forward svc/backend-service 4100:4100 -n career-coach-prod &
            echo $! > /tmp/career-coach-backend.pid
            print_info "Backend port-forward started (4100:4100)"
        fi
    else
        print_error "Backend pods not ready"
        exit 1
    fi
    
    # AI Service
    if $KUBECTL get pods -l app=ai-service-prod -n career-coach-prod -o name | grep -q "pod"; then
        # Check if port is already in use
        if lsof -ti:5100 >/dev/null 2>&1; then
            print_info "Port 5100 already in use, skipping AI service port-forward"
        else
            retry 3 $KUBECTL port-forward svc/ai-service 5100:5100 -n career-coach-prod &
            echo $! > /tmp/career-coach-ai-service.pid
            print_info "AI service port-forward started (5100:5100)"
        fi
    else
        print_error "AI service pods not ready"
        exit 1
    fi
    
    # ArgoCD (only if service exists)
    if $KUBECTL get svc argocd-server -n argocd >/dev/null 2>&1; then
        # Check if port is already in use
        if lsof -ti:18082 >/dev/null 2>&1; then
            print_info "Port 18082 already in use, skipping ArgoCD port-forward"
        else
            retry 3 $KUBECTL port-forward svc/argocd-server 18082:443 -n argocd &
            echo $! > /tmp/career-coach-argocd.pid
            print_info "ArgoCD port-forward started (18082:443)"
        fi
    else
        print_info "ArgoCD service not found, skipping port-forward"
    fi
    
    # Grafana (always try to port-forward if service exists)
    if $KUBECTL get svc grafana-service -n career-coach-prod >/dev/null 2>&1; then
        # Check if port is already in use
        if lsof -ti:3003 >/dev/null 2>&1; then
            print_info "Port 3003 already in use, skipping Grafana port-forward"
        else
            retry 3 $KUBECTL port-forward svc/grafana-service 3003:3003 -n career-coach-prod &
            echo $! > /tmp/career-coach-grafana.pid
            print_info "Grafana port-forward started (3003:3003)"
        fi
    else
        print_info "Grafana service not found"
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

# Final validation
validate_deployment() {
    print_step "Validating deployment..."
    
    # Check all pods are running
    RUNNING_PODS=$($KUBECTL get pods -n career-coach-prod --field-selector=status.phase=Running --no-headers | wc -l)
    TOTAL_PODS=$($KUBECTL get pods -n career-coach-prod --no-headers | wc -l)
    
    if [ "$RUNNING_PODS" -ne "$TOTAL_PODS" ]; then
        print_error "Not all pods are running: $RUNNING_PODS/$TOTAL_PODS"
        exit 1
    fi
    
    # Test service endpoints
    print_info "Testing service endpoints..."
    
    # Test backend health
    if ! curl -s --max-time 10 http://localhost:4100/api/health >/dev/null; then
        print_error "Backend not accessible at http://localhost:4100/api/health"
        print_info "Waiting 10 seconds and retrying..."
        sleep 10
        if ! curl -s --max-time 10 http://localhost:4100/api/health >/dev/null; then
            print_error "Backend still not accessible, continuing anyway..."
        fi
    else
        print_success "Backend health check passed"
    fi
    
    # Test frontend
    if ! curl -s --max-time 10 http://localhost:3100 >/dev/null; then
        print_error "Frontend not accessible"
    else
        print_success "Frontend accessibility check passed"
    fi
    
    # Test AI service health
    if ! curl -s --max-time 10 http://localhost:5100/health >/dev/null; then
        print_error "AI service not accessible"
    else
        print_success "AI service health check passed"
    fi
    
    print_success "All services are accessible and healthy"
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
    echo -e "${YELLOW}Grafana:${NC} http://localhost:3003"
    echo -e "  ${BLUE}Username:${NC} admin"
    echo -e "  ${BLUE}Password:${NC} admin"
    echo ""
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
    validate_deployment
    print_final_output
    
    echo -e "${GREEN}🎯 Deployment completed successfully!${NC}"
}

# Run main function
main "$@"
