#!/bin/bash

# Restart services to apply latest code changes

echo "🔄 Restarting Career Coach Platform Services..."

# Restart Backend
echo "🔧 Restarting Backend..."
minikube kubectl -- rollout restart deployment/backend-prod -n career-coach-prod
echo "⏳ Waiting for backend to be ready..."
minikube kubectl -- rollout status deployment/backend-prod -n career-coach-prod --timeout=60s

# Restart AI Service
echo "🤖 Restarting AI Service..."
minikube kubectl -- rollout restart deployment/ai-service-prod -n career-coach-prod
echo "⏳ Waiting for AI service to be ready..."
minikube kubectl -- rollout status deployment/ai-service-prod -n career-coach-prod --timeout=60s

# Restart Frontend
echo "🎨 Restarting Frontend..."
minikube kubectl -- rollout restart deployment/frontend-prod -n career-coach-prod
echo "⏳ Waiting for frontend to be ready..."
minikube kubectl -- rollout status deployment/frontend-prod -n career-coach-prod --timeout=60s

echo ""
echo "✅ All services restarted!"
echo ""
echo "📊 Check pod status:"
echo "   minikube kubectl -- get pods -n career-coach-prod"
echo ""
echo "🔍 Test metrics endpoints:"
echo "   ./test-metrics.sh"
