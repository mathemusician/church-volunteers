# Volunteers - Volunteer Management System

A modern, secure volunteer management application built with Next.js 14, Auth.js v5, and ZITADEL authentication.

## Features

- 🔐 **Passwordless Authentication** - Sign in with passkeys (WebAuthn)
- 📋 **Event Management** - Create and manage volunteer events
- 👥 **Team Collaboration** - Invite and manage organization members
- 🎯 **Volunteer Signups** - Public signup pages for events
- 🤖 **Automated Events** - Auto-generate weekly events from templates
- 🔒 **Multi-tenant** - Organization-based access control

## Authentication

This app uses **ZITADEL** for authentication with support for:

- Username + Password
- **Passkeys (WebAuthn)** - Biometric and security key authentication
- OAuth 2.0 / OpenID Connect

### Passkey Support

Users can add passkeys (Face ID, Touch ID, Windows Hello, YubiKey, etc.) for passwordless authentication:

1. Navigate to **Account Settings** (`/dashboard/settings`)
2. Add passkeys directly on the device or email a setup link
3. Sign in with passkeys on the ZITADEL login page

📘 **See [PASSKEY_SETUP.md](../../docs/PASSKEY_SETUP.md)** for complete setup instructions.

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- ZITADEL account (for authentication)

### Environment Variables

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required variables:

- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `AUTH_ZITADEL_ISSUER` - Your ZITADEL instance URL
- `AUTH_ZITADEL_ID` - OAuth client ID
- `AUTH_ZITADEL_SECRET` - OAuth client secret
- `ZITADEL_ORG_ID` - Your organization ID (for passkeys)
- `DATABASE_URL` - PostgreSQL connection string

For passkey email functionality:

- `ZITADEL_SERVICE_CLIENT_ID` - Service user client ID
- `ZITADEL_SERVICE_CLIENT_SECRET` - Service user secret

See [VERCEL_SETUP.md](./VERCEL_SETUP.md) for deployment configuration.

### Run Development Server

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
