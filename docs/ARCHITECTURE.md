# Architecture Overview

## System Architecture

The Church Volunteers Management System is built using a modern monorepo architecture with the following key components:

### Technology Stack

- **Frontend**: Next.js 15 with React 19, TypeScript, TailwindCSS
- **Backend**: Next.js API Routes (App Router)
- **Database**: PostgreSQL 15 with Row Level Security
- **Authentication**: Keycloak OIDC via NextAuth.js
- **Testing**: Jest with React Testing Library
- **CI/CD**: GitHub Actions
- **Containerization**: Docker & Docker Compose

## Monorepo Structure

```
church-volunteers/
├── apps/
│   └── web/                    # Next.js application
│       ├── src/
│       │   ├── app/           # App Router (pages & API routes)
│       │   ├── server/        # Server-side business logic
│       │   ├── lib/           # Utility functions
│       │   └── middleware.ts  # Security headers middleware
│       ├── public/            # Static assets
│       └── __tests__/         # Test files
├── packages/
│   ├── config/               # Shared configuration
│   ├── types/                # Shared TypeScript types
│   └── ui/                   # Shared UI components
├── docs/                     # Documentation
└── scripts/                  # Utility scripts
```

## Security Architecture

### Authentication Flow

1. User initiates login via NextAuth.js
2. Redirected to Keycloak OIDC provider
3. User authenticates with Keycloak
4. Keycloak returns tokens (access, refresh, ID)
5. NextAuth.js creates session with tokens
6. Subsequent requests include session token

### Authorization

- **Row Level Security (RLS)**: PostgreSQL policies enforce data access rules
- **Role-Based Access Control**: Users have roles (admin, coordinator, volunteer)
- **API Route Protection**: Middleware validates session before processing requests

### Security Headers

Implemented via Next.js middleware:

- X-Frame-Options: SAMEORIGIN
- X-Content-Type-Options: nosniff
- Strict-Transport-Security
- Content-Security-Policy
- X-XSS-Protection

## Database Architecture

### Schema Design

```
users
├── id (UUID, PK)
├── email (VARCHAR, UNIQUE)
├── name (VARCHAR)
├── keycloak_id (VARCHAR, UNIQUE)
├── role (VARCHAR)
└── timestamps

volunteers
├── id (UUID, PK)
├── user_id (UUID, FK -> users)
├── phone (VARCHAR)
├── availability (JSONB)
├── skills (TEXT[])
└── timestamps

events
├── id (UUID, PK)
├── title (VARCHAR)
├── description (TEXT)
├── start_time (TIMESTAMPTZ)
├── end_time (TIMESTAMPTZ)
├── location (VARCHAR)
├── created_by (UUID, FK -> users)
└── timestamps

volunteer_assignments
├── id (UUID, PK)
├── event_id (UUID, FK -> events)
├── volunteer_id (UUID, FK -> volunteers)
├── status (VARCHAR)
└── timestamps
```

### Row Level Security Policies

Each table has RLS policies that:

- Allow all users to SELECT (read)
- Restrict INSERT/UPDATE to resource owners
- Use `auth.uid()` function to identify current user

## API Architecture

### RESTful API Design

- **GET /api/volunteers** - List volunteers
- **POST /api/volunteers** - Create volunteer
- **GET /api/volunteers/:id** - Get volunteer
- **PUT /api/volunteers/:id** - Update volunteer
- **DELETE /api/volunteers/:id** - Delete volunteer

Similar patterns for events and assignments.

### Error Handling

Standardized error responses:

```typescript
{
  error: string;
  message?: string;
  statusCode: number;
}
```

### Response Format

Consistent response structure:

```typescript
{
  data?: T;
  error?: string;
  message?: string;
}
```

## Frontend Architecture

### App Router Structure

```
app/
├── layout.tsx              # Root layout
├── page.tsx                # Home page
├── api/                    # API routes
│   ├── auth/              # Authentication
│   ├── volunteers/        # Volunteer endpoints
│   ├── events/            # Event endpoints
│   └── assignments/       # Assignment endpoints
└── (authenticated)/       # Protected routes
    ├── dashboard/
    ├── volunteers/
    └── events/
```

### State Management

- **Server Components**: Default for data fetching
- **Client Components**: For interactive UI
- **React Context**: For global state (auth, theme)
- **SWR/React Query**: For client-side data fetching (future)

## Testing Strategy

### Unit Tests

- Test business logic in isolation
- Mock external dependencies
- Focus on edge cases

### Integration Tests

- Test API routes end-to-end
- Use test database
- Verify security policies

### E2E Tests (Future)

- Test user flows
- Use Playwright or Cypress
- Run in CI/CD pipeline

## Deployment Architecture

### Docker Containers

- **web**: Next.js application
- **postgres**: PostgreSQL database
- **keycloak**: Authentication server

### Environment Variables

Managed via `.env.local` (development) and secrets (production):

- Database credentials
- Keycloak configuration
- NextAuth secret
- API keys

### CI/CD Pipeline

GitHub Actions workflow:

1. **Lint**: Check code style
2. **Test**: Run unit tests
3. **Build**: Build Next.js app
4. **Docker**: Build container image
5. **Deploy**: Deploy to production (future)

## Scalability Considerations

### Database

- Connection pooling via `pg` Pool
- Indexes on frequently queried columns
- Prepared statements for security

### Caching (Future)

- Redis for session storage
- CDN for static assets
- API response caching

### Monitoring (Future)

- Application logs
- Error tracking (Sentry)
- Performance monitoring (New Relic)
- Database query analysis

## Development Workflow

1. Create feature branch
2. Implement changes with tests
3. Run linters and formatters
4. Commit with conventional commits
5. Push and create PR
6. CI/CD runs checks
7. Code review
8. Merge to main
9. Auto-deploy to staging

## Future Enhancements

- [ ] Real-time notifications (WebSockets)
- [ ] Mobile app (React Native)
- [ ] Email notifications
- [ ] Calendar integration
- [ ] Reporting and analytics
- [ ] Multi-language support
- [ ] Advanced scheduling
- [ ] Volunteer hour tracking
