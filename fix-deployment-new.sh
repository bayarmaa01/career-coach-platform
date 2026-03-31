#!/bin/bash

echo "🔧 Fixing deployment issues..."

NAMESPACE="career-coach-prod"

echo "📊 Checking pod status..."
minikube kubectl -- get pods -n $NAMESPACE -o wide

echo ""
echo "🔍 Checking pod events..."
minikube kubectl -- get events -n $NAMESPACE --sort-by='.lastTimestamp' | tail -20

echo ""
echo "📋 Checking pod descriptions..."
for pod in $(minikube kubectl -- get pods -n $NAMESPACE -o name); do
    echo "=== $pod ==="
    minikube kubectl -- describe $pod -n $NAMESPACE | grep -A 10 "Events:"
    echo ""
done

echo "🚀 Attempting to restart problematic pods..."
echo "Deleting deployments to force recreation..."
minikube kubectl -- delete deployment backend-prod -n $NAMESPACE --ignore-not-found=true
minikube kubectl -- delete deployment frontend-prod -n $NAMESPACE --ignore-not-found=true
minikube kubectl -- delete deployment ai-service-prod -n $NAMESPACE --ignore-not-found=true

echo "Waiting 10 seconds..."
sleep 10

echo "Reapplying deployments..."
minikube kubectl -- apply -f k8s/career-coach-prod/backend-deployment.yaml
minikube kubectl -- apply -f k8s/career-coach-prod/frontend-deployment.yaml  
minikube kubectl -- apply -f k8s/career-coach-prod/ai-service-deployment.yaml

echo "⏳ Waiting for pods to be ready..."
sleep 30

echo "📊 Final pod status..."
minikube kubectl -- get pods -n $NAMESPACE
