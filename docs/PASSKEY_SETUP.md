# Passkey Authentication Setup Guide

## Overview

This application supports **passwordless authentication** using passkeys (WebAuthn) through ZITADEL's hosted login and APIs. Users can sign in with device biometrics (Face ID, Touch ID, Windows Hello) or security keys instead of passwords.

## What Are Passkeys?

Passkeys are a secure, phishing-resistant authentication method that:

- ✅ Use device biometrics or security keys
- ✅ Are more secure than passwords
- ✅ Cannot be phished or intercepted
- ✅ Work across devices with cross-platform authenticators
- ✅ Are backed by the FIDO2/WebAuthn standard

## Architecture

### How It Works

1. **ZITADEL Hosted Login**: When users sign in, ZITADEL's login page shows passkey options (if enabled in the org's login policy)
2. **User Passkey Management**: Authenticated users can add, list, and remove passkeys through the Account Settings page
3. **No Local Storage**: All passkey secrets and registration are handled by ZITADEL - nothing is stored in our database
4. **Server-Side Only**: All ZITADEL API calls are made server-side using Auth.js session tokens

### Components

- **Auth.js with Org Scoping**: Includes org scope so ZITADEL shows the correct branding and passkey options
- **User Settings UI**: `/dashboard/settings` - React component for passkey management
- **API Routes**:
  - `POST /api/zitadel/passkeys/create-link` - Generate passkey registration link
  - `POST /api/zitadel/passkeys/send-link` - Email passkey setup link
  - `POST /api/zitadel/passkeys/list` - List user's passkeys
  - `DELETE /api/zitadel/passkeys/[tokenId]` - Remove a passkey
- **Service User Helper**: Server utility for Management API authentication

---

## Required Environment Variables

Add these to your `.env.local` and Vercel project settings:

### User Authentication (Already Configured)

```bash
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
AUTH_ZITADEL_ISSUER=https://church-volunteers-vpchf7.us1.zitadel.cloud
AUTH_ZITADEL_ID=341538444725489255
AUTH_ZITADEL_SECRET=<your-client-secret>
```

### Organization Scoping (NEW - Required for Passkeys)

```bash
# Your ZITADEL organization ID
# Find this in: ZITADEL Console → Your Organization → Settings
ZITADEL_ORG_ID=<your-org-id>
```

**Why this is needed**: The `urn:zitadel:iam:org:id:{id}` scope preselects your organization during login, ensuring users see your org's branding, login policy, and passkey options.

### Service User for Management API (NEW - Required for Email Links)

You need a service user to call ZITADEL's Management API for operations like sending passkey links via email.

**Option 1: Client Credentials (Recommended for Development)**

```bash
ZITADEL_SERVICE_CLIENT_ID=<service-user-client-id>
ZITADEL_SERVICE_CLIENT_SECRET=<service-user-secret>
```

**Option 2: JWT Profile (Recommended for Production)**

```bash
ZITADEL_SERVICE_KEY_ID=<jwt-key-id>
ZITADEL_SERVICE_USER_ID=<service-user-id>
ZITADEL_SERVICE_PRIVATE_KEY=<base64-encoded-private-key>
```

---

## ZITADEL Configuration Steps

### Step 1: Enable Passkeys in Login Policy

1. Go to **ZITADEL Console** → **Organization** → **Login Policy**
2. Ensure **Passwordless** is enabled
3. (Optional) Keep **Username + Password** enabled as a fallback during rollout
4. Save changes

⚠️ **Warning**: Do NOT disable all other authentication methods until you've tested passkeys thoroughly. Having no fallback can lock users out.

### Step 2: Get Your Organization ID

1. Go to **ZITADEL Console** → **Organization** → **Settings**
2. Copy your **Organization ID**
3. Add it to `.env.local` as `ZITADEL_ORG_ID`

### Step 3: Create a Service User

The service user is needed to call Management API endpoints like "send passkey link via email".

#### Create the Service User:

1. Go to **ZITADEL Console** → **Users** → **Service Users**
2. Click **New**
3. Name: `church-volunteers-api`
4. Save

#### Generate Client Credentials:

1. Click on your service user
2. Go to **Personal Access Tokens** or **Client Credentials**
3. Click **New** → **Client Secret**
4. Copy the **Client ID** and **Client Secret**
5. Add to `.env.local`:
   ```bash
   ZITADEL_SERVICE_CLIENT_ID=<client-id>
   ZITADEL_SERVICE_CLIENT_SECRET=<client-secret>
   ```

#### Grant Required Permissions:

1. Go to **Authorizations**
2. Add role for **ZITADEL Management API**
3. Grant: `org.user.write` or similar permission
4. The service user also needs the reserved audience scope (handled automatically in code)

---

## How Users Add Passkeys

### Method 1: Add on Current Device

1. User navigates to `/dashboard/settings`
2. Clicks **"Add passkey on this device"**
3. Frontend calls `POST /api/zitadel/passkeys/create-link`
4. ZITADEL returns a registration link
5. Link opens in new tab
6. User follows ZITADEL's registration flow
7. Passkey is registered with device authenticator

### Method 2: Email Setup Link (Cross-Device)

1. User clicks **"Email me a passkey setup link"**
2. Frontend calls `POST /api/zitadel/passkeys/send-link`
3. Server uses service user token to call Management API
4. ZITADEL sends email with registration link
5. User opens email on different device
6. User follows registration flow on that device

