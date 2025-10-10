#!/bin/bash

# Deployment Script for Vercel + Fly.io + Neon
# This script guides you through deploying the Church Volunteers app

set -e

echo "🚀 Church Volunteers - Deployment Script"
echo "========================================="
echo ""
echo "This will deploy to:"
echo "  • PostgreSQL → Neon"
echo "  • Keycloak → Fly.io"
echo "  • Next.js → Vercel"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v flyctl &> /dev/null; then
    echo -e "${RED}❌ Fly CLI not found${NC}"
    echo "   Install with: brew install flyctl"
    echo "   Or visit: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    # Check if it's in ~/.npm-global/bin
    if [ -f "$HOME/.npm-global/bin/vercel" ]; then
        export PATH="$HOME/.npm-global/bin:$PATH"
        echo -e "${GREEN}✅ Found Vercel CLI in ~/.npm-global/bin${NC}"
    else
        echo -e "${YELLOW}⚠️  Vercel CLI not found${NC}"
        echo "   Installing to ~/.npm-global (no sudo required)..."
        npm install -g vercel --prefix ~/.npm-global
        export PATH="$HOME/.npm-global/bin:$PATH"
        
        # Add to shell config if not already there
        if ! grep -q "npm-global/bin" ~/.zshrc 2>/dev/null; then
            echo 'export PATH="$HOME/.npm-global/bin:$PATH"' >> ~/.zshrc
        fi
        
        echo -e "${GREEN}✅ Vercel CLI installed${NC}"
    fi
fi

if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  psql not found (optional for migrations)${NC}"
fi

echo -e "${GREEN}✅ Prerequisites checked${NC}"
echo ""

# Step 1: Neon Setup
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Step 1: PostgreSQL on Neon${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://neon.tech"
echo "2. Create account and new project: church-volunteers"
echo "3. Create second database for Keycloak:"
echo "   Run in SQL Editor: CREATE DATABASE keycloak;"
echo "4. Get both connection strings from dashboard"
echo ""
read -p "Press Enter when you have both connection strings..."
echo ""

read -p "Enter Neon connection string for church_volunteers: " NEON_APP_URL
read -p "Enter Neon connection string for keycloak: " NEON_KEYCLOAK_URL

echo -e "${GREEN}✅ Neon configuration saved${NC}"
echo ""

# Step 2: Fly.io Keycloak
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Step 2: Keycloak on Fly.io${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Login to Fly
echo "Logging into Fly.io..."
flyctl auth login

# Deploy Keycloak
echo ""
echo "Deploying Keycloak..."
cd docker/keycloak

# Check if app exists
if flyctl apps list | grep -q "church-volunteers-keycloak"; then
    echo "App already exists, deploying update..."
    flyctl deploy
else
    echo "Creating new Fly.io app..."
    flyctl launch --no-deploy --name church-volunteers-keycloak --region iad
    
    # Set secrets
    echo "Setting secrets..."
    flyctl secrets set KEYCLOAK_ADMIN=admin
    read -s -p "Enter Keycloak admin password: " KEYCLOAK_ADMIN_PASS
    echo ""
    flyctl secrets set KEYCLOAK_ADMIN_PASSWORD="$KEYCLOAK_ADMIN_PASS"
    
    # Parse Neon connection string for JDBC
    JDBC_URL=$(echo "$NEON_KEYCLOAK_URL" | sed 's/postgresql:/jdbc:postgresql:/')
    flyctl secrets set KC_DB_URL="$JDBC_URL"
    
    # Extract username and password from connection string
    NEON_USER=$(echo "$NEON_KEYCLOAK_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    NEON_PASS=$(echo "$NEON_KEYCLOAK_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
    
    flyctl secrets set KC_DB_USERNAME="$NEON_USER"
    flyctl secrets set KC_DB_PASSWORD="$NEON_PASS"
    
    # Set hostname for Keycloak
    flyctl secrets set KC_HOSTNAME=church-volunteers-keycloak.fly.dev
    flyctl secrets set KC_HOSTNAME_STRICT=false
    
    # Deploy
    flyctl deploy
fi

# Get Keycloak URL
KEYCLOAK_URL=$(flyctl info --json | grep -o '"Hostname":"[^"]*' | cut -d'"' -f4)
KEYCLOAK_FULL_URL="https://$KEYCLOAK_URL"

echo -e "${GREEN}✅ Keycloak deployed to: $KEYCLOAK_FULL_URL${NC}"
echo ""

cd ../..

# Step 3: Get Keycloak Client Secret
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Step 3: Configure Keycloak${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Open: $KEYCLOAK_FULL_URL"
echo "2. Login with admin credentials"
echo "3. Go to: Clients → web → Credentials"
echo "4. Copy the Client Secret"
echo ""
read -p "Enter Keycloak client secret: " KEYCLOAK_SECRET
echo ""

# Step 4: Deploy to Vercel
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Step 4: Next.js on Vercel${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Ensure vercel is in PATH
export PATH="$HOME/.npm-global/bin:$PATH"

# Login to Vercel
echo "Logging into Vercel..."
vercel login

# Deploy
echo "Deploying to Vercel..."
cd apps/web

# Generate NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)

# Set environment variables
vercel env add DATABASE_URL production <<< "$NEON_APP_URL"
vercel env add NEXTAUTH_SECRET production <<< "$NEXTAUTH_SECRET"
vercel env add KEYCLOAK_CLIENT_ID production <<< "web"
vercel env add KEYCLOAK_CLIENT_SECRET production <<< "$KEYCLOAK_SECRET"
vercel env add KEYCLOAK_ISSUER production <<< "$KEYCLOAK_FULL_URL/realms/church"

# Deploy
vercel --prod

# Get Vercel URL
VERCEL_URL=$(vercel inspect --json | grep -o '"url":"[^"]*' | head -1 | cut -d'"' -f4)

echo -e "${GREEN}✅ Deployed to: https://$VERCEL_URL${NC}"
echo ""

cd ../..

# Step 5: Update Keycloak
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Step 5: Update Keycloak Redirect URIs${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "⚠️  IMPORTANT: Update Keycloak configuration"
echo ""
echo "1. Open: $KEYCLOAK_FULL_URL"
echo "2. Login as admin"
echo "3. Go to: Clients → web"
echo "4. Update Valid redirect URIs:"
echo "   • https://$VERCEL_URL/*"
echo "   • https://$VERCEL_URL/api/auth/callback/keycloak"
echo "5. Update Web origins:"
echo "   • https://$VERCEL_URL"
echo "6. Click Save"
echo ""
read -p "Press Enter when done..."

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Your Services:"
echo ""
echo "   Web App:     https://$VERCEL_URL"
echo "   Keycloak:    $KEYCLOAK_FULL_URL"
echo "   Database:    Neon (connection string saved)"
echo ""
echo "🔑 Next Steps:"
echo ""
echo "1. Create test user in Keycloak"
echo "2. Test authentication at: https://$VERCEL_URL"
echo "3. Enable MFA for users"
echo "4. Check event logs in Keycloak"
echo ""
echo "📚 Documentation:"
echo "   • DEPLOYMENT.md - Full deployment guide"
echo "   • TESTING_GUIDE.md - Testing procedures"
echo ""
echo "✨ Your app is live and ready to test!"
echo ""
