# Docker Setup Guide

This guide explains the Docker Compose setup for the Church Volunteers application with Keycloak and PostgreSQL.

## 🐳 Services Overview

The `docker-compose.yml` file defines three services:

1. **PostgreSQL** - Database for both the application and Keycloak
2. **Keycloak** - Identity and Access Management (IAM) server
3. **Web** - Next.js application

## 📦 Service Details

### PostgreSQL

- **Image**: `postgres:15-alpine`
- **Port**: `5432`
- **Databases**:
  - `church_volunteers` - Application database
  - `keycloak` - Keycloak database
- **Credentials**: Configured via environment variables

### Keycloak

- **Image**: `quay.io/keycloak/keycloak:23.0`
- **Port**: `8080`
- **Admin Console**: http://localhost:8080
- **Realm**: `church` (pre-configured)
- **Client**: `web` (confidential OIDC client)

#### Pre-configured Features

✅ **Realm Configuration**

- Realm name: `church`
- Display name: "Church Volunteers"
- Enabled with proper security settings

✅ **OIDC Client**

- Client ID: `web`
- Client Type: Confidential
- Protocol: OpenID Connect
- Redirect URIs: `http://localhost:3000/api/auth/callback/keycloak`
- Web Origins: `http://localhost:3000`

✅ **Multi-Factor Authentication (MFA)**

- **OTP (Time-based One-Time Password)**
  - Algorithm: HmacSHA1
  - Digits: 6
  - Period: 30 seconds
  - Enabled via required action: `CONFIGURE_TOTP`

- **WebAuthn (Hardware Keys/Biometrics)**
  - Signature algorithms: ES256, RS256
  - Enabled via required actions:
    - `webauthn-register` - Standard WebAuthn
    - `webauthn-register-passwordless` - Passwordless WebAuthn

✅ **Event Logging**

- **User Events**: Enabled
  - All authentication events logged
  - Login, logout, registration, password changes
  - MFA enrollment and usage
  - Profile updates

- **Admin Events**: Enabled with details
  - All administrative actions logged
  - User management operations
  - Client configuration changes
  - Realm modifications

✅ **Security Features**

- Brute force protection enabled
- Remember me functionality
- Password reset allowed
- Secure browser headers configured
- Session management with timeouts

✅ **Roles**

- `admin` - Full administrative access
- `coordinator` - Volunteer coordinator role
- `volunteer` - Default volunteer role

### Web Application

- **Port**: `3000`
- **URL**: http://localhost:3000
- **Dependencies**: PostgreSQL and Keycloak must be healthy

## 🚀 Quick Start

### 1. Start Services

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check service status
docker-compose ps
```

### 2. Wait for Services

Services will start in order:

1. PostgreSQL (5-10 seconds)
2. Keycloak (30-60 seconds)
3. Web application (after Keycloak is ready)

### 3. Access Services

- **Keycloak Admin**: http://localhost:8080
  - Username: `admin`
  - Password: `admin`

- **Web Application**: http://localhost:3000

## 🔧 Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
cp .env.example .env.local
```

Key variables:

- `POSTGRES_USER` - Database user
- `POSTGRES_PASSWORD` - Database password
- `KEYCLOAK_CLIENT_SECRET` - Get from Keycloak admin console
- `NEXTAUTH_SECRET` - Generate with `openssl rand -base64 32`

### Get Keycloak Client Secret

1. Login to Keycloak admin console: http://localhost:8080
2. Navigate to: **Clients** → **web** → **Credentials** tab
3. Copy the **Client Secret** value
4. Update `KEYCLOAK_CLIENT_SECRET` in `.env.local`

## 🔐 Multi-Factor Authentication Setup

### For Users

#### OTP (Authenticator App)

1. Login to the application
2. Go to Account Settings
3. Click "Configure OTP"
4. Scan QR code with authenticator app (Google Authenticator, Authy, etc.)
5. Enter verification code
6. OTP is now enabled

#### WebAuthn (Hardware Key/Biometrics)

1. Login to the application
2. Go to Account Settings
3. Click "Register Security Key"
4. Follow browser prompts to register device
5. WebAuthn is now enabled

