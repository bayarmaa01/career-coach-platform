#!/bin/bash

# Simple run script for Career Coach Platform
# Quick deployment for daily usage

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

KUBECTL="minikube kubectl --"

echo -e "${GREEN}🚀 Starting Career Coach Platform...${NC}"

# Start Minikube if not running
if ! minikube status | grep -q "Running"; then
    echo -e "${BLUE}Starting Minikube...${NC}"
    minikube start --driver=docker --cpus=4 --memory=4096
fi

# Ensure namespace exists
if ! $KUBECTL get namespace career-coach-prod >/dev/null 2>&1; then
    echo -e "${BLUE}Creating career-coach-prod namespace...${NC}"
    $KUBECTL create namespace career-coach-prod
fi

# Auto-create secrets if they don't exist
if ! $KUBECTL get secret app-secrets-prod -n career-coach-prod >/dev/null 2>&1; then
    echo -e "${BLUE}Creating app-secrets-prod...${NC}"
    $KUBECTL create secret generic app-secrets-prod \
        --from-literal=POSTGRES_USER=postgres \
        --from-literal=POSTGRES_PASSWORD=$(openssl rand -base64 12) \
        --from-literal=REDIS_PASSWORD=$(openssl rand -base64 12) \
        --from-literal=JWT_SECRET=$(openssl rand -base64 32) \
        -n career-coach-prod
else
    echo -e "${BLUE}Secrets already exist, skipping...${NC}"
fi

# Configure Docker to use Minikube daemon and build images
echo -e "${BLUE}Building Docker images inside Minikube...${NC}"
eval $(minikube docker-env)

# Build backend image
echo -e "${BLUE}Building backend image...${NC}"
cd backend
docker build -t backend-prod:latest .
cd ..

# Build frontend image
echo -e "${BLUE}Building frontend image...${NC}"
cd frontend
docker build -t frontend-prod:latest .
cd ..

# Build ai-service image
echo -e "${BLUE}Building AI service image...${NC}"
cd ai-service
docker build -t ai-service-prod:latest .
cd ..

# Apply configs in order
echo -e "${BLUE}Applying Kubernetes configurations...${NC}"
$KUBECTL apply -f k8s/secrets-prod.yaml || true
$KUBECTL apply -f k8s/configmap.yaml || true
$KUBECTL apply -f k8s/persistent-volume.yaml || true
$KUBECTL apply -f k8s/postgres-statefulset.yaml || true
$KUBECTL apply -f k8s/redis-deployment-prod.yaml || true
$KUBECTL apply -f k8s/backend-deployment-prod.yaml || true
$KUBECTL apply -f k8s/ai-service-deployment-prod.yaml || true
$KUBECTL apply -f k8s/frontend-deployment-prod.yaml || true

# Wait for pods
echo -e "${BLUE}Waiting for pods to be ready...${NC}"
$KUBECTL wait --for=condition=ready pod -n career-coach-prod --all --timeout=300s || true

# Kill old port-forwards
echo -e "${BLUE}Cleaning up old port-forwards...${NC}"
for port in 3100 4100 5100; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        kill -9 $pid 2>/dev/null || true
        echo "Killed process on port $port"
    fi
done

# Start port-forward
echo -e "${BLUE}Starting port-forward...${NC}"
$KUBECTL port-forward -n career-coach-prod service/frontend-service 3100:3100 &
FRONTEND_PID=$!
$KUBECTL port-forward -n career-coach-prod service/backend-service 4100:4100 &
BACKEND_PID=$!
$KUBECTL port-forward -n career-coach-prod service/ai-service 5100:5100 &
AI_PID=$!

# Save PIDs for cleanup
echo $FRONTEND_PID > /tmp/career-coach-frontend.pid
echo $BACKEND_PID > /tmp/career-coach-backend.pid
echo $AI_PID > /tmp/career-coach-ai-service.pid

# Wait a moment for port-forwards to establish
sleep 3

echo ""
echo -e "${GREEN}✅ Career Coach Platform is running!${NC}"
echo -e "${YELLOW}Frontend:${NC}  http://localhost:3100"
echo -e "${YELLOW}Backend:${NC}   http://localhost:4100"
echo -e "${YELLOW}AI Service:${NC} http://localhost:5100"
echo ""
echo -e "${BLUE}📋 Useful commands:${NC}"
echo -e "  • View pods:     ${YELLOW}minikube kubectl -- get pods -n career-coach-prod${NC}"
echo -e "  • View logs:     ${YELLOW}minikube kubectl -- logs -n career-coach-prod deployment/backend-prod${NC}"
echo -e "  • Stop services: ${YELLOW}kill \$(cat /tmp/career-coach-*.pid)${NC}"
echo ""
