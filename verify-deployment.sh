#!/bin/bash

# Production verification script for Career Coach Platform
# Validates complete deployment health and accessibility

set -euo pipefail

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
echo -e "${YELLOW}1. Checking Minikube cluster health...${NC}"
if ! $KUBECTL get nodes >/dev/null 2>&1; then
    echo -e "${RED}❌ Minikube cluster is not accessible${NC}"
    echo -e "${BLUE}Run: bash devops.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Minikube cluster is healthy${NC}"

# Check pods
echo ""
echo -e "${YELLOW}2. Checking pod status...${NC}"
$KUBECTL get pods -A

# Count running pods in career-coach-prod namespace
RUNNING_PODS=$($KUBECTL get pods -n career-coach-prod --field-selector=status.phase=Running --no-headers | wc -l)
TOTAL_PODS=$($KUBECTL get pods -n career-coach-prod --no-headers | wc -l)

echo -e "${BLUE}Pods in career-coach-prod: $RUNNING_PODS/$TOTAL_PODS running${NC}"

if [ "$RUNNING_PODS" -ne "$TOTAL_PODS" ]; then
    echo -e "${RED}❌ Not all pods are running${NC}"
    echo -e "${BLUE}Debug commands:${NC}"
    echo "  $KUBECTL get events -n career-coach-prod --sort-by='.lastTimestamp'"
    echo "  $KUBECTL describe pods -n career-coach-prod"
    exit 1
fi

# Check services
echo ""
echo -e "${YELLOW}3. Checking services...${NC}"
$KUBECTL get svc -n career-coach-prod

# Test service accessibility
echo ""
echo -e "${YELLOW}4. Testing service accessibility...${NC}"

test_service() {
    local service_name=$1
    local port=$2
    local url=$3
    local expected_status=${4:-200}
    
    echo -n "Testing $service_name (port $port)... "
    
    # Wait up to 30 seconds for service to be ready
    for i in {1..6}; do
        if curl -s --max-time 5 -o /dev/null -w "%{http_code}" "$url" | grep -q "$expected_status"; then
            echo -e "${GREEN}✅ ACCESSIBLE${NC}"
            return 0
        fi
        sleep 5
    done
    
    echo -e "${RED}❌ NOT ACCESSIBLE${NC}"
    return 1
}

FAILED_TESTS=0

test_service "Frontend" 3100 "http://localhost:3100" "200" || ((FAILED_TESTS++))
test_service "Backend Health" 4100 "http://localhost:4100/api/health" "200" || ((FAILED_TESTS++))
test_service "AI Service Health" 5100 "http://localhost:5100/health" "200" || ((FAILED_TESTS++))

# Check ArgoCD
echo ""
echo -e "${YELLOW}5. Checking ArgoCD...${NC}"
if $KUBECTL get namespace argocd >/dev/null 2>&1; then
    if $KUBECTL get pods -n argocd | grep -q "argocd-server"; then
        echo -e "${GREEN}✅ ArgoCD pods are running${NC}"
        if curl -s --max-time 5 -k "https://localhost:18082" >/dev/null 2>&1; then
            echo -e "${GREEN}✅ ArgoCD is accessible${NC}"
        else
            echo -e "${YELLOW}⚠️ ArgoCD pods running but not accessible on port 18082${NC}"
        fi
    else
        echo -e "${RED}❌ ArgoCD pods not found${NC}"
    fi
else
    echo -e "${RED}❌ ArgoCD namespace not found${NC}"
fi

# Check resource usage
echo ""
echo -e "${YELLOW}6. Checking resource usage...${NC}"
echo "Memory usage:"
minikube ssh -- free -h 2>/dev/null || echo "Cannot get memory usage"
echo ""
echo "CPU usage:"
minikube ssh -- top -bn1 | head -5 2>/dev/null || echo "Cannot get CPU usage"

# Final validation
echo ""
echo -e "${BLUE}📊 Deployment Summary${NC}"
echo "=================================="

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 ALL SERVICES ARE WORKING!${NC}"
    echo ""
    echo -e "${BLUE}🌐 Service URLs:${NC}"
    echo -e "  Frontend:   ${YELLOW}http://localhost:3100${NC}"
    echo -e "  Backend:    ${YELLOW}http://localhost:4100${NC}"
    echo -e "  AI Service: ${YELLOW}http://localhost:5100${NC}"
    if curl -s --max-time 5 -k "https://localhost:18082" >/dev/null 2>&1; then
        echo -e "  ArgoCD:     ${YELLOW}https://localhost:18082${NC}"
    fi
    echo ""
    echo -e "${GREEN}✅ Deployment is healthy and ready for use${NC}"
    exit 0
else
    echo -e "${RED}❌ $FAILED_TESTS service(s) are not working${NC}"
    echo ""
    echo -e "${BLUE}🔧 Debug Commands:${NC}"
    echo "  View pods:     $KUBECTL get pods -n career-coach-prod"
    echo "  View logs:     $KUBECTL logs -f -n career-coach-prod <pod-name>"
    echo "  Describe pod:  $KUBECTL describe pod -n career-coach-prod <pod-name>"
    echo "  View events:   $KUBECTL get events -n career-coach-prod --sort-by='.lastTimestamp'"
    echo "  Restart:      bash devops.sh"
    echo ""
    echo -e "${BLUE}🛠️ Port Management:${NC}"
    echo "  Stop forwards: kill \$(cat /tmp/career-coach-*.pid 2>/dev/null)"
    echo "  Check ports:   lsof -i :3100 -i :4100 -i :5100"
    exit 1
fi