### For Administrators

#### Require MFA for Users

1. Login to Keycloak admin console
2. Go to **Authentication** → **Required Actions**
3. Enable and set as default:
   - `Configure OTP` - For TOTP
   - `Webauthn Register` - For hardware keys

#### Configure MFA Policies

1. Go to **Authentication** → **Policies**
2. Configure OTP Policy:
   - Type: Time-based
   - Algorithm: HmacSHA1
   - Digits: 6
   - Period: 30 seconds

3. Configure WebAuthn Policy:
   - Signature Algorithms: ES256, RS256
   - User Verification: Required

## 📊 Event Logging

### View User Events

1. Login to Keycloak admin console
2. Go to **Events** → **Login Events**
3. View all user authentication events

Logged events include:

- Login attempts (success/failure)
- Logout events
- Password changes
- MFA enrollment
- Profile updates
- Token exchanges

### View Admin Events

1. Login to Keycloak admin console
2. Go to **Events** → **Admin Events**
3. View all administrative actions

Logged events include:

- User creation/deletion
- Role assignments
- Client configuration changes
- Realm modifications

### Export Events

Events are persisted in the Keycloak database and can be:

- Viewed in the admin console
- Exported via REST API
- Integrated with external logging systems

## 🗄️ Database Management

### Access PostgreSQL

```bash
# Connect to PostgreSQL container
docker-compose exec postgres psql -U postgres

# List databases
\l

# Connect to application database
\c church_volunteers

# List tables
\dt

# Connect to Keycloak database
\c keycloak
```

### Run Migrations

```bash
# Run application migrations
docker-compose exec postgres psql -U postgres -d church_volunteers < apps/web/src/server/db/migrations/001_initial_schema.sql
```

### Backup Database

```bash
# Backup application database
docker-compose exec postgres pg_dump -U postgres church_volunteers > backup.sql

# Restore database
docker-compose exec -T postgres psql -U postgres church_volunteers < backup.sql
```

## 🔄 Realm Import/Export

### Export Realm Configuration

The realm is automatically imported on startup from:

```
docker/keycloak/realm-export.json
```

### Manual Export

```bash
# Export realm via Keycloak admin console
# 1. Login to admin console
# 2. Select "church" realm
# 3. Go to "Realm Settings" → "Action" → "Partial Export"
# 4. Select options and download
```

### Update Realm Configuration

1. Edit `docker/keycloak/realm-export.json`
2. Restart Keycloak:
   ```bash
   docker-compose restart keycloak
   ```

## 🛠️ Troubleshooting

### Keycloak Not Starting

```bash
# Check logs
docker-compose logs keycloak

# Common issues:
# - PostgreSQL not ready (wait longer)
# - Port 8080 already in use
# - Invalid realm configuration
```

### Database Connection Issues

```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Verify connection
docker-compose exec postgres pg_isready -U postgres
```

### Web Application Issues

```bash
# Check web logs
docker-compose logs web

# Rebuild web container
docker-compose up -d --build web
```

### Reset Everything

```bash
# Stop and remove all containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

## 📝 Common Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f [service]

# Restart service
docker-compose restart [service]

# Rebuild service
docker-compose up -d --build [service]

# Execute command in container
docker-compose exec [service] [command]

# Remove volumes (WARNING: deletes data)
docker-compose down -v
```

## 🔒 Security Best Practices

### For Development

✅ Use strong admin passwords
✅ Enable MFA for admin accounts
✅ Review event logs regularly
✅ Keep Keycloak updated

### For Production

✅ Use HTTPS/TLS
✅ Change default passwords
✅ Use secrets management
✅ Enable audit logging
✅ Configure backup strategy
✅ Use external database
✅ Enable monitoring
✅ Restrict network access

## 📚 Additional Resources

- [Keycloak Documentation](https://www.keycloak.org/documentation)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NextAuth.js Documentation](https://next-auth.js.org/)

## 🆘 Support

For issues or questions:

1. Check the logs: `docker-compose logs -f`
2. Review this documentation
3. Check Keycloak admin console
4. Verify environment variables
