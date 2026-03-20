#!/bin/bash

echo "🚀 Deploying Career Coach Platform to AKS..."

# Step 1: Create namespaces first
echo "📋 Creating namespaces..."
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/namespace-prod.yaml

# Wait for namespaces to be ready
echo "⏳ Waiting for namespaces..."
kubectl wait --for=condition=Ready namespace/career-coach --timeout=60s
kubectl wait --for=condition=Ready namespace/career-coach-prod --timeout=60s

# Step 2: Apply secrets
echo "🔐 Applying secrets..."
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/secrets-prod.yaml

# Step 3: Apply storage
echo "💾 Applying storage..."
kubectl apply -f k8s/persistent-volume.yaml
kubectl apply -f k8s/postgres-statefulset.yaml
kubectl apply -f k8s/postgres-service.yaml

# Step 4: Apply databases
echo "🗄️ Applying databases..."
kubectl apply -f k8s/redis-deployment.yaml
kubectl apply -f k8s/redis-service.yaml
kubectl apply -f k8s/redis-deployment-prod.yaml

# Step 5: Apply configmaps
echo "⚙️ Applying configmaps..."
kubectl apply -f k8s/configmap.yaml

# Step 6: Apply services
echo "🌐 Applying services..."
kubectl apply -f k8s/frontend-service.yaml
kubectl apply -f k8s/backend-service.yaml
kubectl apply -f k8s/ai-service-service.yaml

# Step 7: Apply deployments
echo "🚀 Applying deployments..."
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/ai-service-deployment.yaml

# Step 8: Apply production deployments
echo "🏭 Applying production deployments..."
kubectl apply -f k8s/frontend-deployment-prod.yaml
kubectl apply -f k8s/backend-deployment-prod.yaml
kubectl apply -f k8s/ai-service-deployment-prod.yaml

# Step 9: Apply ingress
echo "🌍 Applying ingress..."
kubectl apply -f k8s/ingress.yaml
kubectl apply -f k8s/ingress-prod.yaml

echo "✅ Deployment completed!"
echo ""
echo "📊 Checking deployment status..."
kubectl get pods -n career-coach
kubectl get pods -n career-coach-prod
kubectl get svc -n ingress-nginx
kubectl get ingress -n career-coach-prod
