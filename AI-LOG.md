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

## 2026-11-18 — CLAUDE.md, permissions, `.env.example` (Bao)

Tool: Claude Code (Claude Opus 5.5).
Asked for: a `CLAUDE.md` with Stack / Commands / Conventions / Never, the three permission tiers mirrored in `.claude/settings.json`, and `.env.example` (PRs #5, #6).
Kept: the four sections, the product-specific Never list, and the allow / ask / deny tiers.
Changed: the first `settings.json` had `Bash(gh pr merge * --admin:*)`, which mixes the `:*` prefix form with a mid-pattern `*`; rewrote it as one `Bash(gh pr merge*--admin*)` rule.
Changed: `npm run format:check` failed on my laptop but not in CI, because the course files (rubric, brief, IA#3 `CONTRACT.md`) sit untracked in the repo folder and Prettier checks them. They must not be committed, so they are excluded locally in `.git/info/exclude`; that does not stop Prettier, so they have to live outside the repo folder for a local run to match CI.
Changed (by hand): Bao rewrote `CLAUDE.md` starting from the rules file Bao wrote for IA#2. That file was about a different project (SQLite migration, worktrees, `MIGRATION.md`), so those parts were dropped. We kept its working rules (log every assisted task, end each answer with next steps), the Windows path-with-spaces advice, and added the brief's fixed rules to Never (PR #5, commit d247e1c).
Rejected: committing the IA#2 `CLAUDE.md` as it was. An assistant rules file for another project would mislead the assistant here.

## 2026-11-18 — spending-cap contract and endpoint (Bao)

Tool: Claude Code (Claude Opus 5.5).
Asked for: `docs/contract/spending-cap.md` with the IA#3 sections (PR #7), then the endpoint implemented from it (PR #8).
Kept: the order of checks (auth, group, member, ownership, media type, JSON, fields, group total), the `needs-revalidation` rule for saved plans, and the seed in Appendix A.
Changed: the plan named the 404 slug `not-a-member`; the contract uses `group-not-found` because "not a member" already tells an outsider the group exists.
Changed: the first contract said problem responses carry exactly `Content-Type: application/problem+json`, but Express adds `; charset=utf-8`. A smoke run caught it; the contract was clarified in its own commit with a changelog line (no behaviour change).
Changed: with `express.json()` in front, a bad body for someone else's cap got `400 invalid-json` before the `403`. The route now reads the body as text and parses it at step 6, as the contract orders.
Rejected: having the assistant write the contract tests too. Khoi writes them from the contract alone (task 6.2), which is the real test of whether a stranger could build a client from it.

## 2026-11-18 — gitleaks secret scan in CI (Khoi, task 3.5)

Tool: Claude Code (Claude Opus 5.5).
Asked for: a secret-scan step in CI.
Kept: running the gitleaks CLI (8.30.1, pinned, SHA-256 checked) over the whole history as a step in the required `checks` job, with `fetch-depth: 0` on checkout. A separate job would not block merges until it was added to branch protection.
Changed: checked that the step can fail before trusting it: a local scan of the repo found no leaks (exit 0, 17 commits), and a scan of a scratch folder outside the repo with a fake AWS key exited 1. The exit codes were read with `PIPESTATUS`, not through `| tail` (see the scaffold entry).
Rejected: `gitleaks/gitleaks-action`. It only scans the commits in the event, so a tag push scans nothing, and it needs write access to comment on PRs. The plain CLI scans everything with read-only permissions.
