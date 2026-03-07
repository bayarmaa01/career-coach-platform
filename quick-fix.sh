#!/bin/bash

echo "🚀 Quick fix for all services..."

# Detect WSL
if grep -qi microsoft /proc/version; then
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker compose"
fi

echo "🔍 Current container status:"
$DOCKER_CMD -f docker-compose.windows.yml ps

echo ""
echo "📋 Recent logs:"
echo "=== Backend ==="
$DOCKER_CMD -f docker-compose.windows.yml logs --tail=10 backend

echo ""
echo "=== Frontend ==="
$DOCKER_CMD -f docker-compose.windows.yml logs --tail=10 frontend

echo ""
echo "🔄 Restarting all services..."
$DOCKER_CMD -f docker-compose.windows.yml restart

echo "⏳ Waiting 15 seconds..."
sleep 15

echo "🧪 Testing all services:"
echo "📊 AI Service:"
curl -s http://localhost:8000/health && echo " ✅ Working" || echo " ❌ Failed"

echo "🔧 Backend:"
curl -s http://localhost:5000 && echo " ✅ Working" || echo " ❌ Failed"

echo "🎨 Frontend:"
curl -s http://localhost:3000 && echo " ✅ Working" || echo " ❌ Failed"

echo ""
echo "🎯 Access URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "AI Service: http://localhost:8000"
