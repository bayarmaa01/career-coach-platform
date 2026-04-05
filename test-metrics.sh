#!/bin/bash

# Test script to verify metrics endpoints are working

echo "🔍 Testing Career Coach Platform Metrics Endpoints..."

# Test Backend Metrics
echo ""
echo "📊 Testing Backend Metrics..."
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4100/metrics)
if [ "$BACKEND_STATUS" = "200" ]; then
    echo "✅ Backend metrics endpoint: $BACKEND_STATUS OK"
    echo "📄 Sample metrics:"
    curl -s http://localhost:4100/metrics | head -10
else
    echo "❌ Backend metrics endpoint: $BACKEND_STATUS FAILED"
fi

# Test AI Service Metrics
echo ""
echo "🤖 Testing AI Service Metrics..."
AI_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5100/metrics)
if [ "$AI_STATUS" = "200" ]; then
    echo "✅ AI service metrics endpoint: $AI_STATUS OK"
    echo "📄 Sample metrics:"
    curl -s http://localhost:5100/metrics | head -10
else
    echo "❌ AI service metrics endpoint: $AI_STATUS FAILED"
fi

# Test Backend Health
echo ""
echo "🏥 Testing Backend Health..."
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4100/api/health)
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Backend health endpoint: $HEALTH_STATUS OK"
    curl -s http://localhost:4100/api/health | jq .
else
    echo "❌ Backend health endpoint: $HEALTH_STATUS FAILED"
fi

# Test AI Service Health
echo ""
echo "🤖 Testing AI Service Health..."
AI_HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5100/health)
if [ "$AI_HEALTH_STATUS" = "200" ]; then
    echo "✅ AI service health endpoint: $AI_HEALTH_STATUS OK"
    curl -s http://localhost:5100/health
else
    echo "❌ AI service health endpoint: $AI_HEALTH_STATUS FAILED"
fi

echo ""
echo "🔄 If endpoints are failing, restart deployments:"
echo "   minikube kubectl -- rollout restart deployment/backend-prod -n career-coach-prod"
echo "   minikube kubectl -- rollout restart deployment/ai-service-prod -n career-coach-prod"
