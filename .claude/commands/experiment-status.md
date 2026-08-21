---
description: Review experiment progress and save results to your branch
---

Review the collaborator's progress on the experiment and help them save it.

1. Read context: `docs/RESEARCH-REPLICATION.md` (the five steps) and
   `docs/DESIGN-NOTES.md` (background). Identify the platform from
   `results/*/00-intent.md` on the current branch.
2. Inspect `results/<platform>/` and compare what exists against the five steps.
   Report clearly: what is done, what is partial, what is missing — and whether
   the two hard requirements (same dataset in legacy + reimplementation;
   institutional scale) are satisfied so far.
3. Confirm they are on their own branch (`git branch --show-current` should be
   `researcher/<name>`, not `main`). If they are on `main`, help them move their
   work to a researcher branch.
4. Offer to **commit and push** their latest results to their branch, and — when
   a platform is complete — to open a Pull Request for review (the maintainer
   folds measured numbers into the paper after review).

Be concrete and honest about what still counts as unvalidated.

$ARGUMENTS
