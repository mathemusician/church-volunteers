# Contributing to Church Volunteers

Thank you for your interest in contributing to the Church Volunteers Management System! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions with the project and its community.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/your-username/church-volunteers.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Run tests: `npm test`
6. Commit your changes: `git commit -m "feat: add new feature"`
7. Push to your fork: `git push origin feature/your-feature-name`
8. Create a Pull Request

## Development Setup

See [docs/SETUP.md](docs/SETUP.md) for detailed setup instructions.

## Commit Message Convention

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

Examples:

```
feat: add volunteer assignment notifications
fix: resolve authentication redirect issue
docs: update API documentation
```

## Code Style

- Follow the existing code style
- Use TypeScript for all new code
- Run `npm run lint` before committing
- Run `npm run format` to auto-format code
- Ensure all tests pass

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Update the documentation in the `docs/` folder
3. Add tests for new features
4. Ensure all tests pass
5. Update the CHANGELOG.md (if applicable)
6. Request review from maintainers

## Testing

- Write unit tests for all new features
- Ensure test coverage remains above 80%
- Run `npm test` before submitting PR
- Run `npm run test:coverage` to check coverage

## Documentation

- Update API documentation for new endpoints
- Add JSDoc comments for new functions
- Update README.md for significant changes
- Add examples where appropriate

## Project Structure

```
church-volunteers/
├── apps/
│   └── web/              # Next.js application
│       ├── src/
│       │   ├── app/      # App Router pages
│       │   ├── server/   # Server-side API logic
│       │   └── lib/      # Utility functions
│       └── __tests__/    # Tests
├── packages/
│   ├── config/          # Shared configuration
│   ├── types/           # Shared TypeScript types
│   └── ui/              # Shared UI components
└── docs/                # Documentation
```

## Questions?

If you have questions, please open an issue or reach out to the maintainers.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
