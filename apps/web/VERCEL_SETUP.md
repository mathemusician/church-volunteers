# Vercel Deployment Setup

## Environment Variables for Auth.js v5

### Required Variables

Add these environment variables in your Vercel project settings:

#### For All Environments (Production, Preview, Development):

1. **AUTH_SECRET**
   - Generate with: `openssl rand -base64 32`
   - Example: `BVLAPkta8v749h0T+dQUcsi2eBy7CnBVQLOHfLiTNI0=`

2. **AUTH_ZITADEL_ISSUER**
   - Value: `https://church-volunteers-vpchf7.us1.zitadel.cloud`

3. **AUTH_ZITADEL_ID**
   - Value: `341538444725489255`

4. **AUTH_ZITADEL_SECRET**
   - Value: Your client secret from Zitadel (found in application settings)

### Branch-Scoped Variables for Staging

For Preview deployments (staging branch), Vercel will automatically use:

- `VERCEL_URL` - The deployment URL (e.g., `your-app-git-staging-user.vercel.app`)
- Auth.js v5 automatically constructs the callback URL using the deployment URL

### Zitadel Redirect URI Configuration

You need to add the Vercel Preview deployment URLs to Zitadel:

1. Go to your Zitadel application settings
2. Add these redirect URIs:
   - `https://your-app.vercel.app/api/auth/callback/zitadel` (production)
   - `https://your-app-git-staging-*.vercel.app/api/auth/callback/zitadel` (staging previews)
   - Or use a wildcard: `https://*.vercel.app/api/auth/callback/zitadel`

3. Add post-logout URIs:
   - `https://your-app.vercel.app`
   - `https://*.vercel.app`

## Local Development Setup

Update your local `.env.local` file to use the new variable names:

```bash
# Auth.js v5 Configuration
AUTH_SECRET=your-generated-secret-here
AUTH_ZITADEL_ISSUER=https://church-volunteers-vpchf7.us1.zitadel.cloud
AUTH_ZITADEL_ID=341538444725489255
AUTH_ZITADEL_SECRET=your-client-secret-here

# Optional: Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/church_volunteers
```

## Deployment Steps

1. **Push to staging branch**:

   ```bash
   git checkout -b staging
   git push origin staging
   ```

2. **Configure Vercel**:
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add the 4 required variables (AUTH_SECRET, AUTH_ZITADEL_ISSUER, AUTH_ZITADEL_ID, AUTH_ZITADEL_SECRET)
   - Set them to apply to: Production, Preview, Development

3. **Update Zitadel**:
   - Add your Vercel deployment URLs to Zitadel redirect URIs

4. **Test the deployment**:
   - Visit your Preview deployment URL
   - Click "Sign In"
   - Verify the OIDC flow works correctly

## Troubleshooting

- **Redirect URI mismatch**: Make sure all your Vercel URLs are added to Zitadel
- **AUTH_SECRET not set**: Ensure the environment variable is set in Vercel
- **CORS errors**: Check that Zitadel allows requests from your Vercel domain
