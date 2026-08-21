# Research Replication Guide

**Goal of this guide.** Reproduce the *domain contract extraction* methodology
end-to-end for **all three** platforms — Moodle, GLPI and Redmine — so that each
one becomes a fully validated case study, not just a working demo.

> **Read this first.** The reimplementations already in this repository
> (`apps/web/*`) are **provisional demonstrations of architectural
> transferability**. They were built without instrumenting the real legacy
> systems and without validating outputs against them on a shared dataset.
> This guide exists to redo the work *rigorously*. Treat the existing code as a
> reference starting point, not as a validated result.

---

## 0. What "done" means (the bar to clear)

For each platform, the methodology has **five steps**. A platform is *complete*
only when Step 5 has produced:

1. A **platform-agnostic contract specification** for each selected extension
   (write and read), extracted from the **running legacy system**.
2. **Measured** integration-surface numbers: `|T_own|` (owned tables),
   `|A_core|` (core API calls), `|Q|` (catalogued queries).
3. A **validation-by-reimplementation** report: the same dataset loaded into
   **both** the legacy and the reimplementation, identical scenarios run on
   each, and outputs **diffed**.
4. A **scope-reduction** figure (contract size vs. the rewrite it replaces).

These map directly onto the paper's Results table (`SANER-2027/main.tex`), whose
GLPI and Redmine rows are currently `(TODO)`.

---

## 1. Two hard requirements that were missing before

### 1.1 One dataset, two destinations (the same-seed rule)

The single most important fix. There must be **one deterministic dataset
generator per platform**, written in **English**, that loads the **same data**
into:

- the **legacy** system's database (the oracle / source of truth), and
- the **reimplementation**'s database (Neon/Postgres).

Only then is Step 5 a legitimate output diff on identical inputs. Do **not**
write two independent seeds (that was the original mistake).

Recommended shape:

```
seed/
  canonical/        # deterministic generator → canonical entities (JSON or in-memory)
  load-legacy.*     # adapter: canonical → legacy schema (Moodle MariaDB / GLPI MySQL / Redmine DB)
  load-new.*        # adapter: canonical → Prisma/Neon schema
```

Seed with a **fixed RNG seed** (e.g. mulberry32 + Box–Muller, as in the current
`apps/web/prisma/*-seed.ts`) so the dataset is reproducible bit-for-bit.

### 1.2 Institutional scale (~3–4 years of use)

The current seeds are tiny (dozens of records). Generate **institutional-scale,
multi-year** data — roughly 8 semesters / 4 years. Target magnitudes (guidance,
tune to your hardware and Neon plan):

| Platform | Scale target (≈ 4 years) |
|----------|--------------------------|
| **Moodle** | ~4,000 students · ~120 teachers · ~200 courses · thousands of activities · hundreds of thousands of grades · **millions** of attendance records |
| **GLPI** | ~5,000 assets · ~4,000 requesters · ~40 technicians · ~50,000 tickets · hundreds of thousands of follow-ups |
| **Redmine** | ~40 projects · ~50 developers · ~30,000 issues · hundreds of thousands of time entries and journal notes |

Keep proportions realistic across platforms (they represent **one institution**:
its LMS, its IT service desk, and its software-project org). Model temporal
patterns: enrolment per semester, ticket arrival/resolution over time, issue
lifecycles, holidays, staff turnover.

> **Neon note.** Millions of rows are fine on Postgres, but mind Neon's storage
> and connection limits. Bulk-insert in chunks; consider a paid branch for the
> heavy tables. Document the exact final counts in your results.

---

## 2. The five steps (apply to each platform)

### Step 1 — Minimum Core Definition
Delimit the smallest functional core that makes the platform a realistic
instance of its domain (the full primary workflow, nothing more). Document it.

- Moodle: auth, roles, categories/courses, enrolment, content, forum, assignment, gradebook.
- GLPI: entities, assets, ticket lifecycle, SLA, technicians/requesters.
- Redmine: projects, issue lifecycle, trackers, roles, time logging.

### Step 2 — Extension Selection
Pick **real** legacy extensions covering the two contract classes plus the
plugin-type parallel. Criteria: functional complementarity (one write, one
read), institutional representativeness, technical tractability. Use the
**actual** plugins that ship with / are installed on the legacy system.

