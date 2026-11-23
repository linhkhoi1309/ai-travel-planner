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

## 2026-11-23 — answering Khoi's review of the contract (Bao)

Tool: Claude Code (Claude Opus 5.5).
Asked for: answer the ten questions in Khoi's review of PR #7 in the contract itself, one commit and one changelog line per item, then bring the endpoint in PR #8 in line.
Kept: the answers to items 1–7, 9 and 10 as the assistant drafted them, each citing the RFC it follows (RFC 9110 for the `Authorization` and `Content-Type` rules and for `405` with `Allow: PUT`, RFC 8259 for UTF-8 only).
Changed: item 8 (`WWW-Authenticate`). Khoi proposed asserting only "starts with `Bearer`". We fixed the value to exactly `Bearer` in v1, so a test can compare it whole, and wrote down that clients read only the scheme, so adding RFC 6750 parameters later stays an additive change.
Changed: while updating PR #8 the assistant found that `express.text()` in front of the route ran before step 1: it silently decoded a `latin1` body, and an unknown charset or a body over 100 kB threw into the error handler as a `500`, before the auth check. The route now reads raw bytes with a 10240-byte limit, keeps a read error until step 6, and decodes strict UTF-8 (commit a3afc07). Checked by hand: a 200 kB body for another member's cap still gets `403`, and with no token `401`.
Changed: commits 00bcaf2, 3b99e5e (contract) and a3afc07 (endpoint) were written with the assistant but have no `Co-Authored-By` line, because Bao first asked it to leave this session out of the log. We changed our minds the same day; this entry is the record.
Rejected: keeping the assistant's ad-hoc Supertest probe in `tests/`. It was a throwaway check, deleted after the run; the contract tests are Khoi's to write from the contract alone (task 6.2).

## 2026-11-23 — fresh clone, CLAUDE.md, self-assessment draft (Bao)

Tool: Claude Code (Claude Opus 5.5).
Asked for: the fresh-clone test (8.1), a CLAUDE.md line from something that went wrong this week (8.2), and a first `SELF_ASSESSMENT_REPORT.md` (9.2).
Kept: the fresh-clone run. `main` at cd84c6c, cloned into a new folder, `npm ci` and the four README commands each run bare, all exit 0; `npm run dev` answers `/health`.
Changed: criteria 2, 4 and 6 depend on work that is not merged yet (3.3/3.4, PR #4, 6.2, 6.3/6.4). The draft gives each of those claims its condition and the lower score if the work does not land, so the total can be corrected before the zip is named.
Rejected: fixing the README during the fresh-clone test. It is enough for the checks, but it still lacks `cp .env.example .env` and the "Model and spending cap" section; that is task 3.4 (Khoi), and the cap amount waits for 3.3.
