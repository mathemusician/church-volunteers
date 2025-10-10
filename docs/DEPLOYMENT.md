# 🚀 Production Deployment Guide

Deploy Church Volunteers to: **Vercel + Fly.io + Neon**

## 🎯 Architecture

- **Next.js App** → Vercel (Free tier)
- **Keycloak** → Fly.io (Free tier)
- **PostgreSQL** → Neon (Free tier)

All free tiers available! 🎉

---

## Step 1: Deploy PostgreSQL to Neon

### 1.1 Create Neon Account

1. Go to https://neon.tech
2. Sign up (free tier: 10GB storage, 1 project)
3. Create new project: `church-volunteers`

### 1.2 Create Databases

```sql
-- In Neon SQL Editor:

-- Database for application (already created as default)
-- Database for Keycloak
CREATE DATABASE keycloak;
```

### 1.3 Get Connection Strings

From Neon dashboard, copy both connection strings:

```bash
# Application database
postgresql://user:password@ep-xxx.region.aws.neon.tech/church_volunteers?sslmode=require

# Keycloak database
postgresql://user:password@ep-xxx.region.aws.neon.tech/keycloak?sslmode=require
```

### 1.4 Run Migrations

```bash
# Connect to Neon
psql "postgresql://user:password@ep-xxx.region.aws.neon.tech/church_volunteers?sslmode=require"

# Run migration
\i apps/web/src/server/db/migrations/001_initial_schema.sql

# Exit
\q
```

---

## Step 2: Deploy Keycloak to Fly.io

### 2.1 Install Fly CLI

```bash
# macOS
brew install flyctl

# Or via curl
curl -L https://fly.io/install.sh | sh

# Login
flyctl auth login
```

### 2.2 Create Keycloak Dockerfile

Create `docker/keycloak/Dockerfile`:

```dockerfile
FROM quay.io/keycloak/keycloak:23.0

# Copy realm configuration
COPY realm-export.json /opt/keycloak/data/import/

# Set environment for production
ENV KC_HEALTH_ENABLED=true
ENV KC_METRICS_ENABLED=true
ENV KC_HTTP_RELATIVE_PATH=/

# Production optimized start
ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
CMD ["start", "--optimized", "--import-realm"]
```

### 2.3 Create fly.toml

```bash
# Initialize Fly app
cd docker/keycloak
flyctl launch --no-deploy

# This creates fly.toml
```

Edit the generated `fly.toml`:

```toml
app = "church-volunteers-keycloak"
primary_region = "iad"

[build]
  dockerfile = "Dockerfile"

[env]
  KC_HOSTNAME_STRICT = "false"
  KC_PROXY = "edge"
  KC_HTTP_ENABLED = "true"
  KC_HEALTH_ENABLED = "true"
  KC_METRICS_ENABLED = "true"
  KC_LOG_LEVEL = "INFO"

[[services]]
  internal_port = 8080
  protocol = "tcp"

  [[services.ports]]
    port = 80
    handlers = ["http"]

  [[services.ports]]
    port = 443
    handlers = ["tls", "http"]

  [services.concurrency]
    type = "connections"
    hard_limit = 25
    soft_limit = 20

  [[services.tcp_checks]]
    interval = "15s"
    timeout = "2s"
    grace_period = "10s"

  [[services.http_checks]]
    interval = "10s"
    timeout = "2s"
    grace_period = "5s"
    method = "get"
    path = "/health/ready"
    protocol = "http"

[http_service]
  internal_port = 8080
  force_https = true
  auto_stop_machines = true
  auto_start_machines = true
  min_machines_running = 0
```

### 2.4 Set Secrets

