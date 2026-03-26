#!/bin/bash

# Production-ready DevOps script for Career Coach Platform
# Author: Senior DevOps Engineer
# Description: Complete deployment automation with Minikube, ArgoCD, and monitoring

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

# Kubernetes wrapper
KUBECTL="minikube kubectl --"

# Check prerequisites
check_prerequisites() {
    print_step "Checking prerequisites..."
    
    # Check kubectl
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    print_success "kubectl found: $(kubectl version --client --short 2>/dev/null || kubectl version --client)"
    
    # Check minikube
    if ! command -v minikube &> /dev/null; then
        print_error "minikube is not installed. Please install minikube first."
        exit 1
    fi
    print_success "minikube found: $(minikube version)"
    
    # Check docker
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed. Please install docker first."
        exit 1
    fi
    print_success "docker found: $(docker --version)"
    
    # Check helm
    if ! command -v helm &> /dev/null; then
        print_error "helm is not installed. Please install helm first."
        exit 1
    fi
    print_success "helm found: $(helm version --short)"
}

# Start Minikube
start_minikube() {
    print_step "Starting Minikube..."
    
    if minikube status | grep -q "Running"; then
        print_info "Minikube is already running"
    else
        print_info "Starting Minikube with Docker driver..."
        minikube start --driver=docker --cpus=4 --memory=4096
        
        print_info "Waiting for Minikube to be ready..."
        minikube kubectl -- wait --for=condition=Ready nodes --all --timeout=300s
    fi
    
    print_success "Minikube is running"
    print_info "Minikube status: $(minikube status --format='{{.Host}}:{{.Kubelet}}:{{.APIServer}}')"
}

# Create namespaces
create_namespaces() {
    print_step "Creating namespaces..."
    
    # Create app namespace
    $KUBECTL apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: career-coach-prod
  labels:
    name: career-coach-prod
    environment: production
EOF
    
    # Create monitoring namespace
    $KUBECTL apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: monitoring
  labels:
    name: monitoring
EOF
    
    # Create argocd namespace
    $KUBECTL apply -f - <<EOF
apiVersion: v1
kind: Namespace
metadata:
  name: argocd
  labels:
    name: argocd
EOF
    
    print_success "Namespaces created successfully"
}

# Deploy infrastructure
deploy_infrastructure() {
    print_step "Deploying infrastructure (PostgreSQL & Redis)..."
    
    # Create secrets first
    $KUBECTL apply -f - <<EOF
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets-prod
  namespace: career-coach-prod
type: Opaque
data:
  POSTGRES_USER: cG9zdGdyZXM=
  POSTGRES_PASSWORD: cHJvZHBhc3N3b3JkMTIz
  REDIS_PASSWORD: cmVkaXNwYXNzd29yZDEyMw==
  JWT_SECRET: and0c2VjcmV0Zm9ycHJvZHVjdGlvbjEyMw==
EOF
    
    # Create PostgreSQL StatefulSet
    $KUBECTL apply -f - <<EOF
apiVersion: v1
kind: Service
metadata:
  name: postgres-service
  namespace: career-coach-prod
spec:
  selector:
    app: postgres
  ports:
  - port: 5432
    targetPort: 5432
  type: ClusterIP
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: postgres
  namespace: career-coach-prod
spec:
  serviceName: postgres
  replicas: 1
  selector:
    matchLabels:
      app: postgres
  template:
    metadata:
      labels:
        app: postgres
    spec:
      containers:
      - name: postgres
        image: postgres:15-alpine
        ports:
        - containerPort: 5432
        env:
        - name: POSTGRES_DB
          value: "career_coach"
        - name: POSTGRES_USER
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: POSTGRES_USER
        - name: POSTGRES_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: POSTGRES_PASSWORD
        - name: PGDATA
          value: /var/lib/postgresql/data/pgdata
        volumeMounts:
        - name: postgres-storage
          mountPath: /var/lib/postgresql/data
        resources:
          requests:
            memory: "64Mi"
            cpu: "25m"
          limits:
            memory: "128Mi"
            cpu: "50m"
        livenessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - pg_isready
            - -U
            - postgres
          initialDelaySeconds: 5
          periodSeconds: 5
  volumeClaimTemplates:
  - metadata:
      name: postgres-storage
    spec:
      accessModes: ["ReadWriteOnce"]
      resources:
        requests:
          storage: 5Gi
EOF
    
    # Create Redis deployment and PVC
    $KUBECTL apply -f - <<EOF
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
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: redis-prod
  namespace: career-coach-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: redis-prod
  template:
    metadata:
      labels:
        app: redis-prod
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        ports:
        - containerPort: 6379
        command:
        - redis-server
        - --appendonly
        - "yes"
        - --requirepass
        - \$(REDIS_PASSWORD)
        env:
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: REDIS_PASSWORD
        volumeMounts:
        - name: redis-storage
          mountPath: /data
        resources:
          requests:
            memory: "32Mi"
            cpu: "25m"
          limits:
            memory: "64Mi"
            cpu: "50m"
        livenessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          exec:
            command:
            - redis-cli
            - ping
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: redis-storage
        persistentVolumeClaim:
          claimName: redis-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: redis-service
  namespace: career-coach-prod
spec:
  selector:
    app: redis-prod
  ports:
  - port: 6379
    targetPort: 6379
  type: ClusterIP
EOF
    
    print_success "Infrastructure deployed successfully"
}

