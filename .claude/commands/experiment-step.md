---
description: Guide one methodology step of the experiment (usage:/experiment-step <1-5>)
---

The collaborator wants to work through **methodology step `$ARGUMENTS`** of the
domain-contract-extraction experiment. Guide them concretely and do the work
*with* them — write scripts, run commands, inspect output — rather than
lecturing. Never make them read files; you read and explain.

## Load context (silently)

- `docs/RESEARCH-REPLICATION.md` — the authoritative description of all five
  steps and the two hard requirements. Focus on the requested step.
- `docs/DESIGN-NOTES.md` — background, architecture, contract taxonomy.
- The collaborator's platform: read `results/*/00-intent.md` on the current
  branch to find which platform they chose; if none, ask and record it.

## The five steps (guide the one named in `$ARGUMENTS`)

1. **Minimum Core Definition** — help them delimit the platform's minimal
   functional core; write it to `results/<platform>/01-core-and-extensions.md`.
2. **Extension Selection** — pick the real legacy write / read / plugin-type
   extensions (see the table in DESIGN-NOTES); justify with the three criteria;
   append to `01-core-and-extensions.md`.
3. **Environment Instrumentation** — stand up the legacy in Docker
   (`research/moodle` and `research/glpi` exist; Redmine needs a new compose
   from the official image). Build ONE deterministic dataset generator (English,
   institutional scale ~3–4 years — enforce this) and load it into the legacy.
   Enable SQL statement tracing. Save the generator + final row counts under
   `results/<platform>/03-dataset/` and setup notes in `02-legacy-setup.md`.
4. **Contract Identification** — run exercise scenarios against the instrumented
   legacy; from the traces derive table ownership (`T_own`/`T_src`), core-API
   calls (`A_core`), and the query catalogue (`Q`); classify write vs read;
   record the **measured** counts under `results/<platform>/04-contracts/`.
5. **Formalisation & Validation** — write the platform-agnostic contract spec;
   reimplement it (you may adapt `apps/web` but re-derive from the extracted
   spec); load the **same** dataset into the reimplementation; run identical
   scenarios on both and **diff the outputs**; compute the scope-reduction
   figure. Save everything under `results/<platform>/05-validation/`.

## Always

- Enforce the two requirements: **same dataset in legacy AND reimplementation**,
  and **institutional scale**. If their plan violates either, stop and fix it.
- At the end of the step, help them **commit** the deliverable to their
  `researcher/<name>` branch with a clear message, and tell them the next
  command (`/experiment-step N+1`, or `/experiment-status`).

$ARGUMENTS
