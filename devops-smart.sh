#!/bin/bash

# SMART DevOps Script for Career Coach Platform
# Auto-detects environment, switches between FAST and FULL modes
# Intelligent resource management, parallel builds, optimized performance

set -euo pipefail

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAST_MODE=false
FULL_MODE=false
AUTO_MODE=true
SKIP_DOCKER=false
SKIP_MINIKUBE=false

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

print_mode() {
    echo -e "${CYAN}[MODE]${NC} $1"
}

# Enhanced retry mechanism with better error logging
retry() {
    local retries=$1
    shift
    local count=0
    local command="$*"
    
    until "$@"; do
        exit_code=$?
        count=$((count + 1))
        if [ $count -lt $retries ]; then
            print_error "Command failed (attempt $count/$retries): $command"
            print_info "Retrying in 3s..."
            sleep 3
        else
            print_error "Command failed after $retries attempts: $command"
            return $exit_code
        fi
    done
}

# Auto-detect environment state
detect_environment() {
    print_step "Detecting environment state..."
    
    # Check if Minikube is running
    if command -v minikube >/dev/null 2>&1; then
        if minikube status >/dev/null 2>&1 | grep -q "Running"; then
            print_info "Minikube is running"
            SKIP_MINIKUBE=true
        else
            print_info "Minikube is not running"
            SKIP_MINIKUBE=false
        fi
    else
        print_error "Minikube not installed"
        exit 1
    fi
    
    # Check if images exist
    local images_exist=true
    for image in "backend-prod:latest" "frontend-prod:latest" "ai-service-prod:latest"; do
        if ! docker images --format "table {{.Repository}}:{{.Tag}}" | grep -q "$image"; then
            images_exist=false
            break
        fi
    done
    
    if [ "$images_exist" = true ]; then
        print_info "Docker images exist"
        SKIP_DOCKER=true
    else
        print_info "Docker images need to be built"
        SKIP_DOCKER=false
    fi
    
    # Check for source changes
    local has_changes=false
    if command -v git >/dev/null 2>&1; then
        if [ -n "$(git status --porcelain 2>/dev/null)" ]; then
            has_changes=true
            print_info "Source code has changes"
        else
            print_info "Source code is clean"
        fi
    fi
    
    # Auto-decide mode
    if [ "$AUTO_MODE" = true ]; then
        if [ "$SKIP_MINIKUBE" = false ] || [ "$SKIP_DOCKER" = false ] || [ "$has_changes" = true ]; then
            FULL_MODE=true
            print_mode "FULL mode - Environment needs setup"
        else
            FAST_MODE=true
            print_mode "FAST mode - Incremental deployment"
        fi
    fi
}

# System resource detection
detect_resources() {
    print_step "Detecting system resources..."
    
    # Get available memory in GB
    if command -v free >/dev/null 2>&1; then
        TOTAL_MEM=$(free -g | awk 'NR==2{printf "%.1f", $2}')
        print_info "Total memory: ${TOTAL_MEM}GB"
        
        # Auto-adjust resources based on available memory
        if (( $(echo "$TOTAL_MEM < 4.0" | bc -l) )); then
            export MINIKUBE_MEMORY="4096"
            export MINIKUBE_CPUS="2"
            print_info "Low memory detected - Using optimized settings"
        elif (( $(echo "$TOTAL_MEM < 8.0" | bc -l) )); then
            export MINIKUBE_MEMORY="6144"
            export MINIKUBE_CPUS="4"
            print_info "Medium memory detected - Using standard settings"
        else
            export MINIKUBE_MEMORY="8192"
            export MINIKUBE_CPUS="6"
            print_info "High memory detected - Using performance settings"
        fi
    else
        export MINIKUBE_MEMORY="6144"
        export MINIKUBE_CPUS="4"
        print_info "Using default memory settings"
    fi
}

