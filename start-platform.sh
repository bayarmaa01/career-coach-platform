#!/bin/bash

echo "🚀 Starting AI Career Coach Platform..."

# Check if we're in WSL 2
if grep -q Microsoft /proc/version; then
    echo "✅ WSL 2 detected - using docker compose"
    DOCKER_CMD="docker compose"
    
    # Fix Docker Desktop WSL 2 integration
    echo "🔧 Checking Docker Desktop WSL integration..."
    if ! docker context ls | grep -q "default.*wsl"; then
        echo "⚠️  Docker Desktop WSL integration not enabled"
        echo "📖 Please enable WSL integration in Docker Desktop settings:"
        echo "   1. Open Docker Desktop"
        echo "   2. Go to Settings > Resources > WSL Integration"
        echo "   3. Enable 'Use WSL 2 based engine'"
        echo "   4. Click 'Apply & Restart'"
        echo ""
        echo "🔄 After enabling, run this script again"
        exit 1
    fi
else
    echo "✅ Standard Linux detected - using docker-compose"
    DOCKER_CMD="docker-compose"
fi

# Clean up previous attempts
echo "🧹 Cleaning up..."
$DOCKER_CMD -f docker-compose.windows.yml down -v 2>/dev/null || true

# Remove problematic node_modules
echo "📁 Removing node_modules..."
rm -rf backend/node_modules frontend/node_modules 2>/dev/null || true

# Set permissions
echo "🔐 Setting permissions..."
chmod -R 755 backend frontend 2>/dev/null || true

# Start services
echo "🐳 Starting containers..."
$DOCKER_CMD -f docker-compose.windows.yml up -d --build

# Wait for startup
echo "⏳ Waiting for services to start..."
sleep 20

# Check status
echo "🧪 Checking container status..."
$DOCKER_CMD -f docker-compose.windows.yml ps

# Test services
echo "🌐 Testing services..."
sleep 5

echo ""
echo "📊 Service Status:"
echo "=================="

# Test AI Service
if curl -s http://localhost:8000/health >/dev/null 2>&1; then
    echo "✅ AI Service: http://localhost:8000 (Working)"
else
    echo "❌ AI Service: http://localhost:8000 (Failed)"
fi

# Test Backend
if curl -s http://localhost:5000 >/dev/null 2>&1; then
    echo "✅ Backend: http://localhost:5000 (Working)"
else
    echo "❌ Backend: http://localhost:5000 (Failed)"
fi

# Test Frontend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✅ Frontend: http://localhost:3000 (Working)"
else
    echo "❌ Frontend: http://localhost:3000 (Failed)"
fi

echo ""
echo "🎯 Quick Access:"
echo "🎨 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 AI Service: http://localhost:8000"
echo ""
echo "📋 View logs: $DOCKER_CMD -f docker-compose.windows.yml logs [service-name]"
echo "🛑 Stop all: $DOCKER_CMD -f docker-compose.windows.yml down"
