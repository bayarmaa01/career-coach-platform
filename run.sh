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

# Apply configs
echo -e "${BLUE}Applying Kubernetes configurations...${NC}"
$KUBECTL apply -f k8s/namespace-prod.yaml
$KUBECTL apply -f k8s/secrets-prod.yaml
$KUBECTL apply -f k8s/configmap.yaml
$KUBECTL apply -f k8s/postgres-statefulset.yaml
$KUBECTL apply -f k8s/redis-deployment-prod.yaml
$KUBECTL apply -f k8s/backend-deployment-prod.yaml
$KUBECTL apply -f k8s/ai-service-deployment-prod.yaml
$KUBECTL apply -f k8s/frontend-deployment-prod.yaml

# Wait for pods
echo -e "${BLUE}Waiting for pods to be ready...${NC}"
$KUBECTL wait --for=condition=ready pod -n career-coach-prod --all --timeout=300s

# Kill old port-forwards
for port in 3100 4100 5100; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        kill -9 $pid 2>/dev/null || true
    fi
done

# Start port-forward
echo -e "${BLUE}Starting port-forward...${NC}"
$KUBECTL port-forward -n career-coach-prod service/frontend-service 3100:3100 &
$KUBECTL port-forward -n career-coach-prod service/backend-service 4100:4100 &
$KUBECTL port-forward -n career-coach-prod service/ai-service 5100:5100 &

echo ""
echo -e "${GREEN}✅ Career Coach Platform is running!${NC}"
echo -e "${YELLOW}Frontend:${NC}  http://localhost:3100"
echo -e "${YELLOW}Backend:${NC}   http://localhost:4100"
echo -e "${YELLOW}AI Service:${NC} http://localhost:5100"
echo ""
