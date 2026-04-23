#!/bin/bash

echo "Rebuilding AI service with Gemini integration..."

# Set minikube docker environment (if using minikube)
# eval $(minikube docker-env)

# Build AI service image
cd ai-service
docker build -t career-coach-ai-service:latest .

echo "AI service image rebuilt successfully!"

# Restart deployment
kubectl rollout restart deployment/ai-service -n career-coach

echo "AI service deployment restarted!"

# Wait for rollout to complete
kubectl rollout status deployment/ai-service -n career-coach --timeout=60s

echo "AI service rollout completed!"
