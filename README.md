# Church Volunteers Management System

A modern, secure, and scalable volunteer management system built with Next.js, TypeScript, and PostgreSQL.

## 🚀 Features

- 🛡️ **Secure Authentication** - Keycloak OIDC with NextAuth.js
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
- Docker Desktop
- Git

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd church-volunteers

# 2. Install dependencies
npm install

# 3. Copy environment variables
cp .env.example .env.local

# 4. Start Docker services
docker-compose up -d

# 5. Start development server
npm run dev
```

Visit http://localhost:3000 to see your application! 🎉

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
npm run dev

# Run linter
npm run lint

# Format code
npm run format

# Build for production
npm run build

# Start production server
npm run start
```

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
| Database  | PostgreSQL 15                    |
| Auth      | Keycloak, NextAuth.js            |
| Testing   | Jest, React Testing Library      |
| Linting   | ESLint, Prettier                 |
| CI/CD     | GitHub Actions                   |
| Container | Docker, Docker Compose           |

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
