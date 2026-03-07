#!/bin/bash

echo "🔧 Fixing Windows Docker permission issues..."

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
docker-compose -f docker-compose.windows.yml down -v

# Start with Windows-specific fixes
docker-compose -f docker-compose.windows.yml up -d --build

echo "🧪 Checking status..."
sleep 10
docker-compose -f docker-compose.windows.yml ps

echo "🌐 Testing services..."
sleep 15

echo "📊 AI Service:"
curl http://localhost:8000/health || echo "❌ AI Service failed"

echo "🔧 Backend:"
curl http://localhost:5000 || echo "❌ Backend failed"

echo "🎨 Frontend:"
curl http://localhost:3000 || echo "❌ Frontend failed"

echo "🎉 Platform should be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:5000"
echo "   AI Service: http://localhost:8000"
