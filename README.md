# Volunteers Management System

A modern, secure, and scalable volunteer management system built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Features

- 🛡️ **Secure Authentication** - Auth.js v5 with Zitadel Cloud OIDC
- 🍪 **Secure Session Cookies** - HttpOnly, Secure, and SameSite protection
- 🗄️ **PostgreSQL with RLS** - Row Level Security for data protection
- 🔒 **Security Headers** - Helmet-style middleware for enhanced security
- 🧪 **Testing** - Jest with React Testing Library
- 🐳 **Docker Support** - Containerized development and deployment
- ✨ **Modern DX** - TypeScript, ESLint, Prettier, and Git hooks
- 🔄 **CI/CD** - GitHub Actions for automated testing and deployment
- 📦 **Monorepo** - Organized with shared packages

## 🏗️ Project Structure

```
church-volunteers/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/           # App Router (pages & API routes)
│       │   ├── server/        # Server-side business logic
│       │   ├── lib/           # Utility functions
│       │   └── middleware.ts  # Security headers
│       └── __tests__/         # Test files
├── packages/
│   ├── config/                # Shared configuration
│   ├── types/                 # Shared TypeScript types
│   └── ui/                    # Shared UI components
├── docs/                      # Documentation
│   ├── API.md                # API documentation
│   ├── ARCHITECTURE.md       # System architecture
│   └── SETUP.md              # Detailed setup guide
└── scripts/                   # Utility scripts
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm (comes with Node.js)
- Docker Desktop (optional, for local database)
- Git

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd church-volunteers

# 2. Install dependencies (use npm, not pnpm)
npm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Start development server
cd apps/web
npm run dev
```

Visit http://localhost:3000 to see your application! 🎉

**⚠️ Important:** This project uses **npm** for local development to match Vercel's deployment environment. While `package.json` contains `"packageManager": "pnpm@8.6.0"`, Vercel actually uses npm for building. The two package managers resolve Tailwind v4 dependencies differently, and npm's resolution is compatible while pnpm's causes build errors. Always use npm for local development.

For detailed setup instructions, see [GETTING_STARTED.md](GETTING_STARTED.md).

## 📚 Documentation

- **[Getting Started](GETTING_STARTED.md)** - Step-by-step setup guide
- **[Installation Checklist](INSTALLATION_CHECKLIST.md)** - Verify your setup
- **[Project Summary](PROJECT_SUMMARY.md)** - Complete project overview
- **[API Documentation](docs/API.md)** - API endpoints and usage
- **[Architecture](docs/ARCHITECTURE.md)** - System design and architecture
- **[Setup Guide](docs/SETUP.md)** - Detailed configuration instructions
- **[Contributing](CONTRIBUTING.md)** - How to contribute

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## 🐳 Docker

```bash
# Start all services (PostgreSQL, Keycloak, Web)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🛠️ Development

```bash
# Start development server
cd apps/web
npm run dev

# Run linter
npm run lint

# Format code (from root)
cd ../..
npm run format

# Build for production
cd apps/web
npm run build

# Start production server
npm run start
```

**Note:** Commands run from the `apps/web` directory for the web application.

## 🔐 Security Features

- **Authentication**: Keycloak OIDC integration
- **Authorization**: Row Level Security in PostgreSQL
- **Security Headers**: CSP, HSTS, X-Frame-Options, etc.
- **Input Validation**: Type-safe API with TypeScript
- **SQL Injection Prevention**: Parameterized queries

## 📊 Tech Stack

| Category  | Technology                       |
| --------- | -------------------------------- |
| Frontend  | Next.js 15, React 19, TypeScript |
| Styling   | TailwindCSS                      |
| Backend   | Next.js API Routes               |
| Database  | PostgreSQL 15 (Neon)             |
| Auth      | Auth.js v5, Zitadel Cloud OIDC   |
| Testing   | Jest, React Testing Library      |
| Linting   | ESLint, Prettier                 |
| CI/CD     | GitHub Actions                   |
| Container | Docker, Docker Compose           |

## 🔐 Security & Authentication

### Cookie Configuration

Our Auth.js v5 implementation uses secure cookies with the following settings:

#### HttpOnly

All session cookies have the `httpOnly` flag set to **true**, which prevents client-side JavaScript from accessing the cookies. This protects against XSS (Cross-Site Scripting) attacks.

#### Secure

In production, all cookies have the `secure` flag set to **true**, ensuring they are only transmitted over HTTPS connections. This prevents man-in-the-middle attacks.

#### SameSite: Lax

We use `sameSite: "lax"` for the following reasons:

1. **OAuth Flow Compatibility**: `lax` allows cookies to be sent during top-level navigation (like OAuth redirects from Zitadel back to our app)
2. **CSRF Protection**: Still provides protection against most CSRF attacks
3. **User Experience**: Maintains session when users navigate from external links

**Why not `strict`?**

- `strict` would break OAuth callbacks because cookies wouldn't be sent when redirecting from Zitadel to our application

**Why not `none`?**

- `none` would require all requests to be cross-site and offers no CSRF protection
- Not needed for our single-domain OAuth flow

#### Cookie Prefixes

- Production session cookies use `__Secure-` prefix (requires HTTPS)
- CSRF tokens use `__Host-` prefix (requires HTTPS + same domain + path=/)
- Development uses no prefix for localhost compatibility

#### Configuration Location

See `/apps/web/src/auth.ts` for the complete cookie configuration.

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 Scripts

| Command          | Description               |
| ---------------- | ------------------------- |
| `npm run dev`    | Start development server  |
| `npm run build`  | Build for production      |
| `npm run start`  | Start production server   |
| `npm test`       | Run tests                 |
| `npm run lint`   | Run ESLint                |
| `npm run format` | Format code with Prettier |

## 🔍 Verify Setup

Run the verification script to check your installation:

```bash
./scripts/verify-setup.sh
```

## 🐛 Troubleshooting

### Tailwind CSS Build Errors

If you encounter errors like `Missing field 'negated' on ScannerOptions.sources`:

1. **Use npm instead of pnpm**: This project has Tailwind v4 dependencies that resolve differently between package managers
2. **Remove existing installations**:
   ```bash
   rm -rf node_modules apps/web/node_modules pnpm-lock.yaml
   npm install
   ```
3. **Vercel uses npm**: Local development should match Vercel's environment

### Development Server Issues

- **Port 3000 already in use**: Kill existing processes with `lsof -ti:3000 | xargs kill`
- **Auth errors on first run**: Clear browser cookies or use incognito mode

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- 📖 Check the [documentation](docs/)
- 🐛 [Open an issue](https://github.com/your-repo/church-volunteers/issues)
- 💬 [Start a discussion](https://github.com/your-repo/church-volunteers/discussions)

## 🌟 Acknowledgments

Built with ❤️ for church communities worldwide.

---

**Ready to get started?** Check out [GETTING_STARTED.md](GETTING_STARTED.md)!
