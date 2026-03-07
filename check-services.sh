#!/bin/bash

echo "🔍 Checking service logs..."

# Detect WSL
if grep -qi microsoft /proc/version; then
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker compose"
fi

echo "📊 Backend logs:"
$DOCKER_CMD -f docker-compose.windows.yml logs --tail=20 backend

echo ""
echo "🎨 Frontend logs:"
$DOCKER_CMD -f docker-compose.windows.yml logs --tail=20 frontend

echo ""
echo "🌐 Testing again in 30 seconds..."
sleep 30

echo "📊 Service Status:"
curl -s http://localhost:8000/health && echo "✅ AI Service OK" || echo "❌ AI Service Failed"
curl -s http://localhost:5000 && echo "✅ Backend OK" || echo "❌ Backend Failed"
curl -s http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

echo ""
echo "🎯 If still failing, try:"
echo "   📋 View logs: $DOCKER_CMD -f docker-compose.windows.yml logs [service-name]"
echo "   🔄 Restart: $DOCKER_CMD -f docker-compose.windows.yml restart [service-name]"
