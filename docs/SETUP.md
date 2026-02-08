# Setup Guide

## Prerequisites

- Node.js 18+
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

## Database Setup

This project uses **Neon** (serverless PostgreSQL) for the database. The connection is already configured in `.env.local`.

To run migrations, use the Neon dashboard SQL editor or connect via `psql`:

```bash
psql "$DATABASE_URL" -f apps/web/src/server/db/migrations/001_initial_schema.sql
```

## Authentication

This project uses **Zitadel Cloud** for authentication. The credentials are pre-configured in `.env.local`.

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

## Troubleshooting

### Port already in use

If you get a "port already in use" error:

```bash
# Find the process using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Database connection issues

1. Verify the `DATABASE_URL` in `.env.local` is correct
2. Check that your IP is allowed in the Neon dashboard
3. Test the connection: `psql "$DATABASE_URL"`

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Neon Documentation](https://neon.tech/docs)
- [Zitadel Documentation](https://zitadel.com/docs)
