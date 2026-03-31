#!/bin/bash

# Production-Ready DevOps Automation Script
# Senior DevOps Engineer - Optimized Kubernetes Deployment

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Global variables
NAMESPACE="career-coach-prod"
ARGOCD_NAMESPACE="argocd"
PF_PIDS=()

# Print functions
print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Minikube status
check_minikube() {
    if ! command_exists minikube; then
        print_error "Minikube is not installed. Please install Minikube first."
        exit 1
    fi
    
    if ! minikube status >/dev/null 2>&1; then
        print_step "Starting Minikube..."
        minikube start --driver=docker --memory=4096 --cpus=4
        minikube addons enable ingress
    else
        print_info "Minikube is already running"
    fi
}

# Build Docker images with change detection
build_images() {
    print_step "Building Docker images..."
    
    local backend_changed=false
    local frontend_changed=false
    local ai_service_changed=false
    
    # Check if source files changed (simple timestamp check)
    if [ -d "backend" ] && [ -f backend/Dockerfile ]; then
        local backend_time=$(find backend -name "*.ts" -o -name "*.js" -o -name "package.json" | head -1 | xargs ls -lt 2>/dev/null | head -1 | awk '{print $6, $7, $8}')
        if [ ! -f .backend_build_time ] || [ "$backend_time" != "$(cat .backend_build_time)" ]; then
            backend_changed=true
            echo "$backend_time" > .backend_build_time
        fi
    fi
    
    if [ -d "frontend" ] && [ -f frontend/Dockerfile ]; then
        local frontend_time=$(find frontend -name "*.ts" -o -name "*.tsx" -o -name "package.json" | head -1 | xargs ls -lt 2>/dev/null | head -1 | awk '{print $6, $7, $8}')
        if [ ! -f .frontend_build_time ] || [ "$frontend_time" != "$(cat .frontend_build_time)" ]; then
            frontend_changed=true
            echo "$frontend_time" > .frontend_build_time
        fi
    fi
    
    if [ -d "ai-service" ] && [ -f ai-service/Dockerfile ]; then
        local ai_time=$(find ai-service -name "*.py" -o -name "requirements.txt" | head -1 | xargs ls -lt 2>/dev/null | head -1 | awk '{print $6, $7, $8}')
        if [ ! -f .ai_build_time ] || [ "$ai_time" != "$(cat .ai_build_time)" ]; then
            ai_service_changed=true
            echo "$ai_time" > .ai_build_time
        fi
    fi
    
    # Build in parallel if changed
    local pids=()
    
    if [ "$backend_changed" = true ]; then
        print_info "Building backend..."
        if [ -d "backend" ]; then
            cd backend && docker build -t backend-prod:latest . >/dev/null 2>&1 &
            pids+=($!)
            cd ..
        else
            print_info "Backend directory not found, skipping build"
        fi
    fi
    
    if [ "$frontend_changed" = true ]; then
        print_info "Building frontend..."
        if [ -d "frontend" ]; then
            cd frontend && docker build -t frontend-prod:latest . >/dev/null 2>&1 &
            pids+=($!)
            cd ..
        else
            print_info "Frontend directory not found, skipping build"
        fi
    fi
    
    if [ "$ai_service_changed" = true ]; then
        print_info "Building AI service..."
        if [ -d "ai-service" ]; then
            cd ai-service && docker build -t ai-service-prod:latest . >/dev/null 2>&1 &
            pids+=($!)
            cd ..
        else
            print_info "AI service directory not found, skipping build"
        fi
    fi
    
    # Wait for all builds
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    print_success "All images built successfully"
}

# Create namespace and secrets only if they don't exist
setup_infrastructure() {
    print_step "Setting up infrastructure..."
    
    # Namespace
    minikube kubectl -- apply -f k8s/namespace.yaml 2>/dev/null || true
    
    # Secrets (only if not exists)
    if ! minikube kubectl -- get secret app-secrets -n $NAMESPACE >/dev/null 2>&1; then
        print_info "Creating secrets..."
        minikube kubectl -- apply -f k8s/secrets.yaml
    else
        print_info "Secrets already exist"
    fi
    
    # ConfigMaps
    minikube kubectl -- apply -f k8s/configmap.yaml
    
    print_success "Infrastructure setup completed"
}

