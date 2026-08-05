# research-platforms-evolution

Contract-based modernisation of open-source legacy platforms (**Moodle**, **GLPI**,
**Redmine**) for public institutions. All platforms are rebuilt on a single Next.js
app (`apps/web`) that shares one framework-agnostic **platform kit**, while each keeps
its own domain and its own database — deployed as one academic demo on **Vercel + Neon**.

This is the applied companion to the research on *domain contract extraction*: the
methodology targets each platform's **extension layer**, distinguishing **write
contracts** (extensions that modify system state) from **read contracts** (extensions
that aggregate cross-module data without modifying state).

## Monorepo layout

```
packages/
  domain-kit/     DDD primitives: Result, Entity, AggregateRoot, DomainEvent
  plugin-sdk/     Contract interfaces (auth, content, asset-type, activity, …)
  platform-kit/   Framework-agnostic infra: EventBus, PluginRegistry,
                  JwtService, HTTP error mapping, requireAuth
domains/
  moodle-core/    Moodle bounded context (Course, Grade, Enrollment, …)
  glpi-core/      GLPI bounded context (Asset, Ticket, SLA)
  redmine-core/   (planned) Project, Issue, TimeEntry
plugins/
  mod-page / mod-video / mod-url          Moodle content-format plugins
  asset-computer / asset-network / asset-printer   GLPI asset-type plugins
apps/
  web/            Single Next.js app: landing + all platforms
```

**What is shared vs. what is not** — the stack, `platform-kit`, `plugin-sdk` and the
deployment recipe are reused across all platforms; each domain core is its own bounded
context with its own database. This separation is the practical confirmation of the
research thesis: the *contract mechanism* is portable, the *domain* is not.

## The single app (apps/web)

One Next.js app hosts everything:

```
/                 landing — research pitch + platform selection
/moodle/*         Moodle platform      → Neon database "neondb"
/glpi/*           GLPI platform        → Neon database "glpi"
/api/moodle/*     Moodle Route Handlers
/api/glpi/*       GLPI Route Handlers
```

- **No NestJS.** Each platform's API is a set of Next.js **Route Handlers** with its own
  **composition root** (`src/lib/<platform>/server/container.ts`) that replaces DI.
- **Two Prisma clients**, one per database, generated to `src/generated/<platform>-client`.
- **Domain logic** lives in `@rpe/moodle-core` / `@rpe/glpi-core` (ported unchanged, tested).
- **Contracts demonstrated per platform:**
  - Moodle — *read* `report/myfeedback`, *write* `mod/attendance`, content plugins.
  - GLPI — *read* `report/servicedesk`, *write* ticket follow-ups, asset-type plugins.

## Local development

```bash
pnpm install
cd apps/web
cp .env.example .env        # fill both DATABASE_URLs (Neon) and both JWT secrets
pnpm db:generate           # generate both Prisma clients
pnpm dev                   # http://localhost:3000
```

The Neon databases are already provisioned and seeded. To reseed:

```bash
pnpm db:seed:moodle
pnpm db:seed:glpi
```

### Demo credentials

Moodle (password `Moodle@2025`): `admin`, `ana.cavalcante` (teacher),
`pedro.ferreira` / `lucas.almeida` / `maria.santos` (students).

GLPI (password `Glpi@2025`): `admin`, `sofia.tech` / `diego.tech` / `paula.tech`
(technicians), `carlos.user` / `ana.user` / … (requesters).

## Deploy (Vercel + Neon)

One Vercel project for the whole thing:

1. On [Vercel](https://vercel.com), import this repo and set:
   - **Root Directory**: `apps/web`
   - **Framework Preset**: Next.js (auto-detected)
   - **Build Command**: from `package.json` — generates both Prisma clients, then builds.
   - **Environment Variables**:
     - `MOODLE_DATABASE_URL` → Neon connection string ending in `/neondb`
     - `GLPI_DATABASE_URL` → Neon connection string ending in `/glpi`
     - `MOODLE_JWT_SECRET`, `GLPI_JWT_SECRET` → long random strings
2. Deploy. One URL serves the landing page and both platforms.

> If the Neon handshake fails on the serverless runtime, drop `&channel_binding=require`
> from the connection strings — `sslmode=require` is sufficient.

## Stack

pnpm workspaces · Turborepo · Next.js 14 · Prisma (two clients) · PostgreSQL (Neon) ·
TypeScript · Tailwind CSS · Vitest.

---

Scaffolding and initial implementation assisted by Claude (Anthropic).