# Deploy application
deploy_application() {
    print_step "Deploying application services..."
    
    # Configure Docker to use Minikube daemon and build images
    print_info "Building Docker images inside Minikube..."
    eval $(minikube docker-env)
    
    # Build backend image
    print_info "Building backend image..."
    cd backend
    docker build -t backend-prod:latest .
    cd ..
    
    # Build frontend image
    print_info "Building frontend image..."
    cd frontend
    docker build -t frontend-prod:latest .
    cd ..
    
    # Build ai-service image
    print_info "Building AI service image..."
    cd ai-service
    docker build -t ai-service-prod:latest .
    cd ..
    
    print_success "Docker images built successfully"
    
    # Create PVCs for application
    $KUBECTL apply -f - <<EOF
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
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: models-pvc
  namespace: career-coach-prod
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 5Gi
EOF
    
    # Create ConfigMap
    $KUBECTL apply -f - <<EOF
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: career-coach-prod
data:
  POSTGRES_DB: "career_coach"
  JWT_EXPIRES_IN: "7d"
  FRONTEND_URL: "http://localhost:3100"
  BACKEND_URL: "http://localhost:4100"
  MAX_FILE_SIZE: "10485760"
  RATE_LIMIT_WINDOW_MS: "900000"
  RATE_LIMIT_MAX_REQUESTS: "100"
  LOG_LEVEL: "info"
EOF
    
    # Deploy Backend
    # Note: imagePullPolicy: Never ensures Kubernetes uses local Minikube images
    $KUBECTL apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-prod
  namespace: career-coach-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: backend-prod
  template:
    metadata:
      labels:
        app: backend-prod
    spec:
      containers:
      - name: backend
        image: backend-prod:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 4100
        env:
        - name: NODE_ENV
          value: "production"
        - name: PORT
          value: "4100"
        - name: DATABASE_HOST
          value: "postgres-service"
        - name: DATABASE_PORT
          value: "5432"
        - name: DATABASE_NAME
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: POSTGRES_DB
        - name: DATABASE_USER
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: POSTGRES_USER
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: POSTGRES_PASSWORD
        - name: REDIS_HOST
          value: "redis-service"
        - name: REDIS_PORT
          value: "6379"
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: REDIS_PASSWORD
        - name: AI_SERVICE_URL
          value: "http://ai-service:5100"
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: JWT_SECRET
        - name: JWT_EXPIRES_IN
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: JWT_EXPIRES_IN
        - name: CORS_ORIGIN
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: FRONTEND_URL
        - name: MAX_FILE_SIZE
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: MAX_FILE_SIZE
        - name: RATE_LIMIT_WINDOW_MS
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: RATE_LIMIT_WINDOW_MS
        - name: RATE_LIMIT_MAX_REQUESTS
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: RATE_LIMIT_MAX_REQUESTS
        volumeMounts:
        - name: uploads-volume
          mountPath: /app/uploads
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /api/health
            port: 4100
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 4100
          initialDelaySeconds: 5
          periodSeconds: 5
      volumes:
      - name: uploads-volume
        persistentVolumeClaim:
          claimName: uploads-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
  namespace: career-coach-prod
spec:
  selector:
    app: backend-prod
  ports:
  - port: 4100
    targetPort: 4100
  type: ClusterIP
EOF
    
    # Deploy AI Service
    # Note: imagePullPolicy: Never ensures Kubernetes uses local Minikube images
    $KUBECTL apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: ai-service-prod
  namespace: career-coach-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: ai-service-prod
  template:
    metadata:
      labels:
        app: ai-service-prod
    spec:
      containers:
      - name: ai-service
        image: ai-service-prod:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 5100
        env:
        - name: PYTHONPATH
          value: "/app"
        - name: REDIS_HOST
          value: "redis-service"
        - name: REDIS_PORT
          value: "6379"
        - name: REDIS_PASSWORD
          valueFrom:
            secretKeyRef:
              name: app-secrets-prod
              key: REDIS_PASSWORD
        - name: MODEL_CACHE_DIR
          value: "/app/models"
        - name: LOG_LEVEL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: LOG_LEVEL
        volumeMounts:
        - name: uploads-volume
          mountPath: /app/uploads
        - name: models-volume
          mountPath: /app/models
        resources:
          requests:
            memory: "64Mi"
            cpu: "50m"
          limits:
            memory: "128Mi"
            cpu: "100m"
        livenessProbe:
          httpGet:
            path: /ai/health
            port: 5100
          initialDelaySeconds: 60
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /ai/health
            port: 5100
          initialDelaySeconds: 30
          periodSeconds: 10
      volumes:
      - name: uploads-volume
        persistentVolumeClaim:
          claimName: uploads-pvc
      - name: models-volume
        persistentVolumeClaim:
          claimName: models-pvc
---
apiVersion: v1
kind: Service
metadata:
  name: ai-service
  namespace: career-coach-prod
spec:
  selector:
    app: ai-service-prod
  ports:
  - port: 5100
    targetPort: 5100
  type: ClusterIP
EOF
    
    # Deploy Frontend
    # Note: imagePullPolicy: Never ensures Kubernetes uses local Minikube images
    $KUBECTL apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-prod
  namespace: career-coach-prod
spec:
  replicas: 1
  selector:
    matchLabels:
      app: frontend-prod
  template:
    metadata:
      labels:
        app: frontend-prod
    spec:
      containers:
      - name: frontend
        image: frontend-prod:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 3100
        env:
        - name: VITE_API_URL
          valueFrom:
            configMapKeyRef:
              name: app-config
              key: BACKEND_URL
        resources:
          requests:
            memory: "32Mi"
            cpu: "25m"
          limits:
            memory: "64Mi"
            cpu: "50m"
        livenessProbe:
          httpGet:
            path: /
            port: 3100
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 3100
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: career-coach-prod
spec:
  selector:
    app: frontend-prod
  ports:
  - port: 3100
    targetPort: 3100
  type: ClusterIP
EOF
    
    print_success "Application services deployed successfully"
}

