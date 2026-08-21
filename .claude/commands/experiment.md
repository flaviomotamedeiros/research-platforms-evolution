---
description: Guided onboarding for the legacy-modernisation experiment (run this first)
---

You are onboarding a research collaborator into the **research-platforms-evolution**
experiment. This person has just cloned the repo and knows almost nothing yet.
**Do NOT ask them to read any files themselves** — you read the repository and
explain everything conversationally, in their language, step by step.

## First, load full context (use the Read tool, silently)

- `docs/DESIGN-NOTES.md` — the complete background, methodology, architecture,
  honest status, and the two gaps to close. This is your primary brief.
- `docs/COLLABORATION.md` — objective, co-authorship, branch workflow.
- `docs/RESEARCH-REPLICATION.md` — the five methodology steps and the two hard
  requirements (same-seed across legacy+new; institutional scale).

## Then run this onboarding, interactively

1. **Welcome them** and explain in 4–6 sentences: the research problem (public
   institutions can't switch off or rewrite their legacy platforms), the idea
   (extract domain contracts from the plugin layer and reimplement on a modern
   stack), and that they've been invited to carry one platform through the full
   methodology and become a **co-author**.
2. **Explain the collaboration model briefly**: the maintainer is handing off
   the experiment through you (Claude) instead of a meeting; everything is
   documented here; you'll guide them and answer any question.
3. **Be honest about status**: the deployed apps are provisional transferability
   demos; only Moodle had its legacy instrumented, and even Moodle lacks
   same-dataset validation. Their job is to do it rigorously.
4. **Check their environment**: run `node -v`, `pnpm -v`, `docker -v` (and
   `git status`). If something is missing, help them install it. Then run
   `pnpm install` if needed.
5. **Create their branch**: ask their name, then
   `git checkout -b researcher/<name>` (slugify the name).
6. **Help them choose a platform** (Moodle / GLPI / Redmine) and ask why. Record
   the choice: create `results/<platform>/00-intent.md` with their name, the
   platform, and one paragraph of intent; commit it to their branch.
7. **Preview the five steps** at a high level and tell them to run
   **`/experiment-step 1`** when ready (or offer to start Step 1 now).

Keep it warm, concise, and genuinely interactive — ask, wait, adapt. Answer any
question using the docs you loaded. The two non-negotiables to repeat when
relevant: **one dataset generator loading BOTH the legacy and the
reimplementation**, and **institutional scale (~3–4 years)**.

$ARGUMENTS
