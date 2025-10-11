# Passkey Implementation Summary

## ✅ What Was Implemented

### 1. **Auth.js Configuration** (`src/auth.ts`)

- ✅ Added org scoping to OIDC authorization
- ✅ Dynamic scope: `openid profile email urn:zitadel:iam:org:id:${ZITADEL_ORG_ID}`
- ✅ Preserves existing PKCE and state checks

### 2. **User Interface**

- ✅ **Account Settings Page** (`/dashboard/settings`)
  - Profile information display
  - Passkeys management section
- ✅ **PasskeysSection Component** (Client-side)
  - "Add passkey on this device" button
  - "Email me a passkey setup link" button
  - List of existing passkeys with Remove action
  - Loading states and error handling
  - Helpful educational content about passkeys
- ✅ **Dashboard Integration**
  - Added "🔐 Account Settings" card linking to `/dashboard/settings`

### 3. **API Routes** (Server-side only)

#### `POST /api/zitadel/passkeys/create-link`

- Uses user's access token from session
- Calls ZITADEL Auth API: `/auth/v1/users/me/passwordless/_link`
- Returns registration link to open in new tab

#### `POST /api/zitadel/passkeys/send-link`

- Gets user ID from their access token
- Uses service user token to call Management API
- Endpoint: `/management/v1/users/:userId/passwordless/_send`
- Sends passkey registration link via email

#### `POST /api/zitadel/passkeys/list`

- Uses user's access token
- Calls: `/auth/v1/users/me/passwordless/_search`
- Returns array of user's passkeys

#### `DELETE /api/zitadel/passkeys/:tokenId`

- Uses user's access token
- Calls: `/auth/v1/users/me/passwordless/:tokenId`
- Removes specific passkey

### 4. **Service User Helper** (`src/lib/zitadelService.ts`)

- ✅ `getServiceUserToken()` - Mints service user access token via client_credentials
- ✅ Includes reserved audience scope: `urn:zitadel:iam:org:project:id:zitadel:aud`
- ✅ Token caching with expiration
- ✅ `getCurrentUserId()` - Gets user ID from Auth API

### 5. **Documentation**

- ✅ **PASSKEY_SETUP.md** - Complete setup guide
  - Environment variables explained
  - ZITADEL configuration steps
  - Security considerations
  - Troubleshooting guide
  - Testing instructions
- ✅ **Updated README.md** - Added passkey features and setup
- ✅ **Updated VERCEL_SETUP.md** - Added new env variables
- ✅ **Created .env.example** - Template with all variables

---

## 🏗️ Architecture Decisions

### Why Auth API vs Management API?

**Auth API** (`/auth/v1/users/me/*`):

- ✅ Designed for operations on the current user
- ✅ Use the user's own access token (from Auth.js session)
- ✅ No additional permissions needed
- ✅ Used for: create-link, list, delete

**Management API** (`/management/v1/users/:userId/*`):

- ✅ Admin-level operations
- ✅ Requires service user token
- ✅ Requires reserved audience scope
- ✅ Used for: send-link (email passkey to user)

### Why Server-Side Only?

- ✅ Service user credentials never exposed to browser
- ✅ Access tokens handled securely server-side
- ✅ ZITADEL API responses not exposed to client
- ✅ Follows Auth.js best practices

### Why Org Scoping?

- ✅ Preselects organization on ZITADEL login page
- ✅ Shows correct branding and login policy
- ✅ Required for organization-specific passkey settings
- ✅ Better UX - users don't need to select org

---

## 📋 Required Configuration

### Environment Variables (Add to Vercel)

**Existing (Already Set):**

```bash
AUTH_SECRET
AUTH_ZITADEL_ISSUER
AUTH_ZITADEL_ID
AUTH_ZITADEL_SECRET
DATABASE_URL
```

**New (Need to Add):**

```bash
# Your ZITADEL organization ID
ZITADEL_ORG_ID=<from-console>

# Service user credentials (for email links)
ZITADEL_SERVICE_CLIENT_ID=<service-user-id>
ZITADEL_SERVICE_CLIENT_SECRET=<service-user-secret>
```

### ZITADEL Console Steps

1. **Enable Passkeys in Login Policy**
   - Organization → Login Policy → Enable "Passwordless"
   - Keep "Username + Password" as fallback

2. **Get Organization ID**
   - Organization → Settings → Copy Organization ID
   - Add to `ZITADEL_ORG_ID` env variable

3. **Create Service User**
   - Users → Service Users → New
   - Name: `church-volunteers-api`
   - Generate Client Credentials
   - Grant Management API access (`org.user.write`)

---

## 🧪 Testing

### Manual Testing Checklist

- [ ] Sign in with existing account
- [ ] Navigate to `/dashboard/settings`
- [ ] Click "Add passkey on this device"
- [ ] Complete passkey registration
- [ ] Verify passkey appears in list
- [ ] Sign out
- [ ] Sign in using passkey on ZITADEL login
- [ ] Test "Email me passkey link" (check email)
- [ ] Test removing a passkey