# Install ArgoCD
install_argocd() {
    print_step "Installing ArgoCD..."
    
    # Clean up any existing ArgoCD installation completely
    print_info "Cleaning up existing ArgoCD installation..."
    
    # Delete argocd namespace safely
    print_info "Deleting argocd namespace..."
    $KUBECTL delete namespace argocd --ignore-not-found=true
    
    # Wait until namespace is fully deleted
    print_info "Waiting for argocd namespace to be fully deleted..."
    while $KUBECTL get namespace argocd --ignore-not-found=true | grep -q "argocd"; do
        sleep 2
        print_info "Still waiting for namespace deletion..."
    done
    
    # Clean up all ClusterRoles containing "argocd"
    print_info "Cleaning ArgoCD ClusterRoles..."
    for cr in $($KUBECTL get clusterroles --no-headers -o custom-columns=NAME:.metadata.name | grep argocd || true); do
        print_info "Deleting ClusterRole: $cr"
        $KUBECTL delete clusterrole $cr --ignore-not-found=true || true
    done
    
    # Clean up all ClusterRoleBindings containing "argocd"
    print_info "Cleaning ArgoCD ClusterRoleBindings..."
    for crb in $($KUBECTL get clusterrolebindings --no-headers -o custom-columns=NAME:.metadata.name | grep argocd || true); do
        print_info "Deleting ClusterRoleBinding: $crb"
        $KUBECTL delete clusterrolebinding $crb --ignore-not-found=true || true
    done
    
    # Clean up all CRDs containing "argocd" or "argoproj"
    print_info "Cleaning ArgoCD CRDs..."
    for crd in $($KUBECTL get crd --no-headers -o custom-columns=NAME:.metadata.name | grep -E 'argocd|argoproj' || true); do
        print_info "Deleting CRD: $crd"
        $KUBECTL delete crd $crd --ignore-not-found=true || true
    done
    
    # Wait for all resources to be fully deleted
    print_info "Waiting for resources cleanup to complete..."
    sleep 10
    
    # Uninstall existing Helm release if it exists
    if helm list -n argocd --no-headers | grep -q "argocd" 2>/dev/null || false; then
        print_info "Uninstalling existing ArgoCD Helm release..."
        helm uninstall argocd -n argocd || true
    fi
    
    # Install ArgoCD using Helm
    print_info "Installing ArgoCD using Helm..."
    helm repo add argo https://argoproj.github.io/argo-helm
    helm repo update
    
    helm upgrade --install argocd argo/argo-cd \
        --namespace argocd \
        --create-namespace \
        --set server.service.type=ClusterIP \
        --set dex.enabled=true \
        --set notifications.enabled=true \
        --wait
    
    # Wait for ArgoCD to be ready
    print_info "Waiting for ArgoCD pods to be ready..."
    $KUBECTL wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s || true
    $KUBECTL wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-repo-server -n argocd --timeout=300s || true
    $KUBECTL wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-application-controller -n argocd --timeout=300s || true
    $KUBECTL wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-dex-server -n argocd --timeout=300s || true
    
    print_success "ArgoCD installed successfully"
}

