#!/bin/bash

# Script to retrieve Keycloak client secret
# This script helps automate getting the client secret from Keycloak

set -e

echo "🔐 Keycloak Client Secret Retrieval"
echo "===================================="
echo ""

# Check if Keycloak is running
if ! docker-compose ps keycloak | grep -q "Up"; then
    echo "❌ Keycloak is not running!"
    echo "   Please start services with: docker-compose up -d"
    exit 1
fi

echo "✅ Keycloak is running"
echo ""

# Wait for Keycloak to be ready
echo "⏳ Waiting for Keycloak to be ready..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8080/health/ready > /dev/null 2>&1; then
        echo "✅ Keycloak is ready"
        break
    fi
    attempt=$((attempt + 1))
    echo "   Attempt $attempt/$max_attempts..."
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo "❌ Keycloak did not become ready in time"
    exit 1
fi

echo ""
echo "📋 To get your client secret:"
echo ""
echo "1. Open Keycloak Admin Console:"
echo "   👉 http://localhost:8080"
echo ""
echo "2. Login with:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "3. Navigate to:"
echo "   Clients → web → Credentials tab"
echo ""
echo "4. Copy the 'Client Secret' value"
echo ""
echo "5. Update your .env.local file:"
echo "   KEYCLOAK_CLIENT_SECRET=<paste-secret-here>"
echo ""
echo "💡 Tip: The client secret is auto-generated on first start"
echo "   and will remain the same unless you regenerate it."
echo ""

# Try to get the secret via API (requires admin token)
echo "🔧 Attempting to retrieve secret via API..."
echo ""

# Get admin token
ADMIN_TOKEN=$(curl -s -X POST "http://localhost:8080/realms/master/protocol/openid-connect/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin" \
  -d "password=admin" \
  -d "grant_type=password" \
  -d "client_id=admin-cli" \
  | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ADMIN_TOKEN" ]; then
    echo "⚠️  Could not retrieve admin token automatically"
    echo "   Please follow the manual steps above"
    exit 0
fi

# Get client secret
CLIENT_SECRET=$(curl -s -X GET "http://localhost:8080/admin/realms/church/clients" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  | grep -A 10 '"clientId":"web"' \
  | grep -o '"secret":"[^"]*' | cut -d'"' -f4)

if [ -n "$CLIENT_SECRET" ]; then
    echo "✅ Successfully retrieved client secret!"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "KEYCLOAK_CLIENT_SECRET=$CLIENT_SECRET"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 Copy the line above and add it to your .env.local file"
    echo ""
    
    # Offer to update .env.local automatically
    if [ -f ".env.local" ]; then
        read -p "Would you like to update .env.local automatically? (y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            if grep -q "KEYCLOAK_CLIENT_SECRET=" .env.local; then
                # Update existing line
                sed -i.bak "s/KEYCLOAK_CLIENT_SECRET=.*/KEYCLOAK_CLIENT_SECRET=$CLIENT_SECRET/" .env.local
                echo "✅ Updated KEYCLOAK_CLIENT_SECRET in .env.local"
            else
                # Add new line
                echo "KEYCLOAK_CLIENT_SECRET=$CLIENT_SECRET" >> .env.local
                echo "✅ Added KEYCLOAK_CLIENT_SECRET to .env.local"
            fi
        fi
    else
        echo "⚠️  .env.local not found. Please create it from .env.example first:"
        echo "   cp .env.example .env.local"
    fi
else
    echo "⚠️  Could not retrieve client secret automatically"
    echo "   Please follow the manual steps above"
fi

echo ""
echo "✨ Done!"
