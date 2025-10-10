# Installation Checklist

Use this checklist to verify your Church Volunteers setup is complete and working correctly.

## ✅ Pre-Installation

- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Docker Desktop installed and running (`docker --version`)
- [ ] Git installed (`git --version`)

## ✅ Project Setup

- [ ] Repository cloned or created
- [ ] Dependencies installed (`npm install`)
- [ ] No installation errors reported
- [ ] `.env.local` file created from `.env.example`
- [ ] `NEXTAUTH_SECRET` generated and added to `.env.local`

## ✅ Docker Services

- [ ] Docker Compose file exists (`docker-compose.yml`)
- [ ] Services started (`docker-compose up -d`)
- [ ] PostgreSQL running and healthy
- [ ] Keycloak running and healthy
- [ ] Can access Keycloak at http://localhost:8080

## ✅ Keycloak Configuration

- [ ] Logged into Keycloak Admin Console
- [ ] Realm `church-volunteers` created
- [ ] Client `church-volunteers-web` created
- [ ] Client authentication enabled
- [ ] Redirect URIs configured
- [ ] Client secret copied to `.env.local`
- [ ] Test user created

## ✅ Database Setup

- [ ] Connected to PostgreSQL (`docker-compose exec postgres psql -U postgres`)
- [ ] Database `church_volunteers` exists
- [ ] Migration script executed
- [ ] Tables created (users, volunteers, events, volunteer_assignments)
- [ ] Row Level Security enabled
- [ ] Indexes created

## ✅ Git Hooks

- [ ] Husky installed (`npx husky install`)
- [ ] Pre-commit hook exists (`.husky/pre-commit`)
- [ ] Pre-commit hook is executable (`chmod +x .husky/pre-commit`)
- [ ] lint-staged configured (`.lintstagedrc.js`)

## ✅ Development Server

- [ ] Development server starts (`npm run dev`)
- [ ] No compilation errors
- [ ] Application accessible at http://localhost:3000
- [ ] Home page loads correctly

## ✅ Code Quality Tools

- [ ] ESLint runs without errors (`npm run lint`)
- [ ] Prettier configured (`.prettierrc`)
- [ ] TypeScript compiles without errors
- [ ] No type errors in IDE

## ✅ Testing

- [ ] Jest configured (`jest.config.js`)
- [ ] Test setup file exists (`jest.setup.js`)
- [ ] Tests run successfully (`npm test`)
- [ ] Sample tests pass
- [ ] Coverage reports generated (`npm run test:coverage`)

## ✅ Documentation

- [ ] README.md exists and is complete
- [ ] GETTING_STARTED.md exists
- [ ] PROJECT_SUMMARY.md exists
- [ ] docs/SETUP.md exists
- [ ] docs/API.md exists
- [ ] docs/ARCHITECTURE.md exists
- [ ] CONTRIBUTING.md exists
- [ ] LICENSE exists

## ✅ Project Structure

- [ ] `apps/web/` directory exists
- [ ] `packages/` directory with config, types, ui
- [ ] `docs/` directory with documentation
- [ ] `scripts/` directory with setup script
- [ ] `.github/workflows/` with CI configuration

## ✅ Configuration Files

- [ ] `package.json` with correct scripts
- [ ] `tsconfig.json` configured
- [ ] `.eslintrc.json` configured
- [ ] `.prettierrc` configured
- [ ] `next.config.ts` configured
- [ ] `docker-compose.yml` configured
- [ ] `.gitignore` configured
- [ ] `.dockerignore` configured

## ✅ API Routes

- [ ] Auth route exists (`/api/auth/[...nextauth]/route.ts`)
- [ ] Volunteers route exists (`/api/volunteers/route.ts`)
- [ ] Server API functions exist (`src/server/api/volunteers.ts`)
- [ ] Database utilities exist (`src/lib/db.ts`)
- [ ] Middleware configured (`src/middleware.ts`)

## ✅ Security

- [ ] Security headers middleware configured
- [ ] NextAuth.js configured
- [ ] Keycloak provider configured
- [ ] Environment variables secured
- [ ] Row Level Security policies in place
- [ ] SQL injection prevention (parameterized queries)

## ✅ Shared Packages

- [ ] `@church-volunteers/types` package exists
- [ ] `@church-volunteers/config` package exists
- [ ] `@church-volunteers/ui` package exists
- [ ] Type definitions exported
- [ ] Shared components created

## ✅ CI/CD

- [ ] GitHub Actions workflow exists (`.github/workflows/ci.yml`)
- [ ] Lint job configured
- [ ] Test job configured
- [ ] Build job configured
- [ ] Docker build job configured

## ✅ Final Verification

Run these commands to verify everything works:

```bash
# 1. Check services
docker-compose ps

# 2. Run linter
npm run lint

# 3. Run tests
npm test

# 4. Build application
npm run build

# 5. Start development server
npm run dev
```

All should complete successfully! ✅

## Troubleshooting

If any item is unchecked:

1. **Dependencies not installed**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Docker services not running**

   ```bash
   docker-compose down
   docker-compose up -d
   ```

3. **Tests failing**

   ```bash
   npm test -- --verbose
   ```

4. **Lint errors**

   ```bash
   npm run lint -- --fix
   npm run format
   ```

5. **Build errors**
   ```bash
   rm -rf .next
   npm run build
   ```

## Success Criteria

Your installation is complete when:

✅ All checklist items are checked
✅ `npm run dev` starts without errors
✅ http://localhost:3000 loads successfully
✅ `npm test` passes all tests
✅ `npm run lint` reports no errors
✅ Docker services are healthy

## Next Steps

Once all items are checked:

1. Read [GETTING_STARTED.md](GETTING_STARTED.md)
2. Review [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
3. Check [docs/API.md](docs/API.md)
4. Start building features!

---

**Installation Date:** **\*\***\_**\*\***

**Completed By:** **\*\***\_**\*\***

**Notes:** **\*\***\_**\*\***
