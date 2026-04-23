#!/bin/bash

# Script to get authentication token for Career Coach Platform API

echo "🔑 Getting Authentication Token for Career Coach Platform"
echo "=========================================================="

# Default credentials (you can change these)
EMAIL="admin@example.com"
PASSWORD="admin123"

# Allow custom credentials
if [ "$1" != "" ]; then
    EMAIL="$1"
fi

if [ "$2" != "" ]; then
    PASSWORD="$2"
fi

echo "📧 Email: $EMAIL"
echo "🔑 Password: [hidden]"
echo ""

# Login and get token
echo "🚀 Logging in to get token..."
RESPONSE=$(curl -s -X POST http://localhost:4100/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

# Extract token
TOKEN=$(echo $RESPONSE | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -n "$TOKEN" ]; then
    echo "✅ Successfully obtained token!"
    echo ""
    echo "🎯 Your Token:"
    echo "Bearer $TOKEN"
    echo ""
    echo "📋 Copy this token for API calls:"
    echo "curl -X POST http://localhost:4100/api/ai/recommendations-lite \\"
    echo "  -H \"Content-Type: application/json\" \\"
    echo "  -H \"Authorization: Bearer $TOKEN\" \\"
    echo "  -d '{\"skills\":[\"JavaScript\"],\"interests\":[\"Web Development\"]}'"
    echo ""
    echo "💾 Save token to environment variable:"
    echo "export TOKEN=\"$TOKEN\""
    echo ""
else
    echo "❌ Failed to get token!"
    echo "📄 Response: $RESPONSE"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "1. Make sure backend is running on http://localhost:4100"
    echo "2. Check if user exists: $EMAIL"
    echo "3. Verify password is correct"
    echo "4. Try creating a new account first"
fi
