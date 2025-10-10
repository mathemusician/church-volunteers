#!/bin/bash

# Church Volunteers Setup Script
echo "🚀 Setting up Church Volunteers Management System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Setup environment variables
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "⚠️  Please update .env.local with your actual configuration values"
else
    echo "✅ .env.local already exists"
fi

# Initialize Husky
echo "🐺 Setting up Husky git hooks..."
npx husky install
chmod +x .husky/pre-commit

# Setup database (if Docker is available)
if command -v docker &> /dev/null; then
    echo "🐳 Docker detected. Starting database services..."
    docker-compose up -d postgres
    
    echo "⏳ Waiting for PostgreSQL to be ready..."
    sleep 5
    
    echo "🗄️  Running database migrations..."
    # Add migration command here when ready
    # npm run migrate
else
    echo "⚠️  Docker not found. Please install Docker to use the database services."
fi

echo ""
echo "✨ Setup complete! Next steps:"
echo "1. Update .env.local with your configuration"
echo "2. Run 'npm run dev' to start the development server"
echo "3. Visit http://localhost:3000"
echo ""
