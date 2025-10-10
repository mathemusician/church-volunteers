# 🐳 Docker Quick Start Guide

Get the Church Volunteers application running with Docker in 5 minutes!

## Prerequisites

- Docker Desktop installed and running
- 8GB+ RAM available
- Ports 3000, 5432, and 8080 available

## 🚀 Quick Start (3 Steps)

### Step 1: Configure Environment

```bash
# Copy environment template
cp .env.example .env.local

# Generate NextAuth secret
openssl rand -base64 32

# Edit .env.local and paste the generated secret
# Update NEXTAUTH_SECRET=<paste-generated-secret-here>
```

### Step 2: Start Services

```bash
# Start all services (PostgreSQL, Keycloak, Web)
docker-compose up -d

# Wait for services to be ready (30-60 seconds)
docker-compose logs -f keycloak
# Press Ctrl+C when you see "Keycloak ... started"
```

### Step 3: Get Keycloak Client Secret

```bash
# Run the helper script
./scripts/get-keycloak-secret.sh

# Or manually:
# 1. Open http://localhost:8080
# 2. Login: admin / admin
# 3. Go to: Clients → web → Credentials
# 4. Copy the Client Secret
# 5. Update .env.local: KEYCLOAK_CLIENT_SECRET=<secret>
```

## ✅ Verify Installation

```bash
# Check all services are running
docker-compose ps

# Should show:
# - church-volunteers-postgres (healthy)
# - church-volunteers-keycloak (healthy)
# - church-volunteers-web (Up)
```

## 🌐 Access Services

| Service            | URL                   | Credentials         |
| ------------------ | --------------------- | ------------------- |
| **Web App**        | http://localhost:3000 | Via Keycloak        |
| **Keycloak Admin** | http://localhost:8080 | admin / admin       |
| **PostgreSQL**     | localhost:5432        | postgres / postgres |

## 🔐 Pre-configured Features

### Keycloak Setup

✅ **Realm**: `church`

- Pre-configured and ready to use
- Secure default settings

✅ **OIDC Client**: `web`

- Confidential client
- Redirect URI: `http://localhost:3000/api/auth/callback/keycloak`
- Web Origins: `http://localhost:3000`

✅ **Multi-Factor Authentication**

- **OTP**: Time-based one-time passwords (Google Authenticator, Authy)
- **WebAuthn**: Hardware keys (YubiKey, Touch ID, Face ID)

✅ **Event Logging**

- All user login/logout events
- All admin actions
- Persistent storage

✅ **Roles**

- `admin` - Full access
- `coordinator` - Manage volunteers
- `volunteer` - Basic access

### Database Setup

✅ **Two Databases**

- `church_volunteers` - Application data
- `keycloak` - Identity data

✅ **Row Level Security**

- Pre-configured policies
- User-based data isolation

## 👤 Create Your First User

### Via Keycloak Admin Console

1. Open http://localhost:8080
2. Login as admin
3. Go to **Users** → **Add user**
4. Fill in details:
   - Username: `testuser`
   - Email: `test@example.com`
   - First name: `Test`
   - Last name: `User`
5. Click **Create**
6. Go to **Credentials** tab
7. Set password: `password123`
8. Disable "Temporary": OFF
9. Click **Set password**

### Assign Roles

1. Go to **Role Mappings** tab
2. Select role: `volunteer` (or `admin`, `coordinator`)
3. Click **Assign**

### Enable MFA (Optional)

1. Go to **Required Actions** tab
2. Add action: `Configure OTP`
3. User will be prompted to set up MFA on first login

## 🧪 Test Authentication

1. Open http://localhost:3000
2. Click "Sign In"
3. You'll be redirected to Keycloak
4. Login with your test user
5. If MFA is enabled, scan QR code with authenticator app
6. You'll be redirected back to the app

## 📊 View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f keycloak
docker-compose logs -f postgres
docker-compose logs -f web

# Last 100 lines
docker-compose logs --tail=100 keycloak
```

## 🛠️ Common Tasks

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart keycloak
```

### Stop Services

```bash
# Stop all (keeps data)
docker-compose down

# Stop and remove data
docker-compose down -v
```

### Update Configuration

```bash
# After changing .env.local
docker-compose up -d

# After changing realm-export.json
docker-compose restart keycloak
```

### Access Database

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres

# List databases
\l

# Connect to app database
\c church_volunteers

# List tables
\dt

# Exit
\q
```

### Run Migrations

```bash
# Run database migrations
docker-compose exec postgres psql -U postgres -d church_volunteers -f /path/to/migration.sql
```

## 🐛 Troubleshooting

### Keycloak Won't Start

```bash
# Check if PostgreSQL is ready
docker-compose ps postgres

# View Keycloak logs
docker-compose logs keycloak

# Wait longer (Keycloak takes 30-60 seconds)
```

### Port Already in Use

```bash
# Check what's using the port
lsof -i :8080  # or :3000, :5432

# Kill the process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Can't Login to Keycloak

- Default credentials: `admin` / `admin`
- URL: http://localhost:8080 (not https)
- Wait for service to be fully started

### Web App Can't Connect

1. Check `.env.local` has correct values
2. Verify Keycloak client secret is set
3. Restart web service: `docker-compose restart web`

### Database Connection Failed

```bash
# Check PostgreSQL is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Verify DATABASE_URL in .env.local
```

## 🔄 Reset Everything

```bash
# Stop and remove everything
docker-compose down -v

# Start fresh
docker-compose up -d

# Get new client secret
./scripts/get-keycloak-secret.sh
```

## 📚 Next Steps

1. **Configure MFA**: See [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md)
2. **Create Users**: Via Keycloak admin console
3. **Run Migrations**: Set up database schema
4. **Customize Realm**: Edit `docker/keycloak/realm-export.json`
5. **Deploy**: See production deployment guide

## 🆘 Need Help?

- **Full Documentation**: [docs/DOCKER_SETUP.md](docs/DOCKER_SETUP.md)
- **Keycloak Docs**: https://www.keycloak.org/documentation
- **Check Logs**: `docker-compose logs -f`
- **Verify Services**: `docker-compose ps`

## ✨ What's Included

- ✅ PostgreSQL 15 with two databases
- ✅ Keycloak 23 with pre-configured realm
- ✅ Next.js 15 application
- ✅ OIDC authentication ready
- ✅ MFA (OTP + WebAuthn) enabled
- ✅ Event logging configured
- ✅ Row Level Security policies
- ✅ Docker networking configured
- ✅ Health checks enabled
- ✅ Persistent data volumes

---

**Ready to go!** 🎉

Your church volunteers management system is now running with enterprise-grade authentication and security!
