# Design Notes — full context for collaborators (and their Claude)

This file is the condensed brain-dump of the whole project: the problem, the
methodology, what was built, the honest status, and what remains. It exists so
that **Claude Code can read it and explain everything to a new collaborator**,
who should never need to read the repository by hand — they run the
`/experiment` commands (see `.claude/commands/`) and Claude guides them.

---

## 1. What this project is

An applied companion to a research paper (`SANER-2027/`) proposing a
methodology to **modernise open-source legacy platforms by extracting their
domain contracts**. Public institutions depend on systems they cannot switch
off and cannot afford to rewrite — **Moodle** (learning), **GLPI** (IT service
management), **Redmine** (project tracking). The thesis: instead of a big-bang
rewrite, target each platform's **extension layer** (its plugins), extract the
contracts those plugins have with the core, and reimplement them incrementally
on a modern stack — preserving the plugin architecture, without interrupting
service.

## 2. The core idea: two kinds of contract

Domain knowledge in these platforms is concentrated in the **integration
contracts** between the core and its extensions, not spread through millions of
lines of core code. Two classes:

- **Write contract** — an extension that *modifies system state*: owns tables,
  calls core write APIs, emits events. Higher reimplementation risk.
  `⟨T_own, A_core, E_out⟩`.
- **Read contract** — an extension that *aggregates data without modifying
  state*: a set of queries over tables it does not own, plus an output schema.
  Lower risk; maps one-to-one to a REST/GraphQL endpoint. `⟨Q, T_src, V_out⟩`.

Plus a **plugin-type** parallel (content formats / asset types / issue
trackers): the core stores an opaque payload and delegates its interpretation
and display to a registered plugin. This proves the extensibility model carries
over.

Concrete instances per platform:

| | Write | Read | Plugin-type |
|---|---|---|---|
| Moodle | `mod/attendance` | `report/myfeedback` | content: page / url / video |
| GLPI | ticket follow-up | service-desk report | asset types: computer / network / printer |
| Redmine | issue update (journal + time) | project report | trackers: bug / feature / support |

## 3. The methodology (five steps)

1. **Minimum Core Definition** — the smallest functional core that makes the
   platform a realistic instance of its domain.
2. **Extension Selection** — pick real legacy extensions covering write + read
   + plugin-type (complementarity, institutional representativeness,
   tractability).
3. **Environment Instrumentation** — stand up the legacy in Docker; generate a
   realistic synthetic dataset (a 4-question domain protocol: entities?
   workflows? volume that triggers all code paths? realistic distributions?);
   load it into the legacy; enable SQL statement tracing.
4. **Contract Identification** — from the running legacy: table ownership,
   core-API tracing, query extraction; classify write vs read; **measure**
   `|T_own|`, `|A_core|`, `|Q|`.
5. **Formalisation & Validation by Reimplementation** — write a
   platform-agnostic spec; reimplement it; load the **same** dataset into the
   new system; run identical scenarios on both and **diff the outputs**;
   compute the scope-reduction figure.

## 4. Repository architecture (the reimplementation)

Monorepo (pnpm + Turborepo). One Next.js app serves everything:

```
packages/
  domain-kit/    DDD primitives: Result, Entity, AggregateRoot, DomainEvent
  plugin-sdk/    Contract interfaces (auth, content, asset-type, tracker, …)
  platform-kit/  Framework-agnostic infra: EventBus, PluginRegistry,
                 JwtService, HTTP error mapping, requireAuth  ← shared by all 3
domains/
  moodle-core / glpi-core / redmine-core   (bounded contexts, DDD + tests)
plugins/
  mod-page / mod-video / mod-url           (Moodle content plugins)
  asset-computer / asset-network / asset-printer   (GLPI asset types)
  tracker-bug / tracker-feature / tracker-support  (Redmine trackers)
apps/web/
  Single Next.js app. Landing at /, platforms at /moodle /glpi /redmine.
  API at /api/<platform>/*. One Prisma client per platform
  (src/generated/<platform>-client), each pointing at its own Neon database
  (neondb / glpi / redmine). Per-platform composition root + JWT secret.
```

