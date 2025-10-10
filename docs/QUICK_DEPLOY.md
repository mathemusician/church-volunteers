# ⚡ Quick Deploy - Get Online in 15 Minutes

Deploy to **Vercel + Fly.io + Neon** and start testing!

## 🎯 What You'll Get

- ✅ Live URL to share
- ✅ Keycloak authentication
- ✅ PostgreSQL database
- ✅ HTTPS everywhere
- ✅ All on free tiers

## 🚀 One-Command Deploy

```bash
./scripts/deploy.sh
```

This script will:

1. Guide you through Neon setup
2. Deploy Keycloak to Fly.io
3. Deploy Next.js to Vercel
4. Configure everything automatically

## 📋 Manual Steps (If Preferred)

### 1️⃣ Neon (2 minutes)

```bash
# 1. Go to https://neon.tech
# 2. Create project: church-volunteers
# 3. In SQL Editor, run:
CREATE DATABASE keycloak;

# 4. Copy both connection strings
```

### 2️⃣ Fly.io (5 minutes)

```bash
# Install Fly CLI
brew install flyctl

# Login
flyctl auth login

# Deploy Keycloak
cd docker/keycloak
flyctl launch --name church-volunteers-keycloak
flyctl secrets set KEYCLOAK_ADMIN=admin
flyctl secrets set KEYCLOAK_ADMIN_PASSWORD=YourStrongPassword123!
flyctl secrets set KC_DB_URL="jdbc:postgresql://YOUR-NEON-HOST/keycloak?sslmode=require"
flyctl secrets set KC_DB_USERNAME=your-neon-user
flyctl secrets set KC_DB_PASSWORD=your-neon-password
flyctl deploy

# Get URL
flyctl info
# Example: https://church-volunteers-keycloak.fly.dev
```

### 3️⃣ Vercel (5 minutes)

```bash
# Push to GitHub first
git add .
git commit -m "feat: ready for deployment"
git push origin main

# Deploy to Vercel
cd apps/web
vercel --prod

# Set environment variables in Vercel dashboard:
# - DATABASE_URL (from Neon)
# - NEXTAUTH_SECRET (generate: openssl rand -base64 32)
# - KEYCLOAK_CLIENT_ID=web
# - KEYCLOAK_CLIENT_SECRET (from Keycloak)
# - KEYCLOAK_ISSUER=https://your-keycloak.fly.dev/realms/church
```

### 4️⃣ Update Keycloak (2 minutes)

```bash
# 1. Open: https://your-keycloak.fly.dev
# 2. Login as admin
# 3. Go to: Clients → web
# 4. Update redirect URIs:
#    - https://your-app.vercel.app/*
#    - https://your-app.vercel.app/api/auth/callback/keycloak
# 5. Update web origins:
#    - https://your-app.vercel.app
# 6. Save
```

## ✅ Verify Deployment

```bash
# Test Keycloak
curl https://your-keycloak.fly.dev/health/ready

# Test Vercel
curl https://your-app.vercel.app

# Test authentication flow
# Open browser and try to sign in
```

## 🧪 Test Now

1. **Create test user** in Keycloak admin
2. **Open your Vercel URL**
3. **Try to sign in**
4. **Enable MFA** (OTP or WebAuthn)
5. **Check event logs** in Keycloak

## 📊 Your Deployment

After deployment, you'll have:

| Service    | Platform | URL                             | Status |
| ---------- | -------- | ------------------------------- | ------ |
| Next.js    | Vercel   | `https://your-app.vercel.app`   | ✅     |
| Keycloak   | Fly.io   | `https://your-keycloak.fly.dev` | ✅     |
| PostgreSQL | Neon     | Connection string               | ✅     |

## 🎯 Quick Commands

```bash
# View Keycloak logs
flyctl logs -a church-volunteers-keycloak

# View Vercel logs
vercel logs

# Redeploy Keycloak
cd docker/keycloak && flyctl deploy

# Redeploy Vercel
cd apps/web && vercel --prod

# Check Fly.io status
flyctl status -a church-volunteers-keycloak
```

## 🐛 Troubleshooting

### Keycloak won't start

```bash
flyctl logs -a church-volunteers-keycloak
# Check database connection string
# Verify secrets are set correctly
```

### Vercel build fails

```bash
# Check build logs in Vercel dashboard
# Verify all environment variables are set
# Check that DATABASE_URL is correct
```

### Can't login

```bash
# Verify redirect URIs in Keycloak match Vercel URL exactly
# Check KEYCLOAK_ISSUER in Vercel env vars
# Verify client secret is correct
```

## 💡 Pro Tips

1. **Use Vercel preview deployments** for testing before production
2. **Enable Fly.io auto-stop** to save resources (already configured)
3. **Monitor Neon usage** in dashboard
4. **Check Vercel analytics** for performance
5. **Review Keycloak events** regularly

## 🔄 Update Deployment

```bash
# Update code
git add .
git commit -m "feat: your changes"
git push

# Vercel auto-deploys on push
# For Keycloak updates:
cd docker/keycloak && flyctl deploy
```

## 🎉 You're Live!

Your app is now:

- ✅ Online and accessible
- ✅ Secured with Keycloak
- ✅ Using production database
- ✅ HTTPS enabled
- ✅ Ready for testing

**Share your Vercel URL and start testing!** 🚀

---

**Need help?** See `DEPLOYMENT.md` for detailed instructions.
