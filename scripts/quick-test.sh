#!/bin/bash

# Quick Test Script
# Gets everything running for immediate testing

set -e

echo "🚀 Church Volunteers - Quick Test Setup"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker not found. Please install Docker Desktop.${NC}"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}❌ docker-compose not found. Please install Docker Compose.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Docker is installed${NC}"
echo ""

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "📝 Creating .env.local..."
    cp .env.example .env.local
    
    # Generate NEXTAUTH_SECRET
    SECRET=$(openssl rand -base64 32)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/your-nextauth-secret-change-this-to-random-string/$SECRET/" .env.local
    else
        sed -i "s/your-nextauth-secret-change-this-to-random-string/$SECRET/" .env.local
    fi
    
    echo -e "${GREEN}✅ Created .env.local with generated secret${NC}"
else
    echo -e "${GREEN}✅ .env.local already exists${NC}"
fi

echo ""
echo "🐳 Starting Docker services..."
echo "   This may take 30-60 seconds..."
echo ""

# Start services
docker-compose up -d

# Wait for PostgreSQL
echo "⏳ Waiting for PostgreSQL..."
max_attempts=30
attempt=0

while [ $attempt -lt $max_attempts ]; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✅ PostgreSQL is ready${NC}"
        break
    fi
    attempt=$((attempt + 1))
    sleep 1
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ PostgreSQL did not start in time${NC}"
    exit 1
fi

# Wait for Keycloak
echo "⏳ Waiting for Keycloak (this takes longer)..."
attempt=0
max_attempts=60

while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:8080/health/ready > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Keycloak is ready${NC}"
        break
    fi
    attempt=$((attempt + 1))
    if [ $((attempt % 10)) -eq 0 ]; then
        echo "   Still waiting... ($attempt/$max_attempts)"
    fi
    sleep 2
done

if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}❌ Keycloak did not start in time${NC}"
    echo "   Check logs with: docker-compose logs keycloak"
    exit 1
fi

echo ""
echo "🔐 Getting Keycloak client secret..."
./scripts/get-keycloak-secret.sh

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ All services are running!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🌐 Access your services:"
echo ""
echo "   Web App:        http://localhost:3000"
echo "   Keycloak Admin: http://localhost:8080"
echo "   PostgreSQL:     localhost:5432"
echo ""
echo "🔑 Keycloak Admin Credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "📚 Next Steps:"
echo ""
echo "1. Create a test user in Keycloak:"
echo "   • Open http://localhost:8080"
echo "   • Login as admin"
echo "   • Go to Users → Add user"
echo "   • Set username, email, and password"
echo ""
echo "2. Test authentication:"
echo "   • Open http://localhost:3000"
echo "   • Try to sign in"
echo "   • Should redirect to Keycloak"
echo ""
echo "3. View logs:"
echo "   docker-compose logs -f"
echo ""
echo "4. Stop services:"
echo "   docker-compose down"
echo ""
echo "📖 Full testing guide: TESTING_GUIDE.md"
echo ""
echo "✨ Happy testing!"