# Setup environment
setup_environment() {
    if [ "$SKIP_MINIKUBE" = true ] && [ "$FAST_MODE" = true ]; then
        print_info "Skipping Minikube setup (already running, fast mode)"
        return 0
    fi
    
    print_step "Setting up environment..."
    
    if [ "$SKIP_MINIKUBE" = false ]; then
        print_info "Minikube cluster is broken or doesn't exist. Recreating..."
        print_info "Cleaning up Minikube..."
        minikube delete --all --purge >/dev/null 2>&1 || true
        
        print_info "Starting Minikube with optimized settings..."
        # Try newer syntax first, fallback to older syntax
        if minikube start \
            --driver=docker \
            --memory="$MINIKUBE_MEMORY" \
            --cpus="$MINIKUBE_CPUS" \
            --disk-size="20g" \
            --kubernetes-version="stable" \
            --extra-config=kubelet.max-pods=110 2>/dev/null; then
            print_info "Minikube started with new syntax"
        elif minikube start \
            --driver=docker \
            --memory="$MINIKUBE_MEMORY" \
            --cpus="$MINIKUBE_CPUS" \
            --disk-size="20g" \
            --kubernetes-version="stable" \
            --extra-configs=kubelet.max-pods=110 2>/dev/null; then
            print_info "Minikube started with legacy syntax"
        else
            print_info "Starting Minikube with basic settings..."
            minikube start \
                --driver=docker \
                --memory="$MINIKUBE_MEMORY" \
                --cpus="$MINIKUBE_CPUS" \
                --disk-size="20g" \
                --kubernetes-version="stable"
        fi
        
        print_info "Waiting for Minikube to be ready..."
        minikube kubectl -- wait --for=condition=ready --timeout=300s pod --all -A
        print_success "Minikube started successfully"
    fi
    
    print_info "Enabling Docker inside Minikube..."
    eval $(minikube docker-env)
    print_success "Environment setup completed"
}

# Smart Docker builds with parallel execution
build_images() {
    if [ "$SKIP_DOCKER" = true ] && [ "$FAST_MODE" = true ]; then
        print_info "Skipping Docker builds (images exist, fast mode)"
        return 0
    fi
    
    print_step "Building Docker images..."
    
    # Build in parallel for speed
    local pids=()
    
    # Backend build
    (
        print_info "Building backend image..."
        cd "$SCRIPT_DIR/backend"
        if docker build -t backend-prod:latest . --build-arg BUILDKIT_INLINE_CACHE=1; then
            print_success "Backend image built"
        else
            print_error "Backend build failed"
            exit 1
        fi
    ) &
    pids+=($!)
    
    # AI Service build
    (
        print_info "Building AI service image..."
        cd "$SCRIPT_DIR/ai-service"
        if docker build -t ai-service-prod:latest . --build-arg BUILDKIT_INLINE_CACHE=1; then
            print_success "AI service image built"
        else
            print_error "AI service build failed"
            exit 1
        fi
    ) &
    pids+=($!)
    
    # Frontend build
    (
        print_info "Building frontend image..."
        cd "$SCRIPT_DIR/frontend"
        if docker build -t frontend-prod:latest . --build-arg BUILDKIT_INLINE_CACHE=1; then
            print_success "Frontend image built"
        else
            print_error "Frontend build failed"
            exit 1
        fi
    ) &
    pids+=($!)
    
    # Wait for all builds to complete
    local failed=0
    for pid in "${pids[@]}"; do
        if ! wait "$pid"; then
            failed=1
        fi
    done
    
    if [ $failed -eq 1 ]; then
        print_error "One or more builds failed"
        exit 1
    fi
    
    print_success "All images built successfully"
}

