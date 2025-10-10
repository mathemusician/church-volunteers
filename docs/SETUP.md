# Setup Guide

## Prerequisites

- Node.js 18+
- Docker & Docker Compose
- Git

## Quick Start

1. **Clone and setup the repository:**

   ```bash
   git clone <repository-url>
   cd church-volunteers
   chmod +x scripts/setup.sh
   ./scripts/setup.sh
   ```

2. **Configure environment variables:**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Keycloak OIDC Setup

### 1. Start Keycloak

```bash
docker-compose up -d keycloak
```

### 2. Access Keycloak Admin Console

- URL: http://localhost:8080
- Username: `admin`
- Password: `admin`

### 3. Create a Realm

1. Click on the dropdown in the top-left corner (currently showing "Master")
2. Click "Create Realm"
3. Name: `church-volunteers`
4. Click "Create"

### 4. Create a Client

1. Go to "Clients" in the left sidebar
2. Click "Create client"
3. Fill in the details:
   - **Client ID**: `church-volunteers-web`
   - **Client Protocol**: `openid-connect`
   - **Root URL**: `http://localhost:3000`
4. Click "Next"
5. Enable the following:
   - **Client authentication**: ON
   - **Authorization**: OFF
   - **Standard flow**: ON
   - **Direct access grants**: ON
6. Click "Next"
7. Add valid redirect URIs:
   - `http://localhost:3000/*`
   - `http://localhost:3000/api/auth/callback/keycloak`
8. Click "Save"

### 5. Get Client Secret

1. Go to the "Credentials" tab of your client
2. Copy the "Client Secret"
3. Add it to your `.env.local`:
   ```
   KEYCLOAK_CLIENT_SECRET=<your-client-secret>
   ```

### 6. Create Test Users

1. Go to "Users" in the left sidebar
2. Click "Add user"
3. Fill in the details and click "Create"
4. Go to the "Credentials" tab
5. Set a password (disable "Temporary")

## PostgreSQL Setup

### 1. Start PostgreSQL

```bash
docker-compose up -d postgres
```

### 2. Run Migrations

```bash
# Connect to the database
docker-compose exec postgres psql -U postgres -d church_volunteers

# Run the migration SQL
\i apps/web/src/server/db/migrations/001_initial_schema.sql
```

### 3. Verify Row Level Security

```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';
```

## Development Workflow

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Linting and Formatting

```bash
# Run ESLint
npm run lint

# Format code with Prettier
npm run format
```

### Git Hooks

Husky is configured to run the following checks before each commit:

- ESLint on staged files
- Prettier formatting on staged files

To bypass hooks (not recommended):

```bash
git commit --no-verify
```

## Docker Deployment

### Build the Docker image

```bash
docker-compose build
```

### Start all services

```bash
docker-compose up -d
```

### View logs

```bash
docker-compose logs -f web
```

### Stop all services

```bash
docker-compose down
```

## Troubleshooting

### Port already in use

If you get a "port already in use" error:

```bash
# Find the process using the port
lsof -i :3000  # or :5432 for PostgreSQL, :8080 for Keycloak

# Kill the process
kill -9 <PID>
```

### Database connection issues

1. Ensure PostgreSQL is running:

   ```bash
   docker-compose ps postgres
   ```

2. Check the logs:

   ```bash
   docker-compose logs postgres
   ```

3. Verify the connection string in `.env.local`

### Keycloak issues

1. Ensure Keycloak is running:

   ```bash
   docker-compose ps keycloak
   ```

2. Check the logs:

   ```bash
   docker-compose logs keycloak
   ```

3. Verify the Keycloak configuration in `.env.local`

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