### Test Accounts Needed

- At least one user account in ZITADEL
- Device with biometric authenticator (Face ID, Touch ID, Windows Hello) OR
- Security key (YubiKey, etc.)

---

## 🚀 Deployment Steps

1. **Local Testing First**

   ```bash
   # Add env variables to .env.local
   ZITADEL_ORG_ID=your-org-id
   ZITADEL_SERVICE_CLIENT_ID=service-user-id
   ZITADEL_SERVICE_CLIENT_SECRET=service-user-secret

   # Run dev server
   pnpm dev

   # Test at http://localhost:3000/dashboard/settings
   ```

2. **Add Env Variables to Vercel**
   - Go to Vercel Project → Settings → Environment Variables
   - Add `ZITADEL_ORG_ID`, `ZITADEL_SERVICE_CLIENT_ID`, `ZITADEL_SERVICE_CLIENT_SECRET`
   - Apply to all environments (Production, Preview, Development)

3. **Deploy**

   ```bash
   git push origin stage
   git checkout main
   git merge stage
   git push origin main
   ```

4. **Verify in Production**
   - Sign in to production site
   - Go to Account Settings
   - Add a passkey
   - Test passkey login

---

## 📊 Files Changed/Created

### Created (14 files):

```
apps/web/.env.example
apps/web/src/app/dashboard/settings/page.tsx
apps/web/src/app/dashboard/settings/PasskeysSection.tsx
apps/web/src/app/api/zitadel/passkeys/create-link/route.ts
apps/web/src/app/api/zitadel/passkeys/send-link/route.ts
apps/web/src/app/api/zitadel/passkeys/list/route.ts
apps/web/src/app/api/zitadel/passkeys/[tokenId]/route.ts
apps/web/src/lib/zitadelService.ts
docs/PASSKEY_SETUP.md
docs/PASSKEY_IMPLEMENTATION_SUMMARY.md (this file)
```

### Modified (5 files):

```
apps/web/src/auth.ts (added org scoping)
apps/web/src/app/dashboard/page.tsx (added Account Settings link)
apps/web/.gitignore (allow .env.example)
apps/web/README.md (added passkey docs)
apps/web/VERCEL_SETUP.md (added new env vars)
```

---

## 🔒 Security Notes

### ✅ What's Secure

- All service user credentials are server-side only
- User access tokens never exposed to browser
- ZITADEL handles all passkey secrets
- No passkey data stored in our database
- HTTPS required for passkeys (enforced by WebAuthn)
- Reserved audience scope prevents token misuse

### ⚠️ Important Warnings

- **Never expose** `ZITADEL_SERVICE_CLIENT_SECRET` to client-side code
- **Keep fallback auth** (password) enabled during initial rollout
- **Test thoroughly** before disabling password authentication
- **Monitor API rate limits** on ZITADEL
- **Validate HTTPS** is enforced in production

---

## 📚 Resources for Users

Share these links with end users:

- [What are Passkeys?](https://fidoalliance.org/passkeys/)
- [ZITADEL Passkey Guide](https://zitadel.com/docs/guides/manage/user/reg-create-user#with-passwordless)
- [WebAuthn Guide](https://webauthn.guide/)

---

## 🎯 Next Steps

1. **Configure ZITADEL** (see PASSKEY_SETUP.md)
2. **Add environment variables** to Vercel
3. **Test locally** with a passkey
4. **Deploy to production**
5. **Test production** passkey flow
6. **Monitor** for errors in Vercel logs
7. **Communicate to users** about new passkey option

---

## 💡 Future Enhancements (Not Implemented)

- [ ] E2E tests with virtual authenticators (Playwright)
- [ ] Rate limiting on API routes
- [ ] Passkey usage analytics
- [ ] Admin view of passkey adoption
- [ ] JWT authentication for service user (instead of client_credentials)
- [ ] Passkey nickname/device name customization
- [ ] Passkey last used timestamp

---

## 🐛 Known Limitations

- Email links require service user (additional ZITADEL setup)
- Passkeys require HTTPS (not available on http://localhost except Chrome)
- WebAuthn only works in modern browsers (Chrome, Edge, Safari, Firefox)
- No backup passkey reminder (user responsibility)
- Single org scope (no multi-org passkey support yet)

---

## 📞 Support

For issues:

1. Check [PASSKEY_SETUP.md](./PASSKEY_SETUP.md) troubleshooting section
2. Review Vercel function logs
3. Check ZITADEL API response in server console
4. Verify environment variables are set correctly
5. Ensure HTTPS is enabled in production

ZITADEL Resources:

- [Auth API Docs](https://zitadel.com/docs/apis/resources/auth)
- [Management API Docs](https://zitadel.com/docs/apis/resources/mgmt)
- [Community Discord](https://zitadel.com/chat)

---

**Status**: ✅ Implementation Complete - Ready for Testing
**Commit**: `72ceb9b` - "Add passkey (WebAuthn) support via ZITADEL"
