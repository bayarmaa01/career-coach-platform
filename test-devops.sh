#!/bin/bash

# Test script for devops-smart.sh
echo "🧪 Testing devops-smart.sh fixes..."
echo ""

# Kill existing port-forwards
echo "🔄 Cleaning up existing port-forwards..."
pkill -f "kubectl port-forward" 2>/dev/null || true
sleep 2

# Run the fixed devops-smart.sh
echo "🚀 Starting devops-smart.sh..."
echo ""
echo "Expected port-forward mappings:"
echo "- Frontend: 3100:3100 (service exposes 3100, container runs on 80)"
echo "- Backend: 4100:4100 (service exposes 4100, container runs on 5000)" 
echo "- AI Service: 5100:5100 (service and container both run on 5100)"
echo "- Grafana: 3003:3003 (service exposes 3003, container runs on 3000)"
echo "- ArgoCD: 18082:443 (service exposes 443, container runs on 8080)"
echo ""

echo "Starting devops-smart.sh..."
./devops-smart.sh
