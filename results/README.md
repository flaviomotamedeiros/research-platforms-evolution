# Results

Each collaborator works on their own branch (`researcher/<name>`) and saves the
outcome of the methodology here, under `results/<platform>/`.

Expected structure per platform (see `docs/RESEARCH-REPLICATION.md` §5):

```
results/<platform>/
  01-core-and-extensions.md    Steps 1–2: minimum core + selected extensions
  02-legacy-setup.md           Docker versions, plugin list, how to reproduce
  03-dataset/                  Canonical generator + final row counts report
  04-contracts/                Extracted specs + measured |T_own|, |A_core|, |Q|
  05-validation/               Scenarios, output diffs, scope-reduction numbers
```

This folder starts empty on `main`; completed work lands on researcher branches
and is merged after review.
