# iWorked - Time Tracking & Invoicing API

A headless time-tracking and invoicing platform designed for freelancers who need precise billing and minimal administrative overhead. Built as a JSON API that can power mobile apps, CLI tools, web interfaces, and other integrations.

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Development Workflow](#development-workflow)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database](#database)
- [Contributing](#contributing)
- [Troubleshooting](#troubleshooting)

## Overview

iWorked provides a complete backend solution for time tracking and invoicing with the following core features:

- **Client Management** - Create, update, and manage client information
- **Project Tracking** - Projects belong to clients with configurable hourly rates
- **Time Entries** - Precise time tracking with start/stop functionality and notes
- **Reporting** - Summary reports by client or project for any date range
- **Invoicing** - Draft invoices from time entries with PDF generation
- **Immutable History** - Time entries become locked when included in sent invoices
- **Authentication** - Bearer token-based single-user authentication

### Key Design Principles

- **API-First**: Headless design enables any frontend to integrate
- **Data Integrity**: Rigorous validation and immutable billing history
- **Performance**: Sub-200ms response times for 95% of API calls
- **Type Safety**: Full TypeScript implementation with generated client types

## Architecture

### Tech Stack

- **Runtime**: Node.js 20+ with TypeScript
- **Web Framework**: [Hono.dev](https://hono.dev) - Lightweight, fast web framework
- **Database**: PostgreSQL with Prisma ORM
- **Monorepo**: Nx workspace for efficient development and builds
- **Authentication**: Better Auth for user management
- **API Documentation**: OpenAPI 3.0 with auto-generated client SDK

### System Components

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Client Apps   │────│   Backend API    │────│   PostgreSQL    │
│ (Web/Mobile/CLI)│    │   (Hono.dev)     │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                       ┌──────────────────┐
                       │   AI Agent       │
                       │  (Agentize)      │
                       └──────────────────┘
```

## Quick Start

### 1. Clone and Install Dependencies

```bash
git clone <repository-url>
cd iworked
npm install
```

### 2. Environment Setup

Create environment files for development:

```bash
# Backend environment
cp apps/backend/.env.example apps/backend/.env

# Agent environment (if using AI features)
cp .env.agent.example .env.agent
```

Edit the environment files with your configuration:

```bash
# apps/backend/.env
CONNECTION_STRING="postgresql://youruser:yourpassword@localhost:5432/iworked?schema=app"
SHADOW_CONNECTION_STRING="postgresql://youruser:yourpassword@localhost:5432/iworked_shadow?schema=app"
```

### 3. Database Setup

Run database migrations:

```bash
nx run db:migrate --name=initial
```

### 4. Start Development Services

```bash
# Start backend service
nx run backend:serve    # Backend API on port 1421
```

### 5. Verify Installation

Check that services are running:

```bash
# Backend health check
curl http://localhost:1421/health

# View API documentation
open http://localhost:1421/openapi.json
```

## Development Workflow

### Daily Development

```bash
# Pull latest changes
git pull origin main

# Install any new dependencies
npm install

# Start development services
nx run backend:serve

```

### Making Changes

1. **Create a feature branch**:

   ```bash
   git checkout -b feature/add-expense-tracking
   ```

2. **Make changes** following the established patterns:
   - Backend routes in `apps/backend/src/routes/`
   - Database changes via Prisma migrations
   - Type-safe API contracts

3. **Generate types** after API changes:

   ```bash
   npm run client  # Regenerates API client
   ```

4. **Commit and push**:
   ```bash
   git add .
   git commit -m "feat: add expense tracking endpoints"
   git push origin feature/add-expense-tracking
   ```

### Available Scripts

| Command                           | Description                             |
| --------------------------------- | --------------------------------------- |
| `npm run client`                  | Regenerate API client from OpenAPI spec |
| `nx run backend:serve`            | Start backend in development mode       |
| `nx run backend:build`            | Build backend for production            |
| `nx run db:migrate --name=<name>` | Create and run new database migration   |
| `nx run db:generate-types`        | Generate Prisma client types            |
| `nx run db:reset`                 | Reset database (development only)       |
| `nx lint`                         | Run ESLint across all projects          |
| `nx format`                       | Format code with Prettier               |

## Project Structure

### Monorepo Organization

```
iworked/
├── apps/
│   ├── backend/          # Main API application
│   │   ├── src/
│   │   │   ├── routes/   # API endpoints
│   │   │   ├── middlewares/ # Hono middlewares
│   │   │   ├── core/     # Business logic
│   │   │   └── server.ts # Application entry point
│   │   └── package.json
│   └── frontend/         # React frontend (optional)
├── packages/
│   ├── client/           # Generated API client (DO NOT EDIT)
│   ├── auth/             # Authentication utilities
│   ├── isomorphic/       # Shared utilities
│   └── persistence/
│       └── db/           # Database schema and migrations
├── tools/                # Development tools and generators
└── README.md
```

### Key Directories

#### `apps/backend/src/`

- **`routes/`**: API endpoint definitions following REST conventions
- **`middlewares/`**: Hono middleware for auth, validation, and response formatting
- **`core/`**: Business logic and utility functions

#### `packages/persistence/db/`

- **`schema.prisma`**: Database schema definition
- **`migrations/`**: Database migration files
- **`src/prisma/`**: Generated Prisma client code

#### `packages/client/`

- **Auto-generated** API client with TypeScript types
- **Never edit manually** - regenerated from OpenAPI spec
- Provides type-safe API calls for frontend applications

## API Documentation

### OpenAPI Specification

The API is fully documented using OpenAPI 3.0:

- **Interactive Docs**: Available at `/docs` when backend is running
- **JSON Spec**: Available at `/openapi.json`
- **Generated Client**: TypeScript client in `packages/client/`

### Core Endpoints

| Resource        | Methods                | Description        |
| --------------- | ---------------------- | ------------------ |
| `/clients`      | GET, POST, PUT, DELETE | Client management  |
| `/projects`     | GET, POST, PUT, DELETE | Project management |
| `/time-entries` | GET, POST, PUT, DELETE | Time tracking      |
| `/invoices`     | GET, POST, PUT         | Invoice management |
| `/reports`      | GET                    | Summary reporting  |

### Authentication

All API endpoints require a Bearer token:

```bash
curl -H "Authorization: Bearer <your-token>" \
     http://localhost:1421/api/clients
```

## Database

### Schema Overview

The application uses PostgreSQL with the following core entities:

- **User**: Authentication and user profile
- **Client**: Customer information
- **Project**: Work projects with hourly rates
- **TimeEntry**: Individual time tracking records
- **Invoice**: Billing documents with line items
- **InvoiceLine**: Individual project billing lines

### Key Relationships

```sql
User (1) ──→ (many) Client
Client (1) ──→ (many) Project
Project (1) ──→ (many) TimeEntry
Client (1) ──→ (many) Invoice
Invoice (1) ──→ (many) InvoiceLine
```

### Database Operations

```bash
# Create new migration
nx run db:migrate --name=add-expense-categories

# Apply pending migrations
nx run db:migrate

# Reset database (development only)
nx run db:reset

# Generate TypeScript types
nx run db:generate-types

# Open Prisma Studio (database GUI)
nx run db:studio
```

### Data Integrity Rules

1. **Immutable Billing**: Time entries cannot be modified once included in sent invoices
2. **Cascade Deletes**: Deleting invoices removes associated invoice lines
3. **Referential Integrity**: Foreign key constraints prevent orphaned records
4. **Audit Trail**: All state changes include timestamps and user attribution

## Contributing

### Branch Naming Convention

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Commit Message Format

Follow conventional commits:

```
feat: add expense tracking endpoints
fix: resolve invoice PDF generation issue
docs: update API documentation
refactor: improve database query performance
```

### Pull Request Process

1. **Create feature branch** from `main`
2. **Implement changes** following established patterns
3. **Update documentation** if needed
4. **Submit pull request** with clear description

### Code Standards

- **TypeScript**: Strict type checking enabled
- **ESLint**: Enforced code style and best practices
- **Prettier**: Automatic code formatting
- **Database-First**: Always update schema before code changes
- **API Contracts**: Maintain backward compatibility

### Development Guidelines

1. **Follow existing patterns** in route structure and error handling
2. **Use Prisma types** for all database operations
3. **Validate inputs** using Zod schemas
4. **Handle errors gracefully** with appropriate HTTP status codes
5. **Document API changes** in OpenAPI spec

## Troubleshooting

### Common Issues

#### Port Conflicts

```bash

# Kill process using port
kill -9 $(lsof -t -i:1421)
```

#### Generated Types Out of Sync

```bash
# Regenerate Prisma client
nx run db:generate-types

# Regenerate API client
npm run client
```

### Log Analysis

```bash
# View backend logs (if using pm2 or similar)
nx run backend:serve --verbose

# View application logs in development
tail -f apps/backend/logs/app.log
```

---

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Changelog

See [CHANGELOG.md](./CHANGELOG.md) for version history and release notes.
