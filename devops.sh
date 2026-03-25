#!/bin/bash

# DevOps Setup Script - Full Infrastructure Setup
# This script sets up complete infrastructure for Career Coach Platform

set -e

echo "🚀 Starting DevOps Infrastructure Setup..."

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

# Check if Minikube is installed
check_minikube() {
    if ! command -v minikube &> /dev/null; then
        print_error "Minikube is not installed. Please install Minikube first."
        exit 1
    fi
}

# Start Minikube with required addons
start_minikube() {
    print_status "Starting Minikube..."
    
    if ! minikube status | grep -q "Running"; then
        minikube start --cpus=2 --memory=4096 --disk-size=20g
    fi
    
    # Enable required addons
    print_status "Enabling Minikube addons..."
    minikube addons enable ingress
    minikube addons enable metrics-server
    minikube addons enable default-storageclass
    
    print_status "Minikube started successfully!"
}

# Create namespace
create_namespace() {
    print_status "Creating namespace..."
    kubectl create namespace career-coach-prod --dry-run=client -o yaml | kubectl apply -f -
}

# Create all required secrets
create_secrets() {
    print_status "Creating secrets..."
    
    # Database secrets
    kubectl create secret generic app-secrets-prod \
        --from-literal=POSTGRES_USER=postgres \
        --from-literal=POSTGRES_PASSWORD=postgres \
        --from-literal=REDIS_PASSWORD=redis \
        --from-literal=JWT_SECRET=mysecret \
        --from-literal=POSTGRES_DB=career_coach \
        --namespace=career-coach-prod \
        --dry-run=client -o yaml | kubectl apply -f -
    
    # Docker registry secret (if needed)
    kubectl create secret docker-registry registry-secret-prod \
        --docker-server=registry.hub.docker.com \
        --docker-username=bayarmaa \
        --docker-password=dockerhubtoken123 \
        --namespace=career-coach-prod \
        --dry-run=client -o yaml | kubectl apply -f -
}

# Create configmap
create_configmap() {
    print_status "Creating configmap..."
    
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
}

# Build Docker images in Minikube
build_images() {
    print_status "Building Docker images in Minikube..."
    
    # Set Docker environment to Minikube
    eval $(minikube docker-env)
    
    # Build frontend image
    print_status "Building frontend image..."
    if [ -d "frontend" ]; then
        cd frontend
        docker build -t career-coach-frontend:latest .
        cd ..
    else
        # Create simple frontend image
        cat <<EOF > Dockerfile.frontend
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 3100
CMD ["nginx", "-g", "daemon off;"]
EOF
        docker build -f Dockerfile.frontend -t career-coach-frontend:latest .
        rm Dockerfile.frontend
    fi
    
    # Build backend image
    print_status "Building backend image..."
    if [ -d "backend" ]; then
        cd backend
        docker build -t career-coach-backend:latest .
        cd ..
    else
        # Create simple backend image
        cat <<EOF > Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 4100
CMD ["node", "server.js"]
EOF
        docker build -f Dockerfile.backend -t career-coach-backend:latest .
        rm Dockerfile.backend
    fi
    
    # Build AI service image
    print_status "Building AI service image..."
    if [ -d "ai-service" ]; then
        cd ai-service
        docker build -t career-coach-ai-service:latest .
        cd ..
    else
        # Create simple AI service image
        cat <<EOF > Dockerfile.ai
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt ./
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5100
CMD ["python", "app.py"]
EOF
        docker build -f Dockerfile.ai -t career-coach-ai-service:latest .
        rm Dockerfile.ai
    fi
}

# Apply Kubernetes manifests
apply_manifests() {
    print_status "Applying Kubernetes manifests..."
    
    # Create persistent volumes
    cat <<EOF | kubectl apply -f -
apiVersion: v1
kind: PersistentVolume
metadata:
  name: postgres-pv
spec:
  capacity:
    storage: 5Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  hostPath:
    path: /data/postgres
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: postgres-pvc
  namespace: career-coach-prod
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
  storageClassName: standard
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: redis-pv
spec:
  capacity:
    storage: 1Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  hostPath:
    path: /data/redis
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: redis-pvc
  namespace: career-coach-prod
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 1Gi
  storageClassName: standard
---
apiVersion: v1
kind: PersistentVolume
metadata:
  name: uploads-pv
spec:
  capacity:
    storage: 2Gi
  accessModes:
    - ReadWriteOnce
  persistentVolumeReclaimPolicy: Retain
  storageClassName: standard
  hostPath:
    path: /data/uploads
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: uploads-pvc
  namespace: career-coach-prod
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 2Gi
  storageClassName: standard
EOF
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Install Prometheus
    kubectl apply -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml
    
    # Install Grafana
    cat <<EOF | kubectl apply -f -
apiVersion: apps/v1
kind: Deployment
metadata:
  name: grafana
  namespace: career-coach-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: grafana
  template:
    metadata:
      labels:
        app: grafana
    spec:
      containers:
      - name: grafana
        image: grafana/grafana:latest
        ports:
        - containerPort: 3000
        env:
        - name: GF_SERVER_PORT
          value: "3200"
        - name: GF_SERVER_ROOT_URL
          value: "http://localhost:3200"
        resources:
          requests:
            memory: "128Mi"
            cpu: "50m"
          limits:
            memory: "256Mi"
            cpu: "100m"
---
apiVersion: v1
kind: Service
metadata:
  name: grafana-service
  namespace: career-coach-prod
spec:
  selector:
    app: grafana
  ports:
  - port: 3200
    targetPort: 3000
  type: NodePort
---
EOF
}

# Setup ArgoCD
setup_argocd() {
    print_status "Setting up ArgoCD..."
    
    # Install ArgoCD
    kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
    kubectl apply -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    
    # Expose ArgoCD API server
    kubectl patch svc argocd-server -n argocd -p '{"spec":{"type":"NodePort","ports":[{"name":"http","port":80,"targetPort":8080,"nodePort":18082}]}}'
}

# Main execution
main() {
    print_status "Starting DevOps setup..."
    
    check_minikube
    start_minikube
    create_namespace
    create_secrets
    create_configmap
    build_images
    apply_manifests
    
    # Apply the main application manifests
    if [ -f "k8s/kustomization.yaml" ]; then
        print_status "Applying application manifests..."
        kubectl apply -k k8s/
    fi
    
    setup_monitoring
    setup_argocd
    
    print_status "DevOps setup completed successfully!"
    print_status "Run 'bash run.sh' to start the application"
}

# Run main function
main "$@"