# Apply Kubernetes configurations
apply_kubernetes_configs() {
    print_step "Applying Kubernetes configurations..."
    
    # Always apply configs in fast mode (they might have changed)
    print_info "Applying namespace..."
    retry 3 minikube kubectl -- apply -f k8s/namespace.yaml
    
    print_info "Applying secrets..."
    retry 3 minikube kubectl -- apply -f k8s/secrets.yaml
    
    print_info "Applying configmap..."
    retry 3 minikube kubectl -- apply -f k8s/configmap.yaml
    retry 3 minikube kubectl -- apply -f k8s/postgres-init-configmap.yaml
    
    # Only recreate PostgreSQL if needed
    if [ "$FAST_MODE" = false ] || [ "$SKIP_DOCKER" = false ]; then
        print_info "Applying PostgreSQL..."
        if minikube kubectl -- get statefulset postgres -n career-coach-prod >/dev/null 2>&1; then
            print_info "Deleting existing PostgreSQL StatefulSet to apply storage changes..."
            minikube kubectl -- delete statefulset postgres -n career-coach-prod || true
            sleep 5
        fi
        retry 3 minikube kubectl -- apply -f k8s/postgres-statefulset.yaml
        retry 3 minikube kubectl -- apply -f k8s/postgres-service.yaml
    fi
    
    print_info "Applying Redis..."
    if [ "$FAST_MODE" = false ] || [ "$SKIP_DOCKER" = false ]; then
        if minikube kubectl -- get deployment redis-prod -n career-coach-prod >/dev/null 2>&1; then
            print_info "Deleting existing Redis deployment to apply storage changes..."
            minikube kubectl -- delete deployment redis-prod -n career-coach-prod || true
            sleep 5
        fi
    fi
    retry 3 minikube kubectl -- apply -f k8s/redis-deployment-prod.yaml
    retry 3 minikube kubectl -- apply -f k8s/redis-service.yaml
    
    print_info "Applying backend..."
    retry 3 minikube kubectl -- apply -f k8s/backend-deployment-prod.yaml
    retry 3 minikube kubectl -- apply -f k8s/backend-service.yaml
    
    print_info "Applying AI service..."
    retry 3 minikube kubectl -- apply -f k8s/ai-service-deployment-prod.yaml
    retry 3 minikube kubectl -- apply -f k8s/ai-service-service.yaml
    
    print_info "Applying frontend..."
    retry 3 minikube kubectl -- apply -f k8s/frontend-deployment-prod.yaml
    retry 3 minikube kubectl -- apply -f k8s/frontend-service.yaml
    
    print_success "Kubernetes configurations applied"
}

# Install monitoring and ArgoCD
install_tools() {
    if [ "$FAST_MODE" = true ]; then
        print_info "Skipping tool installation (fast mode)"
        return 0
    fi
    
    print_step "Installing ArgoCD..."
    
    if ! minikube kubectl -- get namespace argocd >/dev/null 2>&1; then
        print_info "ArgoCD not found. Installing via Helm..."
        minikube kubectl -- create namespace argocd || true
        helm repo add argo https://argoproj.github.io/argo-helm || true
        helm repo add prometheus-community https://prometheus-community.github.io/helm-charts || true
        helm upgrade --install argocd argo/argo-cd --namespace argocd --version 7.3.5 || true
        minikube kubectl -- wait --for=condition=ready --timeout=300s pod -l app.kubernetes.io/name=argocd-server -n argocd
        print_success "ArgoCD installed successfully"
    else
        print_info "ArgoCD already installed"
    fi
    
    print_step "Installing basic Grafana on port 3003..."
    minikube kubectl -- apply -f k8s/grafana-deployment.yaml || true
    print_info "Use --with-monitoring flag for full Prometheus stack"
}

# Intelligent pod waiting with reduced timeouts for fast mode
wait_for_pods() {
    print_step "Waiting for all pods to be ready..."
    
    local timeout=300
    local wait_time=20
    if [ "$FAST_MODE" = true ]; then
        timeout=180
        wait_time=10
        print_info "Using fast mode timeouts"
    fi
    
    print_info "Waiting ${wait_time}s for pods to initialize..."
    sleep $wait_time
    
    local start_time=$(date +%s)
    local end_time=$((start_time + timeout))
    
    while [ $(date +%s) -lt $end_time ]; do
        local pod_status=$(minikube kubectl -- get pods -n career-coach-prod --no-headers 2>/dev/null)
        
        local ready_count=$(echo "$pod_status" | grep -E "(Running|Ready)" | wc -l || echo "0")
        local total_count=$(echo "$pod_status" | wc -l)
        
        print_info "Current pod status: $ready_count/$total_count ready"
        
        if [ "$ready_count" -eq "$total_count" ] && [ "$total_count" -gt 0 ]; then
            print_success "All pods are ready!"
            return 0
        fi
        
        sleep 10
    done
    
    print_error "Timeout waiting for pods to be ready"
    return 1
}

