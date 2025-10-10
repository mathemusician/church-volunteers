# 🧪 Testing Guide - Current Setup

This guide helps you test what's been built so far, even before everything is complete.

## 🎯 What We Can Test Now

### ✅ Ready to Test

- Docker Compose setup
- PostgreSQL database
- Keycloak authentication server
- Keycloak realm and client configuration
- MFA setup (OTP and WebAuthn)
- Event logging
- Basic Next.js app structure

### ⏳ Not Yet Built

- Full volunteer management features
- Complete UI/UX
- All API endpoints
- Database migrations
- Full integration

## 🚀 Quick Test Setup (Local)

### Step 1: Start Services

```bash
# 1. Configure environment
cp .env.example .env.local

# 2. Generate NextAuth secret
echo "NEXTAUTH_SECRET=$(openssl rand -base64 32)" >> .env.local

# 3. Start Docker services
docker-compose up -d

# 4. Wait for services (30-60 seconds)
docker-compose logs -f keycloak
# Wait until you see "Keycloak ... started"
# Press Ctrl+C

# 5. Get Keycloak client secret
./scripts/get-keycloak-secret.sh
```

### Step 2: Verify Services

```bash
# Check all services are running
docker-compose ps

# Should show all healthy:
# ✅ church-volunteers-postgres (healthy)
# ✅ church-volunteers-keycloak (healthy)
# ✅ church-volunteers-web (Up)
```

### Step 3: Test Keycloak

**Access Keycloak Admin Console:**

1. Open: http://localhost:8080
2. Login: `admin` / `admin`
3. Verify realm `church` exists
4. Check client `web` is configured
5. Verify redirect URIs are set

**Create Test User:**

1. Go to **Users** → **Add user**
2. Username: `testuser`
3. Email: `test@example.com`
4. Click **Create**
5. Go to **Credentials** tab
6. Set password: `Test123!`
7. Disable "Temporary"
8. Click **Set password**

**Assign Role:**

1. Go to **Role Mappings** tab
2. Assign role: `volunteer`

### Step 4: Test Authentication Flow

```bash
# Start the web app (if not already running)
cd apps/web
npm install
npm run dev
```

**Test Login:**

1. Open: http://localhost:3000
2. The app should load (even if basic)
3. Try accessing: http://localhost:3000/api/auth/signin
4. Should redirect to Keycloak login
5. Login with test user
6. Should redirect back to app

### Step 5: Test MFA

**Enable OTP for User:**

1. Login to Keycloak admin
2. Go to **Users** → Select user
3. Go to **Required Actions** tab
4. Add action: `Configure OTP`
5. Click **Save**

**Test OTP Setup:**

1. Logout from app
2. Login again
3. Should be prompted to set up OTP
4. Scan QR code with Google Authenticator or Authy
5. Enter verification code
6. OTP is now enabled

**Test WebAuthn:**

1. Go to **Required Actions**
2. Add action: `Webauthn Register`
3. Login again
4. Follow prompts to register security key/biometric

### Step 6: Test Event Logging

**View User Events:**

1. Login to Keycloak admin
2. Go to **Events** → **Login Events**
3. Verify you see login attempts
4. Check event details

**View Admin Events:**

1. Go to **Events** → **Admin Events**
2. Verify you see user creation
3. Check role assignments

## 🌐 Deploy to Test Online (Quick Options)

### Option 1: Railway (Easiest)

**Setup:**

1. Create account at https://railway.app
2. Install Railway CLI:

   ```bash
   npm install -g @railway/cli
   ```

3. Login and deploy:

   ```bash
   railway login
   railway init
   railway up
   ```

4. Set environment variables in Railway dashboard
5. Get deployment URL

**Pros:**

- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ Easy database setup
- ✅ Quick deployment

**Cons:**

- ⚠️ Need to configure Keycloak separately
- ⚠️ May need paid tier for all services

### Option 2: Render (Good for Testing)

**Setup:**

1. Create account at https://render.com
2. Create `render.yaml`:

```yaml
services:
  - type: web
    name: church-volunteers-web
    env: docker
    dockerfilePath: ./apps/web/Dockerfile
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: NEXTAUTH_SECRET
        generateValue: true
      - key: KEYCLOAK_ISSUER
        value: https://your-keycloak-url/realms/church

  - type: pserv
    name: church-volunteers-postgres
    env: docker
    dockerfilePath: ./docker/postgres/Dockerfile
    disk:
      name: postgres-data
      mountPath: /var/lib/postgresql/data
```

3. Connect GitHub repo
4. Deploy

**Pros:**

- ✅ Free tier available
- ✅ Automatic HTTPS
- ✅ PostgreSQL included
- ✅ Easy setup

**Cons:**

- ⚠️ Keycloak needs separate hosting
- ⚠️ May spin down on free tier

### Option 3: DigitalOcean App Platform

**Setup:**

1. Create account at https://www.digitalocean.com
2. Create new App
3. Connect GitHub repo
4. Configure services:
   - Web service (Next.js)
   - Database (PostgreSQL)
5. Set environment variables
6. Deploy

**Pros:**

- ✅ Full control
- ✅ Good performance
- ✅ Managed database
- ✅ Easy scaling

**Cons:**

- ⚠️ No free tier
- ⚠️ ~$12/month minimum

### Option 4: Quick Test with ngrok (Immediate)