### Listing and Removing Passkeys

- **List**: Frontend calls `POST /api/zitadel/passkeys/list` to show all user's passkeys
- **Remove**: User clicks "Remove" → Frontend calls `DELETE /api/zitadel/passkeys/[tokenId]`

---

## API Details

### Auth API vs Management API

**Auth API** (`/auth/v1/`):

- Use the **user's access token** from Auth.js session
- Operations on the current user (me)
- Used for: create-link, list, delete passkeys

**Management API** (`/management/v1/`):

- Use a **service user token** with reserved audience scope
- Admin operations on any user
- Used for: send-link (email passkey setup)

### Reserved Audience Scope

The Management API requires `urn:zitadel:iam:org:project:id:zitadel:aud` scope to access ZITADEL's internal APIs. This is automatically included when requesting service user tokens in `src/lib/zitadelService.ts`.

---

## Security Considerations

### ✅ Do

- Keep service user credentials in environment variables only
- Never expose service user secrets to the browser
- All ZITADEL API calls are server-side via API routes
- Use HTTPS in production (passkeys require secure context)
- Keep "Username + Password" enabled as fallback during initial rollout
- Test passkey login before disabling password authentication

### ❌ Don't

- Don't expose `ZITADEL_SERVICE_CLIENT_SECRET` in client-side code
- Don't disable all authentication methods without testing passkeys first
- Don't store passkey secrets locally (ZITADEL handles everything)

---

## Testing Locally

### Prerequisites

- Chrome, Edge, or Safari (WebAuthn support required)
- HTTPS or localhost (passkeys require secure context)
- Device with biometric authenticator or security key

### Test Flow

1. Start dev server: `pnpm dev`
2. Sign in with existing account
3. Go to `http://localhost:3000/dashboard/settings`
4. Click "Add passkey on this device"
5. Follow browser's authentication prompt
6. Verify passkey appears in list
7. Sign out
8. Try signing in with passkey on ZITADEL login page

### Testing Virtual Authenticators (Advanced)

For automated testing, you can use Chrome DevTools virtual authenticators:

```typescript
// Example Playwright test with virtual authenticator
await page.context().addInitScript(() => {
  // Enable virtual authenticator via CDP
});
```

See `TESTING.md` for full E2E test examples.

---

## Troubleshooting

### "Failed to create passkey link"

- Check `AUTH_ZITADEL_ISSUER` is correct
- Verify user's access token is valid (check session)
- Look at server logs for ZITADEL API response

### "Failed to send passkey link"

- Verify service user credentials are correct
- Check service user has Management API permissions
- Ensure service user token includes reserved audience scope
- Verify user email exists in ZITADEL

### Passkeys not showing on login page

- Check organization's login policy has **Passwordless** enabled
- Verify `ZITADEL_ORG_ID` is set correctly
- User must have at least one passkey registered

### "Server configuration error"

- Missing required environment variables
- Check all `ZITADEL_*` variables are set

---

## Production Deployment Checklist

- [ ] Set all required env variables in Vercel
- [ ] Verify HTTPS is enforced (passkeys require secure context)
- [ ] Test passkey registration on production domain
- [ ] Test passkey login on ZITADEL hosted login
- [ ] Keep password authentication enabled as fallback
- [ ] Monitor ZITADEL API rate limits
- [ ] Set up alerts for service user token errors
- [ ] Document passkey usage for end users

---

## Resources

- [ZITADEL Passkeys Documentation](https://zitadel.com/docs/guides/manage/user/reg-create-user#with-passwordless)
- [ZITADEL Auth API Reference](https://zitadel.com/docs/apis/resources/auth)
- [ZITADEL Management API Reference](https://zitadel.com/docs/apis/resources/mgmt)
- [WebAuthn Guide](https://webauthn.guide/)
- [FIDO Alliance](https://fidoalliance.org/)

---

## Files Modified/Created

### Created:

- `src/app/dashboard/settings/page.tsx` - User settings page
- `src/app/dashboard/settings/PasskeysSection.tsx` - Passkeys UI
- `src/app/api/zitadel/passkeys/create-link/route.ts` - Create link API
- `src/app/api/zitadel/passkeys/send-link/route.ts` - Send email API
- `src/app/api/zitadel/passkeys/list/route.ts` - List passkeys API
- `src/app/api/zitadel/passkeys/[tokenId]/route.ts` - Delete passkey API
- `src/lib/zitadelService.ts` - Service user helper
- `.env.example` - Environment template
- `docs/PASSKEY_SETUP.md` - This file

### Modified:

- `src/auth.ts` - Added org scoping to OIDC provider
- `src/app/dashboard/page.tsx` - Added link to Account Settings
- `.gitignore` - Allow `.env.example` to be committed

---

## Next Steps

1. **Set up environment variables** in `.env.local` and Vercel
2. **Configure ZITADEL**:
   - Enable passkeys in login policy
   - Create service user with Management API access
3. **Test locally**: Add a passkey in `/dashboard/settings`
4. **Test login**: Sign out and try passkey login
5. **Deploy to production** with env variables
6. **Monitor**: Watch for API errors in logs

For support, see ZITADEL documentation or open an issue in the repo.