# Smart port forwarding
setup_port_forwards() {
    print_step "Starting port forwards..."
    
    # Kill existing port forwards
    if [ -f /tmp/career-coach-*.pid ]; then
        print_info "Cleaning up existing port forwards..."
        for pid_file in /tmp/career-coach-*.pid; do
            if [ -f "$pid_file" ]; then
                kill -$(cat "$pid_file") 2>/dev/null || true
                rm -f "$pid_file"
            fi
        done
    fi
    
    # Frontend
    if minikube kubectl -- get pods -l app=frontend-prod -n career-coach-prod -o name | grep -q "pod"; then
        if ! lsof -ti:3100 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/frontend-service 3100:3100 -n career-coach-prod &
            echo $! > /tmp/career-coach-frontend.pid
            print_success "Frontend port-forward started (3100:3100)"
        else
            print_info "Port 3100 already in use, skipping frontend port-forward"
        fi
    else
        print_error "Frontend pods not ready"
        return 1
    fi
    
    # Backend
    if minikube kubectl -- get pods -l app=backend-prod -n career-coach-prod -o name | grep -q "pod"; then
        if ! lsof -ti:4100 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/backend-service 4100:5000 -n career-coach-prod &
            echo $! > /tmp/career-coach-backend.pid
            print_success "Backend port-forward started (4100:5000)"
        else
            print_info "Port 4100 already in use, skipping backend port-forward"
        fi
    else
        print_error "Backend pods not ready"
        return 1
    fi
    
    # AI Service
    if minikube kubectl -- get pods -l app=ai-service-prod -n career-coach-prod -o name | grep -q "pod"; then
        if ! lsof -ti:5100 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/ai-service 5100:5100 -n career-coach-prod &
            echo $! > /tmp/career-coach-ai-service.pid
            print_success "AI Service port-forward started (5100:5100)"
        else
            print_info "Port 5100 already in use, skipping AI service port-forward"
        fi
    else
        print_error "AI Service pods not ready"
        return 1
    fi
    
    # Grafana
    if minikube kubectl -- get pods -l app=grafana -n career-coach-prod -o name | grep -q "pod"; then
        if ! lsof -ti:3003 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/grafana-service 3003:3000 -n career-coach-prod &
            echo $! > /tmp/career-coach-grafana.pid
            print_success "Grafana port-forward started (3003:3000)"
        else
            print_info "Port 3003 already in use, skipping Grafana port-forward"
        fi
    else
        print_info "Grafana pods not ready"
        return 1
    fi
    
    print_success "All port forwards started"
}

# Print final output
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
    echo -e "  ${BLUE}Password:${NC} $(minikube kubectl -- -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d 2>/dev/null || echo "Run: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d")"
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
    echo -e "${CYAN}Mode: ${MODE}${NC}"
    echo ""
}

# Cleanup function
cleanup() {
    print_info "Cleaning up..."
    if [ -f /tmp/career-coach-*.pid ]; then
        for pid_file in /tmp/career-coach-*.pid; do
            if [ -f "$pid_file" ]; then
                kill -$(cat "$pid_file") 2>/dev/null || true
                rm -f "$pid_file"
            fi
        done
    fi
    print_success "Cleanup completed"
}

# Parse command line arguments
parse_args() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --fast)
                FAST_MODE=true
                FULL_MODE=false
                AUTO_MODE=false
                print_mode "FAST mode enabled"
                shift
                ;;
            --full)
                FULL_MODE=true
                FAST_MODE=false
                AUTO_MODE=false
                print_mode "FULL mode enabled"
                shift
                ;;
            --cleanup)
                cleanup
                exit 0
                ;;
            --help|-h)
                echo "SMART DevOps Script for Career Coach Platform"
                echo ""
                echo "USAGE:"
                echo "  $0 [OPTIONS]"
                echo ""
                echo "OPTIONS:"
                echo "  --fast     Force fast mode (skip rebuilds, reuse cluster)"
                echo "  --full     Force full rebuild (rebuild everything)"
                echo "  --cleanup  Clean up port forwards and exit"
                echo "  --help     Show this help message"
                echo ""
                echo "DEFAULT: Auto-detect environment and choose optimal mode"
                echo ""
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
}

# Main execution flow
main() {
    echo -e "${CYAN}🚀 SMART Career Coach Platform Deployment${NC}"
    echo ""
    
    parse_args "$@"
    
    # Setup signal handlers
    trap cleanup EXIT
    
    # Environment detection and resource detection
    detect_environment
    detect_resources
    
    # Setup environment
    setup_environment
    
    # Build images
    build_images
    
    # Apply configurations
    apply_kubernetes_configs
    
    # Install tools
    install_tools
    
    # Wait for pods
    if wait_for_pods; then
        # Setup port forwards
        setup_port_forwards
        
        # Print final output
        print_final_output
    else
        print_error "Deployment failed - some pods are not ready"
        exit 1
    fi
}

# Execute main function
main "$@"