**For immediate testing without deployment:**

```bash
# 1. Install ngrok
brew install ngrok  # or download from ngrok.com

# 2. Start your local services
docker-compose up -d
cd apps/web && npm run dev

# 3. Expose to internet
ngrok http 3000
```

**Update Keycloak:**

1. Copy ngrok URL (e.g., `https://abc123.ngrok.io`)
2. Login to Keycloak admin
3. Go to **Clients** → **web**
4. Update redirect URIs:
   - Add: `https://abc123.ngrok.io/*`
   - Add: `https://abc123.ngrok.io/api/auth/callback/keycloak`
5. Update web origins: `https://abc123.ngrok.io`
6. Save

**Update .env.local:**

```bash
NEXTAUTH_URL=https://abc123.ngrok.io
```

**Test:**

- Share ngrok URL with others
- They can test authentication
- You can see it working live

**Pros:**

- ✅ Immediate (5 minutes)
- ✅ Free
- ✅ No deployment needed
- ✅ Great for quick demos

**Cons:**

- ⚠️ URL changes each time
- ⚠️ Requires local machine running
- ⚠️ Not for production

## 🧪 Test Checklist

### Basic Functionality

- [ ] Docker services start successfully
- [ ] Keycloak admin console accessible
- [ ] PostgreSQL accepting connections
- [ ] Web app loads
- [ ] No console errors

### Authentication

- [ ] Can access login page
- [ ] Redirects to Keycloak
- [ ] Can login with test user
- [ ] Redirects back to app
- [ ] Session persists
- [ ] Can logout

### MFA Testing

- [ ] OTP setup works
- [ ] Can login with OTP
- [ ] WebAuthn registration works
- [ ] Can login with WebAuthn
- [ ] Can use backup codes

### Event Logging

- [ ] Login events recorded
- [ ] Logout events recorded
- [ ] Admin events recorded
- [ ] Event details visible
- [ ] Events persist

### Database

- [ ] Can connect to PostgreSQL
- [ ] Both databases exist
- [ ] Can query data
- [ ] Connections pooled properly

## 📊 What to Test

### 1. Authentication Flow

```bash
# Test sequence:
1. Open app
2. Click sign in
3. Redirected to Keycloak
4. Enter credentials
5. Redirected back
6. Check session cookie
7. Try protected route
8. Logout
9. Verify session cleared
```

### 2. MFA Flow

```bash
# Test OTP:
1. Enable OTP for user
2. Login
3. Scan QR code
4. Enter code
5. Verify access granted

# Test WebAuthn:
1. Enable WebAuthn
2. Login
3. Register device
4. Use device to login
5. Verify access granted
```

### 3. Event Logging

```bash
# Check events:
1. Perform actions (login, logout, etc.)
2. Go to Keycloak admin
3. View Login Events
4. View Admin Events
5. Verify all actions logged
```

### 4. Database Operations

```bash
# Test database:
docker-compose exec postgres psql -U postgres

# Run queries:
\c church_volunteers
SELECT * FROM users;  # (will be empty for now)

\c keycloak
SELECT * FROM event_entity LIMIT 10;  # See logged events
```

## 🐛 Common Issues & Fixes

### Issue: Can't access Keycloak

```bash
# Check if running
docker-compose ps keycloak

# Check logs
docker-compose logs keycloak

# Restart
docker-compose restart keycloak
```

### Issue: Authentication fails

```bash
# Verify client secret
./scripts/get-keycloak-secret.sh

# Check .env.local
cat .env.local | grep KEYCLOAK

# Restart web app
docker-compose restart web
```

### Issue: MFA not working

```bash
# Check required actions in Keycloak
# Verify OTP/WebAuthn enabled
# Check browser compatibility (WebAuthn needs HTTPS or localhost)
```

### Issue: Events not logging

```bash
# Check Keycloak events config
# Go to Realm Settings → Events
# Verify "Save Events" is ON
# Verify event types are selected
```

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Environment

- [ ] Local
- [ ] ngrok
- [ ] Railway
- [ ] Render
- [ ] Other: \***\*\_\_\_\*\***

### Services Status

- PostgreSQL: ✅ / ❌
- Keycloak: ✅ / ❌
- Web App: ✅ / ❌

### Authentication Tests

- Basic login: ✅ / ❌
- Logout: ✅ / ❌
- Session persistence: ✅ / ❌

### MFA Tests

- OTP setup: ✅ / ❌
- OTP login: ✅ / ❌
- WebAuthn setup: ✅ / ❌
- WebAuthn login: ✅ / ❌

### Event Logging

- User events: ✅ / ❌
- Admin events: ✅ / ❌
- Event details: ✅ / ❌

### Issues Found

1. [Issue description]
2. [Issue description]

### Notes

[Any additional observations]
```

## 🎯 Next Steps After Testing

Once you've verified everything works:

1. **Document Issues**: Note any bugs or problems
2. **Test with Others**: Share ngrok link for feedback
3. **Iterate**: Fix issues and retest
4. **Build Features**: Start adding volunteer management
5. **Deploy Properly**: Move to production hosting

## 🆘 Need Help?

- Check logs: `docker-compose logs -f`
- Verify services: `docker-compose ps`
- Review docs: `docs/DOCKER_SETUP.md`
- Test locally first before deploying

---

**Ready to test!** Start with local testing, then try ngrok for quick online testing. 🚀
