#!/bin/bash

# Run Script - Daily Run Script for Career Coach Platform
# This script starts the application and provides access URLs

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_url() {
    echo -e "${BLUE}[URL]${NC} $1"
}

# Check if Minikube is running
check_minikube() {
    if ! minikube status | grep -q "Running"; then
        print_error "Minikube is not running. Please run 'bash devops.sh' first."
        exit 1
    fi
}

# Start Minikube if not running
start_minikube() {
    print_status "Checking Minikube status..."
    
    if ! minikube status | grep -q "Running"; then
        print_status "Starting Minikube..."
        minikube start --cpus=2 --memory=4096 --disk-size=20g
        minikube addons enable ingress
        minikube addons enable metrics-server
    fi
    
    # Set Docker environment to Minikube
    eval $(minikube docker-env)
}

# Apply Kubernetes configurations
apply_configs() {
    print_status "Applying Kubernetes configurations..."
    
    # Create namespace if not exists
    kubectl create namespace career-coach-prod --dry-run=client -o yaml | kubectl apply -f -
    
    # Create secrets if not exists
    kubectl create secret generic app-secrets-prod \
        --from-literal=POSTGRES_USER=postgres \
        --from-literal=POSTGRES_PASSWORD=postgres \
        --from-literal=REDIS_PASSWORD=redis \
        --from-literal=JWT_SECRET=mysecret \
        --from-literal=POSTGRES_DB=career_coach \
        --namespace=career-coach-prod \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Create configmap if not exists
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: career-coach-prod
data:
  DATABASE_HOST: "postgres-service"
  DATABASE_PORT: "5432"
  DATABASE_NAME: "career_coach"
  REDIS_HOST: "redis-service"
  REDIS_PORT: "6379"
  FRONTEND_URL: "http://localhost:3100"
  BACKEND_URL: "http://localhost:4100"
  AI_SERVICE_URL: "http://localhost:5100"
  CORS_ORIGIN: "http://localhost:3100"
  LOG_LEVEL: "info"
  ENVIRONMENT: "production"
  JWT_EXPIRES_IN: "7d"
  MAX_FILE_SIZE: "10MB"
  RATE_LIMIT_WINDOW_MS: "900000"
  RATE_LIMIT_MAX_REQUESTS: "100"
EOF
    
    # Apply application manifests
    if [ -f "k8s/kustomization.yaml" ]; then
        print_status "Applying application manifests..."
        kubectl apply -k k8s/
    else
        print_error "k8s/kustomization.yaml not found. Please run 'bash devops.sh' first."
        exit 1
    fi
}

# Wait for pods to be ready
wait_for_pods() {
    print_status "Waiting for pods to be ready..."
    
    # Wait for all pods to be running
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

# Get service URLs
get_service_urls() {
    print_status "Getting service URLs..."
    
    # Get Minikube IP
    local minikube_ip=$(minikube ip)
    
    # Get NodePort for services
    local frontend_port=$(kubectl get svc frontend-service -n career-coach-prod -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "31000")
    local backend_port=$(kubectl get svc backend-service -n career-coach-prod -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "31001")
    local ai_service_port=$(kubectl get svc ai-service -n career-coach-prod -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "31002")
    local grafana_port=$(kubectl get svc grafana-service -n career-coach-prod -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "3200")
    local argocd_port="18082"
    
    # Print URLs
    echo ""
    echo -e "${GREEN}🎉 Career Coach Platform is ready!${NC}"
    echo ""
    print_url "🌐 Frontend:        http://$minikube_ip:$frontend_port"
    print_url "🔧 Backend API:     http://$minikube_ip:$backend_port"
    print_url "🤖 AI Service:      http://$minikube_ip:$ai_service_port"
    print_url "📊 Grafana:         http://$minikube_ip:$grafana_port"
    print_url "🚀 ArgoCD:          http://$minikube_ip:$argocd_port"
    echo ""
    
    # Show pod status
    print_status "Pod Status:"
    kubectl get pods -n career-coach-prod
    echo ""
    
    # Show service status
    print_status "Service Status:"
    kubectl get svc -n career-coach-prod
    echo ""
    
    # Show commands for debugging
    echo -e "${GREEN}🔧 Useful Commands:${NC}"
    echo "  View logs:         kubectl logs -n career-coach-prod <pod-name>"
    echo "  Access pod shell:  kubectl exec -it -n career-coach-prod <pod-name> -- sh"
    echo "  Check ingress:     kubectl get ingress -n career-coach-prod"
    echo "  Stop Minikube:     minikube stop"
    echo ""
}

# Main execution
main() {
    print_status "Starting Career Coach Platform..."
    
    check_minikube
    start_minikube
    apply_configs
    wait_for_pods
    get_service_urls
    
    print_status "Application started successfully!"
}

# Run main function
main "$@"
