# Call for Collaboration

## Why you're here

Public institutions run open-source platforms they **cannot switch off** and
**cannot afford to rewrite** — Moodle for learning, GLPI for IT service
management, Redmine for project tracking. This research proposes a third path
between "keep the legacy forever" and "big-bang rewrite": **extract the domain
contracts** embedded in each platform's extension layer and reimplement them,
incrementally, on a modern stack — preserving the plugin architecture, without
interrupting service.

The paper (`SANER-2027/`) develops a five-step methodology and validates it in
depth on **Moodle**. We now want to raise **GLPI** and **Redmine** to the same
evidentiary standard — and, honestly, to redo Moodle too, because two things
were missing the first time (see `docs/RESEARCH-REPLICATION.md`):

1. the legacy and the reimplementation used **different datasets**, so outputs
   were never diffed on identical inputs; and
2. the datasets were **tiny** — we now want **institutional scale, ~3–4 years**
   of simulated use (thousands of students, and proportional volumes for IT
   tickets and project issues).

**You are invited to take one platform (or one step) and carry it through the
full methodology.** Your work becomes a validated case study and a co-authored
contribution.

## What we're asking you to produce

For your chosen platform, the five steps end-to-end (details in
`docs/RESEARCH-REPLICATION.md`):

1. Minimum core definition · 2. Extension selection · 3. Legacy in Docker + one
large multi-year dataset loaded into it · 4. Contracts extracted from the
running legacy (measured `|T_own|`, `|A_core|`, `|Q|`) · 5. Reimplementation
validated against the legacy on the **same** dataset, with output diffs and a
scope-reduction figure.

The non-negotiables: **one dataset generator loading both legacy and new**, in
**English**, at **institutional scale**.

## How to work in the repository

1. **Clone** and install:
   ```bash
   git clone https://github.com/flaviomotamedeiros/research-platforms-evolution.git
   cd research-platforms-evolution
   pnpm install
   ```
2. **Create your branch** — one branch per researcher:
   ```bash
   git checkout -b researcher/<your-name>
   ```
3. **Do the work** and **save all results** under `results/<platform>/` on your
   branch (structure in `docs/RESEARCH-REPLICATION.md` §5): decisions, legacy
   setup, dataset generator + final counts, extracted contract specs with
   measured numbers, and validation diffs.
4. **Commit to your branch and push:**
   ```bash
   git add results/
   git commit -m "results(<platform>): <what you did>"
   git push -u origin researcher/<your-name>
   ```
5. Keep everything on your branch. Open a Pull Request when a platform (or a
   step) is complete so we can review together before it informs the paper.

> Please don't edit `SANER-2027/main.tex` directly — coordinate with the
> maintainer; measured numbers flow into the paper after review.

## Ground rules

- **Reproducibility over speed.** Pin every version (platform, plugins, DB);
  seed deterministically; document how to re-run.
- **Same dataset, both sides.** If it wasn't diffed on identical inputs, it's
  not validated.
- **Honesty about scope.** A working demo is not a validated contract. Say what
  you actually verified.

## Getting started — let Claude guide you (no file-reading needed)

This experiment is designed to be handed off **through Claude Code**. You don't
have to read the docs yourself — Claude reads them and walks you through
everything. In your cloned repo, open Claude Code and run:

```
/experiment            # explains the project, checks your setup, creates your branch, picks a platform
/experiment-step 1     # …then work through steps 1–5, one command at a time
/experiment-status     # review progress and save results to your branch
```

Prefer to read first? `docs/RESEARCH-REPLICATION.md` has the full method and
`docs/DESIGN-NOTES.md` the complete background. Either way, pick a platform,
create your `researcher/<name>` branch, and save results under
`results/<platform>/`. Questions welcome — ask Claude, or the maintainer.

Thank you for helping make legacy modernisation in the public sector a little
less impossible.
