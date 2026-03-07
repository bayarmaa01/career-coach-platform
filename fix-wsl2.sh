#!/bin/bash

echo "🔧 Fixing WSL 2 + Docker Desktop issues..."

# Check if we're in WSL 2
if grep -q Microsoft /proc/version; then
    echo "✅ Detected WSL 2 environment"
    
    # Use docker compose (newer syntax for WSL 2)
    DOCKER_CMD="docker compose"
else
    echo "❌ Not in WSL 2, using legacy docker-compose"
    DOCKER_CMD="docker-compose"
fi

# Clean up node_modules to fix permission issues
echo "📁 Removing old node_modules..."
rm -rf backend/node_modules
rm -rf frontend/node_modules

# Set proper permissions
echo "🔐 Setting permissions..."
chmod -R 777 backend
chmod -R 777 frontend

echo "✅ Permissions fixed!"
echo "🚀 Starting containers..."

# Stop and remove old containers
$DOCKER_CMD -f docker-compose.windows.yml down -v 2>/dev/null || docker-compose -f docker-compose.windows.yml down -v 2>/dev/null

# Start with Windows-specific fixes
echo "🐳 Building and starting containers..."
$DOCKER_CMD -f docker-compose.windows.yml up -d --build 2>/dev/null || docker-compose -f docker-compose.windows.yml up -d --build

echo "⏳ Waiting for containers to start..."
sleep 15

echo "🧪 Checking status..."
$DOCKER_CMD -f docker-compose.windows.yml ps 2>/dev/null || docker-compose -f docker-compose.windows.yml ps 2>/dev/null

echo "🌐 Testing services..."
sleep 10

echo "📊 AI Service:"
curl -s http://localhost:8000/health 2>/dev/null && echo "✅ AI Service working" || echo "❌ AI Service failed"

echo "🔧 Backend:"
curl -s http://localhost:5000 2>/dev/null && echo "✅ Backend working" || echo "❌ Backend failed"

echo "🎨 Frontend:"
curl -s http://localhost:3000 2>/dev/null && echo "✅ Frontend working" || echo "❌ Frontend failed"

echo ""
echo "🎉 Platform should be available at:"
echo "   🎨 Frontend: http://localhost:3000"
echo "   🔧 Backend:  http://localhost:5000"
echo "   📊 AI Service: http://localhost:8000"
echo ""
echo "📋 If services failed, check logs with:"
echo "   $DOCKER_CMD -f docker-compose.windows.yml logs [service-name]"
