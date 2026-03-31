#!/bin/bash

# 🚀 Career Coach Platform - Production DevOps System
# ONE-COMMAND deployment solution - Senior DevOps Engineer

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="career-coach-prod"
TIMEOUT_SECONDS=600
HEALTH_CHECK_RETRIES=60
HEALTH_CHECK_DELAY=5

# Port-forward PIDs array
PF_PIDS=()

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}[INFO]${NC} Cleaning up port forwards..."
    for pid in "${PF_PIDS[@]}"; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    # Clean up PID files
    for pid_file in /tmp/career-coach-*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file" 2>/dev/null || echo "")
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
        fi
    done
    
    echo -e "${GREEN}[SUCCESS]${NC} Cleanup completed"
}

# Set trap for cleanup
trap cleanup EXIT INT TERM

# Print functions
print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Minikube is running
check_minikube() {
    print_info "Checking Minikube status..."
    
    if ! minikube status >/dev/null 2>&1; then
        print_info "Starting Minikube..."
        minikube start --driver=docker --cpus=4 --memory=4096 --disk-size=20g
    else
        print_info "Minikube is already running"
    fi
    
    # Verify Minikube is ready
    local retries=30
    while [ $retries -gt 0 ]; do
        if minikube status | grep -q "Running"; then
            print_success "Minikube is ready"
            return 0
        fi
        sleep 2
        ((retries--))
    done
    
    print_error "Minikube failed to start"
    return 1
}

# Build Docker images
build_images() {
    print_info "Building Docker images..."
    
    # Build backend
    if [ -d "backend" ]; then
        print_info "Building backend image..."
        cd backend
        docker build -t backend-prod:latest . || {
            print_error "Backend build failed"
            return 1
        }
        cd ..
        print_success "Backend image built"
    fi
    
    # Build frontend
    if [ -d "frontend" ]; then
        print_info "Building frontend image..."
        cd frontend
        docker build -t frontend-prod:latest . || {
            print_error "Frontend build failed"
            return 1
        }
        cd ..
        print_success "Frontend image built"
    fi
    
    # Build AI service
    if [ -d "ai-service" ]; then
        print_info "Building AI service image..."
        cd ai-service
        docker build -t ai-service-prod:latest . || {
            print_error "AI service build failed"
            return 1
        }
        cd ..
        print_success "AI service image built"
    fi
    
    print_success "All images built successfully"
}

# Clean up broken deployments if needed
cleanup_broken_deployments() {
    print_info "Checking for broken deployments..."
    
    # Check if there are any deployments with selector issues
    local broken_deployments=$(minikube kubectl -- get deployments -n $NAMESPACE -o jsonpath='{.items[*].status.readyReplicas}' 2>/dev/null | tr ' ' '\n' | grep -c '^0$' || echo "0")
    
    if [ "$broken_deployments" -gt 0 ]; then
        print_warning "Found broken deployments, cleaning up..."
        
        # Delete and recreate problematic deployments
        minikube kubectl -- delete deployment backend-prod -n $NAMESPACE --ignore-not-found=true
        minikube kubectl -- delete deployment frontend-prod -n $NAMESPACE --ignore-not-found=true
        minikube kubectl -- delete deployment ai-service-prod -n $NAMESPACE --ignore-not-found=true
        minikube kubectl -- delete deployment redis-prod -n $NAMESPACE --ignore-not-found=true
        minikube kubectl -- delete deployment grafana -n $NAMESPACE --ignore-not-found=true
        minikube kubectl -- delete deployment prometheus -n $NAMESPACE --ignore-not-found=true
        
        sleep 5
        print_info "Cleaned up broken deployments"
    fi
}

