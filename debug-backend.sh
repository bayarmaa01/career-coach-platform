#!/bin/bash

echo "🔍 Debugging backend 500 error..."

# Detect WSL
if grep -qi microsoft /proc/version; then
    DOCKER_CMD="docker compose"
else
    DOCKER_CMD="docker compose"
fi

echo "📊 Backend container status:"
$DOCKER_CMD -f docker-compose.windows.yml ps backend

echo ""
echo "📋 Backend logs (last 30 lines):"
$DOCKER_CMD -f docker-compose.windows.yml logs --tail=30 backend

echo ""
echo "🧪 Testing backend endpoints:"
echo "=== Health Check ==="
curl -v http://localhost:5000/health 2>&1 | head -10

echo ""
echo "=== Register Endpoint Test ==="
curl -v -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User"}' \
  2>&1 | head -15

echo ""
echo "🔧 If backend is failing, try restarting:"
echo "   $DOCKER_CMD -f docker-compose.windows.yml restart backend"