```bash
# Set environment variables
flyctl secrets set KEYCLOAK_ADMIN=admin
flyctl secrets set KEYCLOAK_ADMIN_PASSWORD=<strong-password>
flyctl secrets set KC_DB=postgres
flyctl secrets set KC_DB_URL="jdbc:postgresql://ep-xxx.region.aws.neon.tech/keycloak?sslmode=require"
flyctl secrets set KC_DB_USERNAME=your-neon-user
flyctl secrets set KC_DB_PASSWORD=your-neon-password
flyctl secrets set KC_HOSTNAME=church-volunteers-keycloak.fly.dev
flyctl secrets set KC_HOSTNAME_STRICT=false
```

### 2.5 Deploy Keycloak

# Deploy to Fly.io

flyctl deploy

# Get your Keycloak URL

flyctl info

# Example: https://church-volunteers-keycloak.fly.dev

````

### 2.6 Configure Keycloak Realm

1. Open your Keycloak URL: `https://church-volunteers-keycloak.fly.dev`
2. Login with admin credentials
3. Go to **Clients** → **web**
4. Update redirect URIs (you'll add Vercel URL after deployment)
5. Get client secret from **Credentials** tab

---

## Step 3: Deploy Next.js to Vercel

### 3.1 Prepare for Vercel

Create `vercel.json` in project root:

```json
{
  "buildCommand": "cd apps/web && npm run build",
  "outputDirectory": "apps/web/.next",
  "framework": "nextjs",
  "installCommand": "npm install",
  "devCommand": "cd apps/web && npm run dev"
}
````

### 3.2 Push to GitHub

```bash
# Initialize git (if not done)
git add .
git commit -m "feat: initial setup with Keycloak, PostgreSQL, and Next.js"

# Create GitHub repo and push
git remote add origin https://github.com/YOUR_USERNAME/church-volunteers.git
git branch -M main
git push -u origin main
```

### 3.3 Deploy to Vercel

**Option A: Via Vercel Dashboard**

1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Import your `church-volunteers` repository
5. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `apps/web`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

**Option B: Via CLI**

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy from apps/web
cd apps/web
vercel

# Follow prompts
```

### 3.4 Set Environment Variables in Vercel

In Vercel dashboard → Settings → Environment Variables:

```bash
# Database
DATABASE_URL=postgresql://user:password@ep-xxx.region.aws.neon.tech/church_volunteers?sslmode=require

# NextAuth
NEXTAUTH_URL=https://your-app.vercel.app
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>

# Keycloak
KEYCLOAK_CLIENT_ID=web
KEYCLOAK_CLIENT_SECRET=<from-keycloak-credentials-tab>
KEYCLOAK_ISSUER=https://church-volunteers-keycloak.fly.dev/realms/church

# Optional
NODE_ENV=production
```

### 3.5 Redeploy

```bash
# Trigger redeployment with env vars
vercel --prod
```

---

## Step 4: Update Keycloak Configuration

### 4.1 Update Redirect URIs

1. Open Keycloak: `https://church-volunteers-keycloak.fly.dev`
2. Login as admin
3. Go to **Clients** → **web**
4. Update **Valid redirect URIs**:
   ```
   https://your-app.vercel.app/*
   https://your-app.vercel.app/api/auth/callback/keycloak
   ```
5. Update **Web origins**:
   ```
   https://your-app.vercel.app
   ```
6. Save

### 4.2 Update Valid Post Logout Redirect URIs

```
https://your-app.vercel.app/*
```

---

## Step 5: Test Your Deployment

### 5.1 Verify Services

```bash
# Test Keycloak
curl https://church-volunteers-keycloak.fly.dev/health/ready

# Test Neon database
psql "your-neon-connection-string" -c "SELECT version();"

# Test Vercel app
curl https://your-app.vercel.app
```

### 5.2 Create Test User

1. Open Keycloak admin console
2. Go to **Users** → **Add user**
3. Create test user with credentials
4. Assign role: `volunteer`

### 5.3 Test Authentication

1. Open: `https://your-app.vercel.app`
2. Navigate to sign in
3. Should redirect to Keycloak
4. Login with test user
5. Should redirect back to app
6. Verify session works

### 5.4 Test MFA

1. Enable OTP for test user
2. Login and scan QR code
3. Enter verification code
4. Verify access granted

### 5.5 Check Event Logs

1. Login to Keycloak admin
2. Go to **Events** → **Login Events**
3. Verify events are logged
4. Check **Admin Events** too

---

## 📊 Deployment Summary

| Service        | Platform | URL                                          | Cost |
| -------------- | -------- | -------------------------------------------- | ---- |
| **Next.js**    | Vercel   | `https://your-app.vercel.app`                | Free |
| **Keycloak**   | Fly.io   | `https://church-volunteers-keycloak.fly.dev` | Free |
| **PostgreSQL** | Neon     | Connection string                            | Free |

### Free Tier Limits

**Vercel:**

- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS
- Global CDN

**Fly.io:**

- 3 shared-cpu VMs
- 160GB bandwidth/month
- Automatic HTTPS
- Global regions

**Neon:**

- 10GB storage
- 1 project
- Unlimited queries
- Automatic backups

---

## 🔧 Post-Deployment Configuration

### Update Environment Variables

**In Vercel:**

```bash
# Update via dashboard or CLI
vercel env add KEYCLOAK_ISSUER production
# Enter: https://church-volunteers-keycloak.fly.dev/realms/church
```

**In Fly.io:**

```bash
flyctl secrets set KC_HOSTNAME=church-volunteers-keycloak.fly.dev
```

### Enable Production Features

**In Keycloak:**

1. Disable "Remember Me" (optional)
2. Enable email verification
3. Configure SMTP for emails
4. Set up stronger password policies
5. Enable additional security features

---

## 🐛 Troubleshooting

### Keycloak won't start on Fly.io

```bash
# Check logs
flyctl logs

# Check status
flyctl status

# Restart
flyctl apps restart church-volunteers-keycloak
```

### Vercel build fails

```bash
# Check build logs in Vercel dashboard
# Common issues:
# - Missing environment variables
# - Build command incorrect
# - Dependencies not installed
```

### Database connection fails

```bash
# Verify Neon connection string
# Check if IP is whitelisted (Neon allows all by default)
# Verify SSL mode is set to 'require'
```

### Authentication not working

```bash
# Verify redirect URIs match exactly
# Check KEYCLOAK_ISSUER URL
# Verify client secret is correct
# Check Vercel environment variables
```

---

## 🔒 Security Checklist

Before going live:

- [ ] Change Keycloak admin password
- [ ] Generate strong NEXTAUTH_SECRET
- [ ] Use strong database password
- [ ] Enable HTTPS everywhere
- [ ] Configure CORS properly
- [ ] Set up rate limiting
- [ ] Enable Vercel password protection (optional)
- [ ] Review Keycloak security settings
- [ ] Enable email verification
- [ ] Configure session timeouts

---

## 📈 Monitoring

### Vercel

- Dashboard: https://vercel.com/dashboard
- View deployments, logs, analytics
- Monitor performance

### Fly.io

```bash
# View logs
flyctl logs

# Check metrics
flyctl dashboard
```

### Neon

- Dashboard: https://console.neon.tech
- Monitor queries, storage, connections
- View metrics

---

## 🎯 Quick Deployment Commands

```bash
# 1. Deploy Keycloak to Fly.io
cd docker/keycloak
flyctl launch
flyctl deploy

# 2. Deploy Next.js to Vercel
cd apps/web
vercel --prod

# 3. Update Keycloak redirect URIs
# (via admin console)

# 4. Test!
curl https://your-app.vercel.app
```

---

## ✨ You're Live!

Your church volunteers app is now deployed and accessible worldwide with:

- ✅ Vercel hosting (Next.js)
- ✅ Fly.io hosting (Keycloak)
- ✅ Neon database (PostgreSQL)
- ✅ HTTPS everywhere
- ✅ MFA enabled
- ✅ Event logging active
- ✅ Production ready

**Share your Vercel URL and start testing!** 🎉
