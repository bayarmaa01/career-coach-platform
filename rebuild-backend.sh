#!/bin/bash

echo "Rebuilding backend image with logger fix..."

# Set minikube docker environment
eval $(minikube docker-env)

# Build backend image
cd backend
docker build -t backend-prod:latest .

echo "Backend image rebuilt successfully!"

# Restart deployment
kubectl rollout restart deployment/backend-prod -n career-coach-prod

echo "Backend deployment restarted!"
