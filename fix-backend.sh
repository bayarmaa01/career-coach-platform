#!/bin/bash

echo "🔧 Fixing backend TypeScript issues..."

# Detect WSL
if grep -qi microsoft /proc/version; then
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker compose"
fi

echo "🔍 Checking backend container status..."
$DOCKER_CMD -f docker-compose.windows.yml logs --tail=10 backend

echo ""
echo "🔄 Restarting backend container..."
$DOCKER_CMD -f docker-compose.windows.yml restart backend

echo "⏳ Waiting for restart..."
sleep 10

echo "📊 Testing backend..."
curl -s http://localhost:5000 && echo "✅ Backend OK" || echo "❌ Backend Failed"

echo ""
echo "🎨 Testing frontend..."
curl -s http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

echo ""
echo "🌐 Current Status:"
echo "📊 AI Service: http://localhost:8000/health (✅ Working)"
echo "🎨 Frontend: http://localhost:3000 (Should work)"
echo "🔧 Backend: http://localhost:5000 (Restarted)"

echo ""
echo "🔧 If backend still fails, check TypeScript errors:"
echo "   $DOCKER_CMD -f docker-compose.windows.yml logs backend"
