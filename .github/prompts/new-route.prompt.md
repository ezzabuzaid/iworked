---
mode: agent
---

Create new route similar to the existing ones in the `apps/backend/routes` directory. The new route should follow the same structure and conventions as the existing routes, including:

- Importing necessary modules
- Using validate middleware
- Using verifyToken middleware when needed
- Add route to `apps/backend/src/app.ts`

### Business Logic

1. Make sure to check `packages/persistence/db/schema.prisma` for the database schema and ensure that the new route aligns with the existing data models.

2. when reasoning about the route business logic you need to make sure it aligns with existing BL.
3. check `apps/backend/src/app.ts` to see the global error handling middleware so you do not end up duplicating error handling logic.
4. When you want to make sure a record found but you do not want to use it's value, just use `await prisma.modelName.findUniqueOrThrow({ where: { id } })` or `findFirstOrThrow` without try cache unless custom message needed.

Before starting, always ask me what is the route name and purpose.
