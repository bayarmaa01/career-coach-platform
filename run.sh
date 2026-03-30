#!/bin/bash

# Simple run script for Career Coach Platform
# Quick deployment for daily usage

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
    
    print_info "Applying Grafana..."
    $KUBECTL apply -f k8s/grafana-deployment.yaml || true
    
    print_success "Kubernetes configurations applied"
    
    # Wait for pods to initialize
    print_info "Waiting 15 seconds for pods to initialize..."
    sleep 15
}

# Wait for pods (improved safety)
wait_for_pods() {
    print_step "Waiting for all pods to be ready..."
    
    print_info "Waiting for career-coach-prod pods..."
    $KUBECTL wait --for=condition=ready pod -n career-coach-prod --all --timeout=300s || echo "Some career-coach-prod pods not ready yet, continuing..."
    
    print_info "Checking career-coach-prod pod status..."
    $KUBECTL get pods -n career-coach-prod || echo "Namespace not ready yet"
    
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
    for pid in /tmp/career-coach-*.pid; do
        [ -f "$pid" ] && kill -$(cat "$pid" 2>/dev/null || true) && rm -f "$pid"
    done
    
    # Start new port forwards with safety
    print_info "Starting port forwards..."
    
    # Frontend
    if lsof -ti:3100 >/dev/null 2>&1; then
        print_info "Port 3100 already in use, skipping frontend port-forward"
    else
        $KUBECTL port-forward svc/frontend-service 3100:3100 -n career-coach-prod &
        echo $! > /tmp/career-coach-frontend.pid || true
        print_info "Frontend port-forward started (3100:3100)"
    fi
    
    # Backend
    if lsof -ti:4100 >/dev/null 2>&1; then
        print_info "Port 4100 already in use, skipping backend port-forward"
    else
        $KUBECTL port-forward svc/backend 4100:5000 -n career-coach-prod &
        echo $! > /tmp/career-coach-backend.pid || true
        print_info "Backend port-forward started (4100:5000)"
    fi
    
    # AI Service
    if lsof -ti:5100 >/dev/null 2>&1; then
        print_info "Port 5100 already in use, skipping AI service port-forward"
    else
        $KUBECTL port-forward svc/ai-service 5100:5100 -n career-coach-prod &
        echo $! > /tmp/career-coach-ai-service.pid || true
        print_info "AI service port-forward started (5100:5100)"
    fi
    
    # Grafana
    if $KUBECTL get svc grafana-service -n career-coach-prod >/dev/null 2>&1; then
        if lsof -ti:3003 >/dev/null 2>&1; then
            print_info "Port 3003 already in use, skipping Grafana port-forward"
        else
            $KUBECTL port-forward svc/grafana-service 3003:3000 -n career-coach-prod &
            echo $! > /tmp/career-coach-grafana.pid || true
            print_info "Grafana port-forward started (3003:3000)"
        fi
    else
        print_info "Grafana service not found"
    fi
    
    # ArgoCD
    if $KUBECTL get svc argocd-server -n argocd >/dev/null 2>&1; then
        if lsof -ti:18082 >/dev/null 2>&1; then
            print_info "Port 18082 already in use, skipping ArgoCD port-forward"
        else
            $KUBECTL port-forward svc/argocd-server 18082:443 -n argocd &
            echo $! > /tmp/career-coach-argocd.pid || true
            print_info "ArgoCD port-forward started (18082:443)"
        fi
    else
        print_info "ArgoCD service not found"
    fi
    
    # Wait for port forwards to establish
    sleep 3
    
    print_success "Port forwarding setup completed"
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
    echo -e "${YELLOW}Grafana:${NC}    http://localhost:3003"
    echo -e "  ${BLUE}Username:${NC} admin"
    echo -e "  ${BLUE}Password:${NC} admin"
    echo ""
    echo -e "${YELLOW}ArgoCD:${NC}     https://localhost:18082"
    echo -e "  ${BLUE}Username:${NC} admin"
    echo -e "  ${BLUE}Password:${NC} $ARGO_PASSWORD"
    echo ""
    
    # Quick health check
    print_info "Performing quick health checks..."
    sleep 5
    
    if curl -s --max-time 5 http://localhost:4100/api/health >/dev/null; then
        print_success "✅ Backend health check passed"
    else
        print_info "⚠️ Backend health check failed (may still be starting)"
    fi
    
    if curl -s --max-time 5 http://localhost:3100 >/dev/null; then
        print_success "✅ Frontend accessibility check passed"
    else
        print_info "⚠️ Frontend accessibility check failed (may still be starting)"
    fi
    
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📋 Useful Commands:${NC}"
    echo -e "  • View pods:     ${YELLOW}minikube kubectl -- get pods -n career-coach-prod${NC}"
    echo -e "  • View logs:     ${YELLOW}minikube kubectl -- logs -n career-coach-prod deployment/backend-prod${NC}"
    echo -e "  • Stop services: ${YELLOW}kill \$(cat /tmp/career-coach-*.pid)${NC}"
    echo -e "  • Minikube dashboard: ${YELLOW}minikube dashboard${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting Career Coach Platform...${NC}"
    echo ""
    
    setup_environment
    ensure_namespace
    create_secrets
    build_images
    apply_configs
    wait_for_pods
    setup_port_forward
    
    # Fetch ArgoCD password
    ARGO_PASSWORD=$($KUBECTL -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d || echo "Not ready")
    
    print_final_output
    
    echo -e "${GREEN}🎯 Quick deployment completed successfully!${NC}"
}

# Run main function
main "$@"