Key architectural point (and the paper's practical proof): **the same
`platform-kit` runs all three platforms in one process**; only the domain and
the plugins differ. There is **no NestJS** — the API is Next.js Route Handlers
wired by a hand-written composition root (a "composition root" replaces
dependency injection).

Deployment: a single Vercel project, Root Directory `apps/web`, six env vars
(`MOODLE/GLPI/REDMINE_DATABASE_URL` + `*_JWT_SECRET`). The three Neon databases
live in one Neon project.

## 5. Honest status — read this carefully

**The deployed apps are provisional demonstrations of architectural
transferability. They are NOT validated contract extractions.** Specifically:

- **Only Moodle** had its real legacy system instrumented (`research/moodle`,
  PHP + MariaDB) and its contracts extracted from the running legacy.
- **Even Moodle** was never validated on a *shared* dataset: the legacy was
  seeded with PHP seeds (Portuguese, IFAL-themed) and the reimplementation with
  an independent TypeScript seed (English). They were never diffed on identical
  inputs.
- **GLPI**'s legacy was never run (only a `research/glpi/docker-compose.yml`
  exists); **Redmine** has no legacy setup at all. Their contracts were
  *designed by analogy*, not extracted from an instrumented legacy.
- All datasets are **tiny** (dozens of records).

So the paper is currently correct in claiming only Moodle is validated (its
Results table has `(TODO)` for GLPI/Redmine). **Do not treat "it's online" as
"it's validated" — that would be an overclaim.**

## 6. The two gaps to close (the whole point of the collaboration)

1. **One dataset, two destinations.** Build one deterministic dataset generator
   per platform (in **English**) that loads the *same* data into both the legacy
   and the reimplementation, so Step 5 becomes a real output diff.
2. **Institutional scale, ~3–4 years (8 semesters).** Replace the tiny seeds
   with large, temporally realistic data:
   - Moodle: ~4,000 students, ~120 teachers, ~200 courses, thousands of
     activities, hundreds of thousands of grades, **millions** of attendance
     records.
   - GLPI: ~5,000 assets, ~4,000 requesters, ~40 technicians, ~50,000 tickets,
     hundreds of thousands of follow-ups.
   - Redmine: ~40 projects, ~50 developers, ~30,000 issues, hundreds of
     thousands of time entries and journal notes.

The full step-by-step is in `docs/RESEARCH-REPLICATION.md`.

## 7. The paper

`~/Desktop/Projects/system-evolution/SANER-2027/main.tex` (on the maintainer's
machine, not in this repo). Five-step methodology; Moodle rows filled;
GLPI/Redmine rows `(TODO)`; External-validity paragraph says the full cycle ran
only on Moodle. Measured numbers from collaborators' results flow into the paper
**after review** — collaborators should not edit the paper directly.

## 8. Collaboration model

The maintainer is testing a novel way to hand off an experiment: instead of a
meeting, the entire reasoning and build history is captured here, and **Claude
Code guides each collaborator through the experiment**. Contributors become
**co-authors** — both for the experiment work and for helping validate this
Claude-as-team-sync method itself.

Workflow: each researcher works on a branch `researcher/<name>`, saves outputs
under `results/<platform>/`, and opens a PR when a platform (or a step) is
complete. See `docs/COLLABORATION.md`.

## 9. How a collaborator starts (no file-reading required)

In their cloned repo, inside Claude Code, they run:

```
/experiment            # Claude explains everything and sets them up
/experiment-step 1     # …then works through steps 1–5, one at a time
/experiment-status     # review progress and save results to their branch
```

Claude reads this file and the two guides for them and drives the whole thing
conversationally.
