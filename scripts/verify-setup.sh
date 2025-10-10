#!/bin/bash

# Church Volunteers Setup Verification Script
# This script verifies that the project is set up correctly

echo "🔍 Church Volunteers Setup Verification"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counters
PASSED=0
FAILED=0

# Function to check and report
check() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $1"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $1"
        ((FAILED++))
    fi
}

# Check Node.js
echo "📦 Checking Prerequisites..."
node --version > /dev/null 2>&1
check "Node.js installed"

npm --version > /dev/null 2>&1
check "npm installed"

docker --version > /dev/null 2>&1
check "Docker installed"

git --version > /dev/null 2>&1
check "Git installed"

echo ""
echo "📁 Checking Project Structure..."

# Check important files
[ -f "package.json" ]
check "package.json exists"

[ -f "tsconfig.json" ]
check "tsconfig.json exists"

[ -f ".eslintrc.json" ]
check ".eslintrc.json exists"

[ -f ".prettierrc" ]
check ".prettierrc exists"

[ -f "docker-compose.yml" ]
check "docker-compose.yml exists"

[ -f ".env.example" ]
check ".env.example exists"

[ -f "jest.config.js" ]
check "jest.config.js exists"

echo ""
echo "📂 Checking Directories..."

[ -d "apps/web" ]
check "apps/web directory exists"

[ -d "packages" ]
check "packages directory exists"

[ -d "docs" ]
check "docs directory exists"

[ -d ".github/workflows" ]
check ".github/workflows directory exists"

echo ""
echo "🔧 Checking Configuration Files..."

[ -f "apps/web/next.config.ts" ]
check "Next.js config exists"

[ -f "apps/web/package.json" ]
check "Web app package.json exists"

[ -f ".husky/pre-commit" ]
check "Husky pre-commit hook exists"

echo ""
echo "📝 Checking Documentation..."

[ -f "README.md" ]
check "README.md exists"

[ -f "GETTING_STARTED.md" ]
check "GETTING_STARTED.md exists"

[ -f "docs/SETUP.md" ]
check "docs/SETUP.md exists"

[ -f "docs/API.md" ]
check "docs/API.md exists"

[ -f "docs/ARCHITECTURE.md" ]
check "docs/ARCHITECTURE.md exists"

echo ""
echo "🐳 Checking Docker Services..."

if command -v docker-compose &> /dev/null; then
    docker-compose ps | grep -q "postgres.*Up"
    check "PostgreSQL service running"
    
    docker-compose ps | grep -q "keycloak.*Up"
    check "Keycloak service running"
else
    echo -e "${YELLOW}⚠${NC} Docker Compose not available, skipping service checks"
fi

echo ""
echo "🧪 Checking Dependencies..."

[ -d "node_modules" ]
check "node_modules directory exists"

[ -f "package-lock.json" ]
check "package-lock.json exists"

echo ""
echo "🔐 Checking Environment..."

if [ -f ".env.local" ]; then
    echo -e "${GREEN}✓${NC} .env.local exists"
    ((PASSED++))
    
    if grep -q "NEXTAUTH_SECRET=your-nextauth-secret-here" .env.local; then
        echo -e "${YELLOW}⚠${NC} Warning: NEXTAUTH_SECRET not configured"
    fi
    
    if grep -q "KEYCLOAK_CLIENT_SECRET=your-client-secret" .env.local; then
        echo -e "${YELLOW}⚠${NC} Warning: KEYCLOAK_CLIENT_SECRET not configured"
    fi
else
    echo -e "${RED}✗${NC} .env.local does not exist"
    echo -e "${YELLOW}  Run: cp .env.example .env.local${NC}"
    ((FAILED++))
fi

echo ""
echo "========================================"
echo "📊 Verification Summary"
echo "========================================"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✨ All checks passed! Your setup is complete.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure .env.local with your values"
    echo "2. Run: npm run dev"
    echo "3. Visit: http://localhost:3000"
    exit 0
else
    echo -e "${RED}❌ Some checks failed. Please review the errors above.${NC}"
    echo ""
    echo "Common fixes:"
    echo "- Run: npm install"
    echo "- Run: docker-compose up -d"
    echo "- Run: cp .env.example .env.local"
    exit 1
fi