| | Write contract | Read contract | Plugin-type parallel |
|---|---|---|---|
| Moodle | `mod/attendance` | `report/myfeedback` | content: `mod/page`, `mod/url`, a video module |
| GLPI | ticket follow-up | a service-desk report | asset types: computer / network / printer |
| Redmine | issue update (journal + time) | a project report | trackers: bug / feature / support |

### Step 3 — Environment Instrumentation
1. Stand up the **legacy** platform in Docker (see §3).
2. Generate the **large, multi-year dataset** (§1.2) with the canonical generator.
3. **Load it into the legacy** via its DB (§1.1 `load-legacy`).
4. Enable **SQL statement tracing** on the legacy DB (general query log) so you
   can capture exactly which tables/queries each extension touches.
5. Install/activate the selected extensions through the platform's standard
   mechanism (no core edits).

### Step 4 — Contract Identification
Run **exercise scenarios** (scripted user interactions that hit every code path
of each extension) against the instrumented legacy, and from the traces:

- **Table ownership** → `T_own` (tables the extension creates/owns) vs. tables it
  only reads (`T_src`).
- **Core API tracing** → `A_core` (calls that write shared state: gradebook,
  calendar, notifications, permissions…).
- **Query extraction** → `Q` (normalised, deduplicated SELECTs over non-owned
  tables) for read contracts.
- **Classification** → write vs read (decompose mixed extensions).

Record the **measured counts** `|T_own|`, `|A_core|`, `|Q|`.

### Step 5 — Formalisation & Validation by Reimplementation
1. Write the **platform-agnostic contract spec** (DDL for owned tables, typed
   API signatures with pre/post-conditions, SQL query catalogue with the join
   graph, output/event JSON schemas, and a validation dataset reference).
2. Reimplement the contract on the modern stack (you may adapt the code already
   in `apps/web`, but re-derive it from your extracted spec, not from memory).
3. **Load the SAME dataset** into the reimplementation (§1.1 `load-new`).
4. Run the **same scenarios** on both legacy and reimplementation; **diff the
   outputs** (e.g. the feedback report for N students, the service-desk report,
   the project report). Record matches/mismatches and how gaps were resolved.
5. Compute the **scope-reduction** figure (contract spec size / core LOC it
   replaces) to substantiate the paper's 60–70% claim with real numbers.

---

## 3. Standing up each legacy system (Docker)

- **Moodle** — `research/moodle/docker-compose.yml` (elestio/moodle + MariaDB).
  Install `mod_attendance` (danmarsden) and `report_myfeedback`. Enable the
  MariaDB general query log for tracing.
- **GLPI** — `research/glpi/docker-compose.yml` (diouxx/glpi + MySQL) **exists
  but has never been run** — bring it up, complete the web installer, install
  the chosen plugins, enable the MySQL general query log.
- **Redmine** — **no legacy compose yet; create one** using the official
  `redmine` image + PostgreSQL/MySQL. Configure trackers and a plugin for the
  write/read contracts, enable query logging.

> Keep every legacy setup, its exact versions, and the plugin list in your
> results so the extraction is reproducible.

---

## 4. Where the reimplementations live (reference)

```
packages/       platform-kit (EventBus, PluginRegistry, JwtService, HTTP),
                plugin-sdk (contract interfaces), domain-kit (DDD primitives)
domains/        moodle-core · glpi-core · redmine-core (bounded contexts)
plugins/        content (mod-*), asset-type (asset-*), tracker (tracker-*)
apps/web/       single Next.js app: landing + /moodle /glpi /redmine,
                two→three Prisma clients (one Neon DB each)
```

Local dev: `pnpm install`, then `cd apps/web`, fill `.env` from `.env.example`
(three `*_DATABASE_URL` + three `*_JWT_SECRET`), `pnpm db:generate`, `pnpm dev`.

---

## 5. Saving your results

Work in your own branch (see `docs/COLLABORATION.md`) and save everything under
`results/<platform>/` on that branch:

```
results/
  moodle/
    01-core-and-extensions.md      # Steps 1–2 decisions
    02-legacy-setup.md             # Docker versions, plugins, how to reproduce
    03-dataset/                    # canonical generator + final counts report
    04-contracts/                  # extracted specs + measured |T_own|,|A_core|,|Q|
    05-validation/                 # scenarios, output diffs, scope-reduction numbers
  glpi/   …same structure…
  redmine/ …same structure…
```

When a platform's `results/<platform>/` is complete, its row in
`SANER-2027/main.tex` can be filled with measured numbers (coordinate with the
maintainer before editing the paper).
