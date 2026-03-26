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

# Create namespace if it doesn't exist
echo -e "${BLUE}Creating namespace...${NC}"
$KUBECTL create namespace career-coach-prod --ignore-not-found=true

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
