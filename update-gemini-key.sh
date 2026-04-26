#!/bin/bash

# Update Gemini API Key in Kubernetes
echo "🔧 Updating Gemini API configuration..."

# Update the secret with new API key
kubectl create secret generic app-secrets \
  --from-literal=GEMINI_API_KEY=AIzaSyCIjycXj7IkqON3zkO7rGFbx5wE5dynNMs \
  --from-literal=AI_MODEL_API_KEY=AIzaSyCIjycXj7IkqON3zkO7rGFbx5wE5dynNMs \
  --from-literal=GEMINI_PROJECT_NAME=projects/679542306161 \
  --from-literal=GEMINI_PROJECT_NUMBER=679542306161 \
  --dry-run=client -o yaml | kubectl apply -f - -n career-coach-prod

echo "✅ Secret updated. Restarting backend deployment..."

# Restart backend to pick up new secret
kubectl rollout restart deployment/backend-prod -n career-coach-prod

echo "⏳ Waiting for backend to be ready..."
kubectl wait --for=condition=ready pod -l app=backend-prod -n career-coach-prod --timeout=180s

echo "🎉 Gemini API update completed!"
