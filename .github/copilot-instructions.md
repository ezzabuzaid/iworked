# Backend Development Context

## Codebase Structure

```
apps/backend/src/
├── core/           # Business logic and utilities
├── middlewares/    # Hono middlewares
└── routes/         # API endpoints (follow same structure pattern)
packages/
├── db/             # @iworked/db - Prisma schema and migrations
├── isomorphic/     # @iworked/isomorphic - Environment-agnostic utilities
└── client/         # @iworked/client - Generated API client (DO NOT EDIT)
```

## Stack

- **Runtime**: Node.js + TypeScript
- **Web Framework**: Hono.dev
- **Database**: Prisma ORM
- **Monorepo**: Nx workspace

## Critical Constraints

### Database-First Development

- **Always reference** `packages/db/schema.prisma` before writing any data-related code
- Use Prisma's generated types for all database operations
- Follow established naming conventions from existing schema

### API Route Pattern

Routes in `src/routes/` follow consistent structure. Study existing routes to understand:

- Request validation patterns
- Response formatting
- Error handling approach
- Middleware usage

### Generated Code Boundary

- **Never modify** `packages/client/*` - this is generated from your API routes
- Changes to routes automatically update client types
- Use this as validation that your API contracts are correct

## Expected Output Requirements

- **Complete implementations** - no placeholders or TODOs
- **Proper error handling** - follow established patterns
- **Type safety** - leverage Prisma and Hono's type system
- **Database queries** - use Prisma client efficiently
- **Consistent structure** - match existing route organization

## Context Priority

1. Check `packages/db/schema.prisma` for data models and relationships
2. Examine similar routes in `apps/backend/src/routes/` for patterns
3. Reference existing middleware in `apps/backend/src/middlewares/`
4. Use core utilities from `apps/backend/src/core/` when applicable
