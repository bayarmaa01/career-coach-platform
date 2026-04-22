#!/bin/bash

# Frontend Deployment Fix Script
# Fixes caching issues and ensures latest code is deployed

set -e

echo "=== FRONTEND DEPLOYMENT FIX ==="

# Generate build hash for cache busting
BUILD_HASH=$(date +%s)
BUILD_VERSION="v1.0.0-${BUILD_HASH}"
BUILD_TIME=$(date -u +%Y-%m-%dT%H:%M:%SZ)

echo "Build Hash: $BUILD_HASH"
echo "Build Version: $BUILD_VERSION"
echo "Build Time: $BUILD_TIME"

# Step 1: Clean up old Docker images
echo "=== STEP 1: CLEANING OLD DOCKER IMAGES ==="
docker rmi frontend-prod:latest 2>/dev/null || true
docker rmi $(docker images -f "dangling=true" -q) 2>/dev/null || true
docker system prune -f

# Step 2: Build new frontend image with cache busting
echo "=== STEP 2: BUILDING NEW FRONTEND IMAGE ==="
cd frontend
docker build \
  --build-arg BUILD_HASH=$BUILD_HASH \
  --build-arg BUILD_VERSION=$BUILD_VERSION \
  --no-cache \
  -t frontend-prod:latest \
  .

# Step 3: Load image into Minikube
echo "=== STEP 3: LOADING IMAGE INTO MINIKUBE ==="
minikube image load frontend-prod:latest

# Step 4: Update Kubernetes deployment with build info
echo "=== STEP 4: UPDATING KUBERNETES DEPLOYMENT ==="
cd ../k8s/career-coach-prod

# Create deployment with build annotations
cat > frontend-deployment-fixed.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend-prod
  namespace: career-coach-prod
  labels:
    app: frontend-prod
    tier: frontend
spec:
  replicas: 2
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: frontend-prod
  template:
    metadata:
      labels:
        app: frontend-prod
        tier: frontend
      annotations:
        build-hash: "$BUILD_HASH"
        build-time: "$BUILD_TIME"
        build-version: "$BUILD_VERSION"
    spec:
      containers:
      - name: frontend
        image: frontend-prod:latest
        imagePullPolicy: Never
        ports:
        - containerPort: 80
        env:
        - name: VITE_API_URL
          value: "http://backend-service:4100/api"
        - name: VITE_AI_SERVICE_URL
          value: "http://ai-service:5100"
        - name: BUILD_HASH
          value: "$BUILD_HASH"
        - name: BUILD_VERSION
          value: "$BUILD_VERSION"
        resources:
          requests:
            memory: "128Mi"
            cpu: "50m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 30
          timeoutSeconds: 10
          failureThreshold: 3
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 10
          periodSeconds: 10
          timeoutSeconds: 5
          failureThreshold: 3
EOF

# Apply the updated deployment
kubectl apply -f frontend-deployment-fixed.yaml

# Step 5: Force restart deployment
echo "=== STEP 5: FORCING DEPLOYMENT RESTART ==="
kubectl rollout restart deployment/frontend-prod -n career-coach-prod

# Step 6: Wait for deployment to be ready
echo "=== STEP 6: WAITING FOR DEPLOYMENT TO BE READY ==="
kubectl rollout status deployment/frontend-prod -n career-coach-prod --timeout=120s

# Step 7: Verify deployment
echo "=== STEP 7: VERIFYING DEPLOYMENT ==="
kubectl get pods -n career-coach-prod -l app=frontend-prod

# Step 8: Show build info
echo "=== STEP 8: BUILD INFO ==="
echo "Frontend deployed with:"
echo "- Build Hash: $BUILD_HASH"
echo "- Build Version: $BUILD_VERSION"
echo "- Build Time: $BUILD_TIME"

# Step 9: Test build info endpoint
echo "=== STEP 9: TESTING BUILD INFO ENDPOINT ==="
echo "You can check the build info at: http://localhost:3100/build-info.json"

echo "=== DEPLOYMENT COMPLETE ==="
echo "Your frontend should now be updated with the latest changes!"
echo ""
echo "To verify:"
echo "1. Open http://localhost:3100"
echo "2. Check for new navigation items: Create CV, AI Chat, Recommendations"
echo "3. Visit http://localhost:3100/build-info.json to see build details"