# Install monitoring stack
install_monitoring() {
    print_step "Installing monitoring stack with Prometheus and Grafana..."
    
    # Add prometheus-community repo
    helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
    helm repo update
    
    # Install kube-prometheus-stack
    helm upgrade --install prometheus prometheus-community/kube-prometheus-stack \
        --namespace monitoring \
        --create-namespace \
        --set grafana.adminPassword=admin123 \
        --set prometheus.prometheusSpec.retention=15d \
        --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=10Gi \
        --set grafana.persistence.enabled=true \
        --set grafana.persistence.size=5Gi \
        --wait
    
    print_success "Monitoring stack installed successfully"
}

# Wait for all pods to be ready
wait_for_pods() {
    print_step "Waiting for all pods to be ready..."
    
    # Wait for app namespace pods
    print_info "Waiting for application pods..."
    $KUBECTL wait --for=condition=ready pod -n career-coach-prod --all --timeout=600s
    
    # Wait for argocd pods
    print_info "Waiting for ArgoCD pods..."
    $KUBECTL wait --for=condition=ready pod -n argocd --all --timeout=300s
    
    # Wait for monitoring pods
    print_info "Waiting for monitoring pods..."
    $KUBECTL wait --for=condition=ready pod -n monitoring --all --timeout=300s
    
    print_success "All pods are ready"
}

# Kill old port-forward processes
kill_old_port_forwards() {
    print_step "Cleaning up old port-forward processes..."
    
    # Kill processes on our target ports
    for port in 3100 4100 5100 3200 18082; do
        pid=$(lsof -ti:$port 2>/dev/null || true)
        if [ ! -z "$pid" ]; then
            kill -9 $pid 2>/dev/null || true
            print_info "Killed process on port $port (PID: $pid)"
        fi
    done
    
    # Clean up old PID files
    rm -f /tmp/career-coach-*.pid
    
    print_success "Old port-forward processes cleaned up"
}

