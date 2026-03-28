#!/bin/bash

# Verification script for Career Coach Platform deployment
set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

KUBECTL="minikube kubectl --"

echo -e "${BLUE}🔍 Verifying Career Coach Platform Deployment${NC}"
echo ""

# Check Minikube status
echo -e "${YELLOW}1. Checking Minikube status...${NC}"
if $KUBECTL get nodes >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Minikube is running${NC}"
else
    echo -e "${RED}❌ Minikube is not running${NC}"
    exit 1
fi

# Check pods
echo ""
echo -e "${YELLOW}2. Checking pod status...${NC}"
$KUBECTL get pods -A

# Count running pods
RUNNING_PODS=$($KUBECTL get pods -n career-coach-prod --field-selector=status.phase=Running --no-headers | wc -l)
TOTAL_PODS=$($KUBECTL get pods -n career-coach-prod --no-headers | wc -l)

echo -e "${BLUE}Pods in career-coach-prod: $RUNNING_PODS/$TOTAL_PODS running${NC}"

# Check services
echo ""
echo -e "${YELLOW}3. Checking services...${NC}"
$KUBECTL get svc -n career-coach-prod

# Test port accessibility
echo ""
echo -e "${YELLOW}4. Testing service accessibility...${NC}"

test_service() {
    local service_name=$1
    local port=$2
    local url=$3
    
    echo -n "Testing $service_name (port $port)... "
    if curl -s --max-time 5 "$url" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ ACCESSIBLE${NC}"
        return 0
    else
        echo -e "${RED}❌ NOT ACCESSIBLE${NC}"
        return 1
    fi
}

test_service "Frontend" 3100 "http://localhost:3100"
test_service "Backend" 4100 "http://localhost:4100/api/health"
test_service "AI Service" 5100 "http://localhost:5100/health"

# Check resource usage
echo ""
echo -e "${YELLOW}5. Checking resource usage...${NC}"
echo "Memory usage:"
minikube ssh -- free -h
echo ""
echo "CPU usage:"
minikube ssh -- top -bn1 | head -5

# Check ArgoCD
echo ""
echo -e "${YELLOW}6. Checking ArgoCD...${NC}"
if $KUBECTL get namespace argocd >/dev/null 2>&1; then
    echo -e "${GREEN}✅ ArgoCD namespace exists${NC}"
    if curl -s --max-time 5 "https://localhost:18082" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ ArgoCD is accessible${NC}"
    else
        echo -e "${RED}❌ ArgoCD is not accessible${NC}"
    fi
else
    echo -e "${RED}❌ ArgoCD namespace not found${NC}"
fi

# Summary
echo ""
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo "=================================="

FAILED_TESTS=0

# Count failures
if ! curl -s --max-time 5 "http://localhost:3100" >/dev/null 2>&1; then
    ((FAILED_TESTS++))
fi
if ! curl -s --max-time 5 "http://localhost:4100/api/health" >/dev/null 2>&1; then
    ((FAILED_TESTS++))
fi
if ! curl -s --max-time 5 "http://localhost:5100/health" >/dev/null 2>&1; then
    ((FAILED_TESTS++))
fi

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL SERVICES ARE WORKING!${NC}"
    echo ""
    echo -e "${BLUE}Access URLs:${NC}"
    echo -e "  Frontend:   ${YELLOW}http://localhost:3100${NC}"
    echo -e "  Backend:    ${YELLOW}http://localhost:4100${NC}"
    echo -e "  AI Service: ${YELLOW}http://localhost:5100${NC}"
    echo -e "  ArgoCD:     ${YELLOW}https://localhost:18082${NC}"
else
    echo -e "${RED}❌ $FAILED_TESTS service(s) are not working${NC}"
    echo ""
    echo -e "${BLUE}Debug commands:${NC}"
    echo "  minikube kubectl -- get pods -n career-coach-prod"
    echo "  minikube kubectl -- logs -n career-coach-prod <pod-name>"
    echo "  minikube kubectl -- describe pod -n career-coach-prod <pod-name>"
fi

echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "  Stop services: kill \$(cat /tmp/career-coach-*.pid)"
echo "  View logs: minikube kubectl -- logs -f -n career-coach-prod <pod>"
echo "  Dashboard: minikube dashboard"