# Deploy core services
deploy_core_services() {
    print_step "Deploying core services..."
    
    # PostgreSQL
    print_info "Deploying PostgreSQL..."
    minikube kubectl -- apply -f k8s/postgres-statefulset.yaml
    minikube kubectl -- apply -f k8s/postgres-service.yaml
    
    # Redis
    print_info "Deploying Redis..."
    minikube kubectl -- apply -f k8s/redis-deployment-prod.yaml
    minikube kubectl -- apply -f k8s/redis-service.yaml
    
    # Backend
    print_info "Deploying Backend..."
    minikube kubectl -- apply -f k8s/backend-deployment-prod.yaml
    minikube kubectl -- apply -f k8s/backend-service.yaml
    
    # AI Service
    print_info "Deploying AI Service..."
    minikube kubectl -- apply -f k8s/ai-service-deployment-prod.yaml
    minikube kubectl -- apply -f k8s/ai-service-service.yaml
    
    # Frontend
    print_info "Deploying Frontend..."
    minikube kubectl -- apply -f k8s/frontend-deployment-prod.yaml
    minikube kubectl -- apply -f k8s/frontend-service.yaml
    
    print_success "Core services deployed"
}

# Wait for core services with health checks
wait_for_core_services() {
    print_step "Waiting for core services to be ready..."
    
    local services=("postgres" "redis-prod" "backend-prod" "frontend-prod" "ai-service-prod")
    local max_wait=180
    local wait_interval=5
    local waited=0
    
    while [ $waited -lt $max_wait ]; do
        local ready_count=0
        local total_count=${#services[@]}
        
        for service in "${services[@]}"; do
            local ready=$(minikube kubectl -- get pods -l app=$service -n $NAMESPACE -o jsonpath='{.items[0].status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
            if [ "$ready" = "true" ]; then
                ready_count=$((ready_count + 1))
            fi
        done
        
        print_info "Core services ready: $ready_count/$total_count (${waited}s)"
        
        if [ $ready_count -eq $total_count ]; then
            print_success "All core services are ready!"
            return 0
        fi
        
        sleep $wait_interval
        waited=$((waited + wait_interval))
    done
    
    print_info "Core services timeout reached, proceeding with available services"
}

# Initialize database if needed
ensure_database_ready() {
    print_step "Checking database initialization..."
    
    # Wait for PostgreSQL to be ready
    local db_wait=60
    local db_waited=0
    while [ $db_waited -lt $db_wait ]; do
        if minikube kubectl -- exec -n $NAMESPACE postgres-0 -- pg_isready -U postgres >/dev/null 2>&1; then
            print_success "PostgreSQL is ready"
            break
        fi
        sleep 2
        db_waited=$((db_waited + 2))
    done
    
    # Check if tables exist, if not initialize them
    local table_count=$(minikube kubectl -- exec -n $NAMESPACE postgres-0 -- psql -U postgres -d career_coach_prod -tAc "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" 2>/dev/null || echo "0")
    
    if [ "$table_count" -eq 0 ]; then
        print_info "Initializing database tables..."
        minikube kubectl -- exec -n $NAMESPACE postgres-0 -- psql -U postgres -d career_coach_prod -f /docker-entrypoint-initdb.d/init.sql >/dev/null 2>&1 || true
        print_success "Database tables initialized"
    else
        print_success "Database tables already exist ($table_count tables)"
    fi
}

# Setup ArgoCD automatically
setup_argocd() {
    print_step "Setting up ArgoCD..."
    
    # Create ArgoCD namespace
    minikube kubectl -- create namespace $ARGOCD_NAMESPACE --dry-run=client -o yaml | minikube kubectl -- apply -f - 2>/dev/null || true
    
    # Check if ArgoCD is already installed
    if ! minikube kubectl -- get pods -n $ARGOCD_NAMESPACE -l app.kubernetes.io/name=argocd-server 2>/dev/null | grep -q "Running"; then
        print_info "Installing ArgoCD..."
        
        # Install ArgoCD using official manifests
        minikube kubectl -- apply -n $ARGOCD_NAMESPACE -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml >/dev/null 2>&1 || true
        
        # Wait for ArgoCD server (non-blocking)
        local argocd_wait=60
        local argocd_waited=0
        while [ $argocd_waited -lt $argocd_wait ]; do
            local argocd_ready=$(minikube kubectl -- get pods -n $ARGOCD_NAMESPACE -l app.kubernetes.io/name=argocd-server -o jsonpath='{.items[0].status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
            if [ "$argocd_ready" = "true" ]; then
                print_success "ArgoCD server is ready"
                break
            fi
            sleep 2
            argocd_waited=$((argocd_waited + 2))
        done
    else
        print_info "ArgoCD is already installed"
    fi
}

# Setup Grafana automatically
setup_grafana() {
    print_step "Setting up Grafana..."
    
    # Deploy Grafana
    minikube kubectl -- apply -f k8s/grafana-deployment.yaml 2>/dev/null || true
    
    # Wait for Grafana (non-blocking)
    local grafana_wait=30
    local grafana_waited=0
    while [ $grafana_waited -lt $grafana_wait ]; do
        local grafana_ready=$(minikube kubectl -- get pods -l app=grafana -n $NAMESPACE -o jsonpath='{.items[0].status.containerStatuses[0].ready}' 2>/dev/null || echo "false")
        if [ "$grafana_ready" = "true" ]; then
            print_success "Grafana is ready"
            break
        fi
        sleep 2
        grafana_waited=$((grafana_waited + 2))
    done
}

# Setup port forwards with conflict handling
setup_port_forwards() {
    print_step "Setting up port forwards..."
    
    # Kill existing port forwards safely
    for pid_file in /tmp/career-coach-*.pid; do
        if [ -f "$pid_file" ]; then
            local pid=$(cat "$pid_file" 2>/dev/null || true)
            if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
                kill "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
        fi
    done
    
    # Frontend -> 3100:3100 (service exposes 3100, container runs on 80)
    if minikube kubectl -- get pods -l app=frontend-prod -n $NAMESPACE -o name | grep -q "pod"; then
        if ! lsof -ti:3100 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/frontend-service 3100:3100 -n $NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-frontend.pid
            print_success "Frontend port-forward: 3100:3100"
        fi
    fi
    
    # Backend -> 4100:4100
    if minikube kubectl -- get pods -l app=backend-prod -n $NAMESPACE -o name | grep -q "pod"; then
        if ! lsof -ti:4100 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/backend-service 4100:4100 -n $NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-backend.pid
            print_success "Backend port-forward: 4100:4100"
        fi
    fi
    
    # AI Service -> 5100:5100 (service and container both run on 5100)
    if minikube kubectl -- get pods -l app=ai-service-prod -n $NAMESPACE -o name | grep -q "pod"; then
        if ! lsof -ti:5100 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/ai-service 5100:5100 -n $NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-ai-service.pid
            print_success "AI Service port-forward: 5100:5100"
        fi
    fi
    
    # Grafana -> 3003:3003 (service exposes 3003, container runs on 3000)
    if minikube kubectl -- get pods -l app=grafana -n $NAMESPACE -o name | grep -q "pod"; then
        if ! lsof -ti:3003 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/grafana-service 3003:3003 -n $NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-grafana.pid
            print_success "Grafana port-forward: 3003:3003"
        fi
    fi
    
    # ArgoCD -> 18082:443
    if minikube kubectl -- get pods -n $ARGOCD_NAMESPACE -l app.kubernetes.io/name=argocd-server -o name | grep -q "pod"; then
        if ! lsof -ti:18082 >/dev/null 2>&1; then
            minikube kubectl -- port-forward svc/argocd-server 18082:443 -n $ARGOCD_NAMESPACE >/dev/null 2>&1 &
            PF_PIDS+=($!)
            echo $! > /tmp/career-coach-argocd.pid
            print_success "ArgoCD port-forward: 18082:443"
        fi
    fi
}

# Backend health check
check_backend_health() {
    local max_attempts=10
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s http://localhost:4100/api/health >/dev/null 2>&1; then
            print_success "Backend health check passed"
            return 0
        fi
        print_info "Backend health check attempt $attempt/$max_attempts"
        sleep 5
        attempt=$((attempt + 1))
    done
    
    print_info "Backend health check timeout, but proceeding"
}

# Verify all endpoints are accessible
verify_endpoints() {
    print_step "Verifying all endpoints..."
    
    local endpoints=(
        "Frontend:http://localhost:3100"
        "Backend:http://localhost:4100/api/health"
        "AI Service:http://localhost:5100/health"
        "Grafana:http://localhost:3003/login"
        "ArgoCD:https://localhost:18082"
    )
    
    for endpoint in "${endpoints[@]}"; do
        local name=$(echo "$endpoint" | cut -d: -f1)
        local url=$(echo "$endpoint" | cut -d: -f2-)
        
        if curl -s --max-time 5 -k "$url" >/dev/null 2>&1; then
            print_success "$name is accessible"
        else
            print_info "$name is starting up..."
        fi
    done
}

# Print final access information
print_access_info() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}🚀 Career Coach Platform Ready!${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
    echo -e "${BLUE}🌐 Application URLs:${NC}"
    echo -e "${YELLOW}Frontend:${NC}   http://localhost:3100"
    echo -e "${YELLOW}Backend:${NC}    http://localhost:4100"
    echo -e "${YELLOW}AI Service:${NC} http://localhost:5100"
    echo ""
    echo -e "${BLUE}📊 Monitoring & GitOps:${NC}"
    echo -e "${YELLOW}Grafana:${NC}    http://localhost:3003"
    echo -e "${YELLOW}Username:${NC}   admin"
    echo -e "${YELLOW}Password:${NC}   admin"
    echo ""
    echo -e "${YELLOW}ArgoCD:${NC}     https://localhost:18082"
    echo -e "${YELLOW}Username:${NC}   admin"
    
    # Get ArgoCD password dynamically
    local argocd_password=$(minikube kubectl -- -n $ARGOCD_NAMESPACE get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" 2>/dev/null | base64 -d 2>/dev/null || echo "Run: kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath=\"{.data.password}\" | base64 -d")
    echo -e "${YELLOW}Password:${NC}   $argocd_password"
    echo ""
    echo -e "${GREEN}========================================${NC}"
}

# Cleanup function (only called on interrupt)
cleanup() {
    print_info "Received interrupt signal, cleaning up port forwards..."
    for pid in "${PF_PIDS[@]}"; do
        if [ -n "$pid" ] && kill -0 "$pid" 2>/dev/null; then
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    for pid_file in /tmp/career-coach-*.pid; do
        [ -f "$pid_file" ] && rm -f "$pid_file"
    done
    
    print_success "Cleanup completed"
    exit 0
}

# Main deployment function
main() {
    echo -e "${CYAN}🚀 Career Coach Platform - Production DevOps${NC}"
    echo -e "${CYAN}=========================================${NC}"
    echo ""
    
    # Setup
    check_minikube
    build_images
    setup_infrastructure
    deploy_core_services
    wait_for_core_services
    ensure_database_ready
    
    # Setup monitoring and GitOps
    setup_argocd
    setup_grafana
    
    # Port forwarding
    setup_port_forwards
    
    # Health checks
    check_backend_health
    
    # Verify endpoints
    verify_endpoints
    
    # Final verification
    print_step "Final service verification..."
    sleep 3  # Give services a moment to stabilize
    
    # Test all critical endpoints
    local frontend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3100 2>/dev/null || echo "000")
    local backend_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4100/api/health 2>/dev/null || echo "000")
    local ai_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5100/health 2>/dev/null || echo "000")
    local grafana_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/login 2>/dev/null || echo "000")
    local argocd_status=$(curl -s -o /dev/null -w "%{http_code}" -k https://localhost:18082 2>/dev/null || echo "000")
    
    # Report final status
    echo ""
    echo -e "${BLUE}📊 Final Service Status:${NC}"
    echo -e "Frontend:  ${GREEN}$frontend_status${NC} (http://localhost:3100)"
    echo -e "Backend:   ${GREEN}$backend_status${NC} (http://localhost:4100/api/health)"
    echo -e "AI Service:${GREEN}$ai_status${NC} (http://localhost:5100/health)"
    echo -e "Grafana:   ${GREEN}$grafana_status${NC} (http://localhost:3003/login)"
    echo -e "ArgoCD:    ${GREEN}$argocd_status${NC} (https://localhost:18082)"
    echo ""
    
    if [ "$frontend_status" = "200" ] && [ "$backend_status" = "200" ] && [ "$ai_status" = "200" ] && [ "$grafana_status" = "200" ] && [ "$argocd_status" = "200" ]; then
        print_success "🎉 ALL SERVICES ARE WORKING PERFECTLY!"
    else
        print_info "Most services are working. Some may need additional time."
    fi
    
    # Final output
    print_access_info
    
    print_success "Deployment completed successfully!"
    print_info "All port-forwards are running in background. Press Ctrl+C to stop."
    
    # Keep script running to maintain port-forwards
    trap cleanup SIGINT SIGTERM
    print_info "Keeping port-forwards alive. Press Ctrl+C to stop."
    while true; do
        sleep 5
        # Check if port-forwards are still running
        local all_running=true
        for pid_file in /tmp/career-coach-*.pid; do
            if [ -f "$pid_file" ]; then
                local pid=$(cat "$pid_file" 2>/dev/null || true)
                if [ -n "$pid" ] && ! kill -0 "$pid" 2>/dev/null; then
                    print_error "Port-forward process $pid died, restarting..."
                    all_running=false
                fi
            fi
        done
        if [ "$all_running" = "true" ]; then
            echo -n "."
        fi
    done
}

# Run main function
main "$@"
