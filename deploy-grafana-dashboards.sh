#!/bin/bash

# Deploy Grafana Dashboards for Career Coach Platform
# This script applies the ConfigMaps and restarts Grafana to load dashboards

set -e

echo "🚀 Deploying Grafana dashboards for Career Coach Platform..."

# Apply the ConfigMaps
echo "📊 Creating Grafana application dashboards ConfigMap..."
kubectl apply -f k8s/career-coach-prod/grafana-configmap.yaml

echo "🏗️ Creating Grafana infrastructure dashboards ConfigMap..."
kubectl apply -f k8s/career-coach-prod/infrastructure-dashboard.yaml

# Update the Grafana deployment
echo "🔄 Updating Grafana deployment with volume mounts..."
kubectl apply -f k8s/career-coach-prod/grafana-deployment.yaml

# Restart Grafana to load the new configuration
echo "🔄 Restarting Grafana to load dashboards..."
kubectl rollout restart deployment/grafana -n career-coach-prod

# Wait for Grafana to be ready
echo "⏳ Waiting for Grafana to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/grafana -n career-coach-prod

# Get Grafana URL
echo "🌐 Getting Grafana access information..."
GRAFANA_PORT=$(kubectl get svc grafana -n career-coach-prod -o jsonpath='{.spec.ports[0].nodePort}' 2>/dev/null || echo "3003")
GRAFANA_NODE_IP=$(kubectl get nodes -o jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}' 2>/dev/null || echo "localhost")

echo ""
echo "✅ Grafana dashboards deployed successfully!"
echo ""
echo "📊 Grafana Access:"
echo "   URL: http://$GRAFANA_NODE_IP:$GRAFANA_PORT"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "📈 Available Dashboards:"
echo "   • Career Coach - Application Metrics"
echo "   • Career Coach - Infrastructure Metrics"
echo "   • Career Coach - AI Service Metrics"
echo "   • Career Coach - Kubernetes Metrics"
echo ""
echo "🔧 To access Grafana:"
echo "   1. Port forward: kubectl port-forward svc/grafana 3003:3003 -n career-coach-prod"
echo "   2. Open browser: http://localhost:3003"
echo "   3. Login with admin/admin"
echo ""
echo "📝 Note: Dashboards will be automatically provisioned on startup."
