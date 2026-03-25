#!/bin/bash

echo "🚀 Starting AI Career Coach Platform..."

# Detect WSL
if grep -qi microsoft /proc/version; then
    echo "✅ WSL detected"
    DOCKER_CMD="docker compose"
else
    echo "✅ Linux detected"
    DOCKER_CMD="docker compose"
fi

echo "🧹 Cleaning old containers..."
$DOCKER_CMD -f docker-compose.windows.yml down -v 2>/dev/null || true

echo "📁 Removing node_modules..."
rm -rf backend/node_modules frontend/node_modules

echo "🔐 Fixing permissions..."
chmod -R 755 backend frontend

echo "🐳 Starting containers..."
$DOCKER_CMD -f docker-compose.windows.yml up -d --build

echo "⏳ Waiting for startup..."
sleep 20

echo "📊 Container status:"
$DOCKER_CMD -f docker-compose.windows.yml ps

echo ""
echo "🌐 Testing services..."

sleep 5

curl -s http://localhost:8000/health && echo "✅ AI Service OK" || echo "❌ AI Service Failed"
curl -s http://localhost:5000 && echo "✅ Backend OK" || echo "❌ Backend Failed"
curl -s http://localhost:3000 && echo "✅ Frontend OK" || echo "❌ Frontend Failed"

echo ""
echo "🎯 Access URLs:"
echo "Frontend: http://localhost:3000"
echo "Backend: http://localhost:5000"
echo "AI Service: http://localhost:8000"