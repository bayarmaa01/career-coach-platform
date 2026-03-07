#!/bin/bash

echo "🔍 Testing backend connection..."

# Test basic backend connectivity
echo "📊 Testing backend health:"
curl -v http://localhost:5000/health 2>&1 | head -10

echo ""
echo "🔧 Testing backend root:"
curl -v http://localhost:5000 2>&1 | head -10

echo ""
echo "📋 Testing backend register endpoint:"
curl -v -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}' \
  2>&1 | head -10

echo ""
echo "🌐 Testing AI service (for comparison):"
curl -v http://localhost:8000/health 2>&1 | head -5

echo ""
echo "📊 Container status:"
docker compose -f docker-compose.windows.yml ps
