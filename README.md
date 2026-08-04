# research-platforms-evolution

Contract-based modernisation of open-source legacy platforms (**Moodle**, **GLPI**,
**Redmine**) for public institutions. Each platform is rebuilt as a Next.js app on a
shared, framework-agnostic **platform kit**, deployed as an independent academic demo
on **Vercel + Neon**.

This is the applied companion to the research on *domain contract extraction*: the
methodology targets each platform's **extension layer**, distinguishing **write
contracts** (extensions that modify system state) from **read contracts** (extensions
that aggregate cross-module data without modifying state).

## Monorepo layout

```
packages/
  domain-kit/     DDD primitives: Result, Entity, AggregateRoot, DomainEvent
  plugin-sdk/     Write/read contract interfaces (auth, activity, block, grade)
  platform-kit/   Framework-agnostic infra: EventBus, PluginRegistry,
                  JwtService, HTTP error mapping, requireAuth
domains/
  moodle-core/    Moodle bounded context (Course, Grade, Enrollment, …)
  glpi-core/      (planned) Asset, Ticket, SLA
  redmine-core/   (planned) Project, Issue, TimeEntry
apps/
  moodle/         Next.js app — API via Route Handlers + lean UI
  glpi/           (planned)
  redmine/        (planned)
```

**What is shared vs. what is not** — the stack, `platform-kit`, `plugin-sdk` and the
deployment recipe are reused across all platforms; each domain core is its own bounded
context. This separation is the practical confirmation of the research thesis: the
*contract mechanism* is portable, the *domain* is not.

## Architecture (apps/moodle)

- **No NestJS.** The API is a set of Next.js **Route Handlers** (`src/app/api/*`).
- **Composition root** (`src/lib/server/container.ts`) replaces dependency injection:
  it instantiates `PrismaClient` → repositories → infra services once.
- **Domain logic** lives entirely in `@rpe/moodle-core` (ported unchanged, 20 tests).
- **Two contracts, demonstrated:**
  - *Read* — `report/myfeedback`: `GET /api/me/grades` aggregates grades + feedback
    across a student's enrolments (`feedback-report.service.ts`).
  - *Write* — `mod/attendance`: `GET|POST /api/courses/[id]/attendance` owns its
    tables and emits domain events (`attendance.service.ts`).

## Local development

```bash
pnpm install
cd apps/moodle
cp .env.example .env        # fill DATABASE_URL (Neon) and JWT_SECRET
pnpm db:push                # sync schema to the database
pnpm db:seed                # seed demo users, courses, grades, attendance
pnpm dev                    # http://localhost:3001
```

### Demo credentials (after seeding)

All users share the password `Moodle@2025`:

| Role    | Username         |
|---------|------------------|
| Admin   | `admin`          |
| Teacher | `ana.cavalcante` |
| Student | `pedro.ferreira` · `lucas.almeida` · `maria.santos` |

## Deploy (Vercel + Neon)

1. Create a project on [Neon](https://neon.tech) and copy the pooled connection string.
2. On [Vercel](https://vercel.com), import this repo and set:
   - **Root Directory**: `apps/moodle`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: `prisma generate && next build` (already in `package.json`)
   - **Environment Variables**: `DATABASE_URL`, `JWT_SECRET`
3. Deploy. Each platform becomes its own Vercel project → its own URL → its own Neon DB.

## Stack

pnpm workspaces · Turborepo · Next.js 14 · Prisma · PostgreSQL (Neon) · TypeScript ·
Tailwind CSS · Vitest.

---

Scaffolding and initial implementation assisted by Claude (Anthropic).