# Start port-forward for services
start_port_forwards() {
    print_step "Starting port-forward for services..."
    
    # Function to start port-forward in background
    start_pf() {
        local namespace=$1
        local service=$2
        local local_port=$3
        local remote_port=$4
        local pid_file=$5
        
        $KUBECTL port-forward -n $namespace service/$service $local_port:$remote_port &
        local pid=$!
        echo $pid > $pid_file
        
        # Wait a moment to ensure port-forward is working
        sleep 2
        if kill -0 $pid 2>/dev/null; then
            print_success "Port-forward started: $local_port -> $service:$remote_port (PID: $pid)"
        else
            print_error "Failed to start port-forward for $service"
        fi
    }
    
    # Start port-forwards
    start_pf "career-coach-prod" "frontend-service" "3100" "3100" "/tmp/career-coach-frontend.pid"
    start_pf "career-coach-prod" "backend-service" "4100" "4100" "/tmp/career-coach-backend.pid"
    start_pf "career-coach-prod" "ai-service" "5100" "5100" "/tmp/career-coach-ai-service.pid"
    start_pf "monitoring" "prometheus-grafana" "3200" "80" "/tmp/career-coach-grafana.pid"
    start_pf "argocd" "argocd-server" "18082" "8080" "/tmp/career-coach-argocd.pid"
    
    print_success "All port-forwards started"
}

# Fetch ArgoCD admin password
fetch_argocd_password() {
    print_step "Fetching ArgoCD admin password..."
    
    ARGOCD_PASSWORD=$($KUBECTL -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
    print_success "ArgoCD admin password fetched"
}

# Print final output
print_final_output() {
    print_step "Deployment completed successfully!"
    
    echo ""
    echo -e "${GREEN}=== CAREER COACH PLATFORM DEPLOYMENT SUMMARY ===${NC}"
    echo ""
    echo -e "${BLUE}🌐 Application URLs:${NC}"
    echo -e "  • Frontend:        ${YELLOW}http://localhost:3100${NC}"
    echo -e "  • Backend API:     ${YELLOW}http://localhost:4100${NC}"
    echo -e "  • AI Service:      ${YELLOW}http://localhost:5100${NC}"
    echo ""
    echo -e "${BLUE}📊 Monitoring & Management:${NC}"
    echo -e "  • Grafana:         ${YELLOW}http://localhost:3200${NC}"
    echo -e "  • ArgoCD:          ${YELLOW}http://localhost:18082${NC}"
    echo ""
    echo -e "${BLUE}🔐 Credentials:${NC}"
    echo -e "  • Grafana Admin:   ${YELLOW}admin / admin123${NC}"
    echo -e "  • ArgoCD Admin:    ${YELLOW}admin / $ARGOCD_PASSWORD${NC}"
    echo ""
    echo -e "${BLUE}🗄️  Database Credentials:${NC}"
    echo -e "  • PostgreSQL:      ${YELLOW}postgres / prodpassword123${NC}"
    echo -e "  • Redis:           ${YELLOW}Password: redispassword123${NC}"
    echo ""
    echo -e "${BLUE}📋 Useful kubectl Commands:${NC}"
    echo -e "  • View all pods:   ${YELLOW}minikube kubectl -- get pods --all-namespaces${NC}"
    echo -e "  • App logs:        ${YELLOW}minikube kubectl -- logs -n career-coach-prod deployment/backend-prod${NC}"
    echo -e "  • Port status:     ${YELLOW}minikube service list${NC}"
    echo -e "  • Minikube dashboard: ${YELLOW}minikube dashboard${NC}"
    echo ""
    echo -e "${GREEN}✅ Port-forward PIDs saved to /tmp/career-coach-*.pid${NC}"
    echo -e "${GREEN}🎉 Your Career Coach Platform is now running!${NC}"
    echo ""
}

# Main execution
main() {
    echo -e "${GREEN}🚀 Starting Career Coach Platform Deployment...${NC}"
    echo ""
    
    check_prerequisites
    start_minikube
    create_namespaces
    deploy_infrastructure
    deploy_application
    install_argocd
    install_monitoring
    wait_for_pods
    kill_old_port_forwards
    start_port_forwards
    fetch_argocd_password
    print_final_output
    
    echo -e "${GREEN}🎯 Deployment script completed successfully!${NC}"
}

# Run main function
main "$@"
