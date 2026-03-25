#!/bin/bash

# Fix Kubernetes Deployment Issues
# This script cleans up existing resources and applies corrected ones

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Minikube is running
check_minikube() {
    if ! minikube status | grep -q "Running"; then
        print_error "Minikube is not running. Please run 'bash devops.sh' first."
        exit 1
    fi
}

# Set Docker environment to Minikube
setup_docker() {
    print_status "Setting Docker environment to Minikube..."
    eval $(minikube docker-env)
}

# Clean up existing problematic resources
cleanup_resources() {
    print_status "Cleaning up existing problematic resources..."
    
    # Delete services with wrong NodePorts
    kubectl delete svc frontend-service backend-service ai-service -n career-coach-prod --ignore-not-found=true
    
    # Delete existing PVs that have conflicts
    kubectl delete pv postgres-pv redis-pv uploads-pv --ignore-not-found=true
    
    # Delete existing PVCs that are bound to conflicting PVs
    kubectl delete pvc postgres-pvc redis-pvc uploads-pvc models-pvc -n career-coach-prod --ignore-not-found=true
    
    print_status "Cleanup completed"
}

# Apply corrected resources
apply_fixes() {
    print_status "Applying corrected Kubernetes resources..."
    
    # Apply clean persistent volumes
    kubectl apply -f k8s/persistent-volume-clean.yaml
    
    # Wait for PVs to be available
    sleep 5
    
    # Apply application manifests with corrected NodePorts
    kubectl apply -k k8s/
    
    print_status "Corrected resources applied successfully"
}

# Wait for pods to be ready
wait_for_pods() {
    print_status "Waiting for pods to be ready..."
    
    local max_wait=300
    local wait_time=0
    
    while [ $wait_time -lt $max_wait ]; do
        local running_pods=$(kubectl get pods -n career-coach-prod --field-selector=status.phase=Running --no-headers | wc -l)
        local total_pods=$(kubectl get pods -n career-coach-prod --no-headers | wc -l)
        
        if [ $running_pods -eq $total_pods ] && [ $total_pods -gt 0 ]; then
            print_status "All pods are running!"
            break
        fi
        
        print_status "Waiting for pods... ($running_pods/$total_pods running)"
        sleep 10
        wait_time=$((wait_time + 10))
    done
    
    if [ $wait_time -ge $max_wait ]; then
        print_error "Timeout waiting for pods to be ready"
        kubectl get pods -n career-coach-prod
        exit 1
    fi
}

# Show service URLs
show_urls() {
    print_status "Getting service URLs..."
    
    local minikube_ip=$(minikube ip)
    local frontend_port=$(kubectl get svc frontend-service -n career-coach-prod -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "31000")
    local backend_port=$(kubectl get svc backend-service -n career-coach-prod -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "31001")
    local ai_service_port=$(kubectl get svc ai-service -n career-coach-prod -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "31002")
    
    echo ""
    echo -e "${GREEN}🎉 Career Coach Platform is ready!${NC}"
    echo ""
    echo -e "${BLUE}[URL]${NC} 🌐 Frontend:        http://$minikube_ip:$frontend_port"
    echo -e "${BLUE}[URL]${NC} 🔧 Backend API:     http://$minikube_ip:$backend_port"
    echo -e "${BLUE}[URL]${NC} 🤖 AI Service:      http://$minikube_ip:$ai_service_port"
    echo ""
    
    print_status "Pod Status:"
    kubectl get pods -n career-coach-prod
    echo ""
    
    print_status "Service Status:"
    kubectl get svc -n career-coach-prod
    echo ""
}

# Main execution
main() {
    print_status "Starting Kubernetes deployment fix..."
    
    check_minikube
    setup_docker
    cleanup_resources
    apply_fixes
    wait_for_pods
    show_urls
    
    print_status "Deployment fix completed successfully!"
}

# Run main function
main "$@"