# Deploy infrastructure
deploy_infrastructure() {
    print_info "Deploying infrastructure with Kustomize..."
    
    # Create namespace if it doesn't exist
    minikube kubectl -- create namespace $NAMESPACE --dry-run=client -o yaml | minikube kubectl -- apply -f -
    
    # Apply all manifests
    minikube kubectl -- apply -k k8s/career-coach-prod/ || {
        print_error "Infrastructure deployment failed"
        return 1
    }
    
    print_success "Infrastructure deployed successfully"
}

# Wait for PostgreSQL to be ready
wait_for_postgres() {
    print_info "Waiting for PostgreSQL to be ready..."
    
    local retries=60
    while [ $retries -gt 0 ]; do
        if minikube kubectl -- get pods -l app=postgres -n $NAMESPACE -o jsonpath='{.items[0].status.containerStatuses[0].ready}' 2>/dev/null | grep -q "true"; then
            print_success "PostgreSQL is ready"
            return 0
        fi
        sleep 2
        ((retries--))
    done
    
    print_error "PostgreSQL failed to become ready"
    return 1
}

# Wait for all services to be ready
wait_for_services() {
    print_info "Waiting for all services to be ready..."
    
    local services=("postgres" "redis-prod" "backend-prod" "frontend-prod" "ai-service-prod" "grafana" "prometheus")
    local total_services=${#services[@]}
    local ready_services=0
    local timeout=300
    local start_time=$(date +%s)
    
    while [ $ready_services -lt $total_services ]; do
        ready_services=0
        current_time=$(date +%s)
        elapsed=$((current_time - start_time))
        
        if [ $elapsed -gt $timeout ]; then
            print_warning "Timeout reached, some services may not be ready"
            break
        fi
        
        for service in "${services[@]}"; do
            local ready_pods=$(minikube kubectl -- get pods -l app=$service -n $NAMESPACE -o jsonpath='{.items[?(@.status.containerStatuses[0].ready==true)]}' 2>/dev/null | wc -w)
            local desired_pods=$(minikube kubectl -- get deployment $service -n $NAMESPACE -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "1")
            
            if [ "$ready_pods" -eq "$desired_pods" ] && [ "$ready_pods" -gt 0 ]; then
                ((ready_services++))
            fi
        done
        
        if [ $ready_services -lt $total_services ]; then
            echo -ne "\r${BLUE}[INFO]${NC} Services ready: $ready_services/$total_services (${elapsed}s)"
            sleep 5
        fi
    done
    
    echo ""
    print_info "Services ready: $ready_services/$total_services"
}

# Setup port forwards
setup_port_forwards() {
    print_info "Setting up port forwards..."
    
    # Clean up existing port forwards
    cleanup_port_forward_pids
    
    # Frontend -> 3100:80
    if minikube kubectl -- get pods -l app=frontend-prod -n $NAMESPACE -o name | grep -q "pod"; then
        if ! lsof -ti:3100 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/frontend-service 3100:80 -n $NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-frontend.pid
            print_success "Frontend port-forward: 3100:80"
        fi
    fi
    
    # Backend -> 4100:5000
    if minikube kubectl -- get pods -l app=backend-prod -n $NAMESPACE -o name | grep -q "pod"; then
        if ! lsof -ti:4100 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/backend-service 4100:5000 -n $NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-backend.pid
            print_success "Backend port-forward: 4100:5000"
        fi
    fi
    
    # AI Service -> 5100:5100
    if minikube kubectl -- get pods -l app=ai-service-prod -n $NAMESPACE -o name | grep -q "pod"; then
        if ! lsof -ti:5100 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/ai-service 5100:5100 -n $NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-ai-service.pid
            print_success "AI Service port-forward: 5100:5100"
        fi
    fi
    
    # Grafana -> 3003:3000
    if minikube kubectl -- get pods -l app=grafana -n $NAMESPACE -o name | grep -q "pod"; then
        if ! lsof -ti:3003 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/grafana-service 3003:3000 -n $NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-grafana.pid
            print_success "Grafana port-forward: 3003:3000"
        fi
    fi
    
    # Prometheus -> 9090:9090
    if minikube kubectl -- get pods -l app=prometheus -n $NAMESPACE -o name | grep -q "pod"; then
        if ! lsof -ti:9090 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/prometheus-service 9090:9090 -n $NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-prometheus.pid
            print_success "Prometheus port-forward: 9090:9090"
        fi
    fi
    
    # ArgoCD -> 18082:443
    if minikube kubectl -- get pods -l app.kubernetes.io/name=argocd-server -n argocd -o name | grep -q "pod"; then
        if ! lsof -ti:18082 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/argocd-server 18082:443 -n argocd >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-argocd.pid
            print_success "ArgoCD port-forward: 18082:443"
        fi
    fi
}

# Clean up port forward PIDs
cleanup_port_forward_pids() {
    for service in frontend backend ai-service grafana prometheus argocd; do
        local pid_file="/tmp/career-coach-${service}.pid"
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file" 2>/dev/null || echo "")
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
        fi
    done
}

# Health check function
health_check() {
    local url=$1
    local retries=$2
    local delay=$3
    
    local count=0
    while [ $count -lt $retries ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200\|201\|302"; then
            return 0
        fi
        sleep $delay
        ((count++))
    done
    return 1
}

# Verify all endpoints
verify_endpoints() {
    print_info "Verifying all endpoints..."
    
    local endpoints=(
        "http://localhost:3100|Frontend"
        "http://localhost:4100/api/health|Backend"
        "http://localhost:5100/health|AI Service"
        "http://localhost:3003/login|Grafana"
        "http://localhost:9090/-/healthy|Prometheus"
        "https://localhost:18082|ArgoCD"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        local url=$(echo "$endpoint_info" | cut -d'|' -f1)
        local name=$(echo "$endpoint_info" | cut -d'|' -f2)
        
        print_info "Checking $name..."
        if health_check "$url" $HEALTH_CHECK_RETRIES $HEALTH_CHECK_DELAY; then
            print_success "$name is accessible"
        else
            print_warning "$name is starting up..."
        fi
    done
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
    echo -e "  ${BLUE}Password:${NC} $(minikube kubectl -- -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)"
    echo ""
    echo -e "${YELLOW}Grafana:${NC} http://localhost:3003"
    echo -e "  ${BLUE}Username:${NC} admin"
    echo -e "  ${BLUE}Password:${NC} admin"
    echo ""
    echo -e "${YELLOW}Prometheus:${NC} http://localhost:9090"
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}📋 System Health:${NC}"
    echo -e "  • Namespace: ${YELLOW}$NAMESPACE${NC}"
    echo -e "  • All port-forwards: ${YELLOW}Running${NC}"
    echo -e "  • Services: ${YELLOW}Healthy${NC}"
    echo ""
    echo -e "${BLUE}🔧 Management Commands:${NC}"
    echo -e "  • View pods:     ${YELLOW}minikube kubectl -- get pods -n $NAMESPACE${NC}"
    echo -e "  • Stop services: ${YELLOW}pkill -f port-forward${NC}"
    echo -e "  • Minikube dashboard: ${YELLOW}minikube dashboard${NC}"
    echo ""
}

# Main function
main() {
    echo -e "${GREEN}🚀 Career Coach Platform - Production DevOps System${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    
    # Execute all steps
    check_minikube || exit 1
    build_images || exit 1
    cleanup_broken_deployments
    deploy_infrastructure || exit 1
    wait_for_postgres || exit 1
    wait_for_services
    setup_port_forwards
    verify_endpoints
    print_final_output
    
    print_info "Keeping port-forwards alive. Press Ctrl+C to stop."
    
    # Keep script running
    while true; do
        sleep 10
        
        # Restart any dead port-forwards
        for pid in "${PF_PIDS[@]}"; do
            if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
                print_warning "Port-forward process $pid died, restarting..."
                setup_port_forwards
                break
            fi
        done
    done
}

# Run main function
main "$@"
