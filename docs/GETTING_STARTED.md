# Getting Started with Church Volunteers

This guide will help you get the Church Volunteers Management System up and running on your local machine.

## Prerequisites Checklist

Before you begin, ensure you have the following installed:

- [ ] Node.js 18+ ([Download](https://nodejs.org/))
- [ ] npm (comes with Node.js)
- [ ] Docker Desktop ([Download](https://www.docker.com/products/docker-desktop))
- [ ] Git ([Download](https://git-scm.com/))

Verify installations:

```bash
node --version  # Should be 18+
npm --version
docker --version
git --version
```

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd church-volunteers
npm install
```

This will install all required packages for the monorepo.

### 2. Configure Environment Variables

```bash
# Copy the example environment file
cp .env.example .env.local
```

Edit `.env.local` and update the following (you can use the defaults for local development):

```env
# Database (defaults work for local Docker setup)
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=church_volunteers
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/church_volunteers?schema=public

# Next.js (generate a random secret)
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here-generate-random-string

# Keycloak (will be configured after starting services)
KEYCLOAK_CLIENT_ID=church-volunteers-web
KEYCLOAK_CLIENT_SECRET=will-be-generated
KEYCLOAK_ISSUER=http://localhost:8080/realms/church-volunteers
```

**Generate NEXTAUTH_SECRET:**

```bash
openssl rand -base64 32
```

### 3. Start Docker Services

```bash
# Start PostgreSQL and Keycloak
docker-compose up -d
```

Wait for services to start (about 30 seconds):

```bash
# Check if services are running
docker-compose ps
```

You should see:

- ✅ postgres (healthy)
- ✅ keycloak (healthy)

### 4. Configure Keycloak

#### Access Keycloak Admin Console

1. Open http://localhost:8080
2. Click "Administration Console"
3. Login with:
   - Username: `admin`
   - Password: `admin`

#### Create Realm

1. Click dropdown in top-left (shows "Master")
2. Click "Create Realm"
3. Name: `church-volunteers`
4. Click "Create"

#### Create Client

1. Go to "Clients" in left sidebar
2. Click "Create client"
3. Fill in:
   - **Client ID**: `church-volunteers-web`
   - **Client Protocol**: `openid-connect`
4. Click "Next"
5. Enable:
   - ✅ Client authentication: ON
   - ✅ Standard flow: ON
   - ✅ Direct access grants: ON
6. Click "Next"
7. Add redirect URIs:
   - `http://localhost:3000/*`
   - `http://localhost:3000/api/auth/callback/keycloak`
8. Click "Save"

#### Get Client Secret

1. Go to "Credentials" tab
2. Copy the "Client Secret"
3. Update `.env.local`:
   ```env
   KEYCLOAK_CLIENT_SECRET=<paste-secret-here>
   ```

#### Create Test User

1. Go to "Users" in left sidebar
2. Click "Create new user"
3. Fill in:
   - Username: `testuser`
   - Email: `test@example.com`
   - First name: `Test`
   - Last name: `User`
4. Click "Create"
5. Go to "Credentials" tab
6. Click "Set password"
7. Enter password: `password123`
8. Disable "Temporary": OFF
9. Click "Save"

### 5. Initialize Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d church_volunteers

# In the psql prompt, run the migration
\i /docker-entrypoint-initdb.d/001_initial_schema.sql

# Or copy the SQL file and run it
```

Alternatively, copy and paste the contents of `apps/web/src/server/db/migrations/001_initial_schema.sql` into the psql prompt.

Exit psql:

```sql
\q
```

### 6. Setup Git Hooks

```bash
# Initialize Husky
npx husky install

# Make pre-commit hook executable
chmod +x .husky/pre-commit
```

### 7. Start Development Server

```bash
npm run dev
```

The application will be available at:

- 🌐 Web App: http://localhost:3000
- 🔐 Keycloak: http://localhost:8080
- 🗄️ PostgreSQL: localhost:5432

## Verify Installation

### 1. Check Web Application

- Open http://localhost:3000
- You should see the Next.js welcome page

### 2. Test Authentication

- Navigate to http://localhost:3000/api/auth/signin
- You should be redirected to Keycloak login

### 3. Run Tests

```bash
npm test
```

All tests should pass ✅

### 4. Check Linting

```bash
npm run lint
```

No errors should be reported ✅

## Common Issues & Solutions

### Issue: Port 3000 already in use

**Solution:**

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9
```

### Issue: Docker services won't start

**Solution:**

```bash
# Stop all services
docker-compose down

# Remove volumes and restart
docker-compose down -v
docker-compose up -d
```

### Issue: Cannot connect to PostgreSQL

**Solution:**

1. Check if PostgreSQL is running:
   ```bash
   docker-compose ps postgres
   ```
2. Check logs:
   ```bash
   docker-compose logs postgres
   ```
3. Verify DATABASE_URL in `.env.local`

### Issue: Keycloak not accessible

**Solution:**

1. Wait 30-60 seconds after starting (Keycloak takes time to initialize)
2. Check logs:
   ```bash
   docker-compose logs keycloak
   ```
3. Restart if needed:
   ```bash
   docker-compose restart keycloak
   ```

### Issue: npm install fails

**Solution:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## Development Workflow

### Daily Development

```bash
# 1. Start Docker services (if not running)
docker-compose up -d

# 2. Start development server
npm run dev

# 3. Make changes and test
npm test

# 4. Commit changes (hooks will run automatically)
git add .
git commit -m "feat: your changes"
```

### Before Committing

```bash
# Run linter
npm run lint

# Run tests
npm test

# Format code
npm run format
```

### Stopping Services

```bash
# Stop development server: Ctrl+C

# Stop Docker services
docker-compose down

# Stop and remove volumes (fresh start)
docker-compose down -v
```

## Next Steps

Now that your environment is set up:

1. **Explore the Code**
   - Check out `apps/web/src/app` for pages and API routes
   - Review `packages/` for shared code
   - Read `docs/ARCHITECTURE.md` for system design

2. **Build Features**
   - Follow patterns in existing code
   - Write tests for new features
   - Update documentation

3. **Read Documentation**
   - [API Documentation](docs/API.md)
   - [Setup Guide](docs/SETUP.md)
   - [Architecture](docs/ARCHITECTURE.md)
   - [Contributing](CONTRIBUTING.md)

4. **Join Development**
   - Create a feature branch
   - Make your changes
   - Submit a pull request

## Quick Reference

### Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run start            # Start production server

# Testing
npm test                 # Run tests
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage

# Code Quality
npm run lint             # Run ESLint
npm run format           # Format with Prettier

# Docker
docker-compose up -d     # Start services
docker-compose down      # Stop services
docker-compose logs      # View logs
docker-compose ps        # Check status
```

### Important URLs

- Web App: http://localhost:3000
- Keycloak Admin: http://localhost:8080
- API Docs: [docs/API.md](docs/API.md)

### Default Credentials

- **Keycloak Admin**
  - Username: `admin`
  - Password: `admin`
- **Test User**
  - Username: `testuser`
  - Password: `password123`
- **PostgreSQL**
  - Username: `postgres`
  - Password: `postgres`
  - Database: `church_volunteers`

## Need Help?

- 📖 Check [docs/SETUP.md](docs/SETUP.md) for detailed instructions
- 🐛 Open an issue on GitHub
- 💬 Ask in discussions

---

**You're all set! Happy coding! 🚀**
