# AI-LOG.md

Team: Luong Linh Khoi (23127396), Nguyen Hoang Gia Bao (23127157).
One entry per task where an assistant did part of the work.

```md
## <YYYY-MM-DD> — <what you were working on>

Tool: <Claude Code / Copilot / Cursor / something else / none>
Asked for: <the task you gave it, in one sentence>
Kept: <what you took as it came>
Changed: <what you rewrote, and why>
Rejected: <what you threw away, and why>
```

## 2026-11-18 — PA#2 plan from the rubric and brief

Tool: Claude Code (Claude Opus 5.5).
Asked for: a plan for PA#2 from the rubric, the brief and the self-assessment template, then a task split for two people.
Kept: the phase order (protection on before feature work) and the endpoint choice, `PUT /groups/{groupId}/members/{userId}/spending-cap`.
Changed: the first draft listed Bao under Khoi's student ID; we corrected both IDs before they reached the zip name.
Rejected: nothing.

## 2026-11-18 — Day 1 scaffold (Khoi)

Tool: Claude Code (Claude Opus 5.5).
Asked for: the repo scaffold: `.gitignore` as the first commit, TypeScript, Express 5, ESLint, Prettier, Vitest + Supertest, and one health test.
Kept: the configs and the four npm scripts `lint`, `format:check`, `typecheck`, `test`.
Changed: the assistant first "verified" the checks with `npm run x | tail; echo $?`, which prints the exit code of `tail`, so it always said 0. We re-ran each check on deliberately broken code without the pipe: lint 1, format 1, typecheck 2, test 1. A check that cannot fail proves nothing.
Changed: git warned that LF would become CRLF on Windows, which would make `prettier --check` disagree between our laptops and Linux CI. Added `.gitattributes` with `eol=lf`.
Rejected: `npm audit fix` (it crashed with an npm internal error). Production dependencies show 0 vulnerabilities; the 11 high findings are in dev-only test tooling (vite via vitest). Re-check after the next vitest release.

## 2026-11-18 — Day 2: CI and branch protection (Khoi)

Tool: Claude Code (Claude Opus 5.5).
Asked for: a GitHub Actions workflow that runs the four README commands, branch protection on `main`, and proof that CI can fail.
Kept: one job `checks` with lint, format check, type check and tests as separate steps (no `|| true`, no `continue-on-error`); protection that requires a PR, 1 approval and the `checks` status, with admins included and force pushes off.
Changed: the first workflow used `actions/checkout@v4` and `actions/setup-node@v4`. The first green run carried a warning that both target the deprecated Node 20 runtime; bumped both to v7 (commit "ci: bump checkout and setup-node to v7").
Changed: tested protection instead of trusting the settings page: a direct `git push origin main` was rejected ("protected branch hook declined"), and PR #1 with a deliberate unused variable went red on the Lint step and showed `BLOCKED`. PR #1 was closed, not merged.
Rejected: the `gh` CLI suggested `gh pr merge --admin` to get past the block. We never bypass the gate; admins are included in the protection rule.
