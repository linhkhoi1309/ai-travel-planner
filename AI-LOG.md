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

## 2026-11-23 — spending-cap contract tests (Khoi, task 6.2)

Tool: Claude Code (Claude Opus 5.5).
Asked for: contract tests written from `docs/contract/spending-cap.md` alone, one per contract sentence, each refusal followed by a check that the state did not change (session 7, Demo 3).
Kept: 106 tests in `tests/spendingCap.contract.test.ts`, every problem `type`/`title`/`status` from section 2, the check order of 4.1, and the Appendix A seed tables. A refusal is shown to change nothing by repeating the owner's last PUT: by the idempotency rule it must return the identical body, and a faked clock moves forward between requests, so a changed cap cannot hide inside one millisecond.
Changed: proved the tests can fail before trusting the green run against PR #8. In a throwaway copy of the PR #8 code, ten deliberate breaks (ownership skipped, 403 instead of 404 for a non-member, cap stored before the 422 check, `updatedAt` moved on a repeat, `>=` for plan cost, 405 after auth, charset unchecked, body parsed before the 403, multiple-of-1000 dropped, `>=` for the group total) each turned at least one test red. The first try at one break was a `sed` that broke the file, so "exit 1" there proved nothing; it was redone and caught by 2 tests.
Changed: the assistant checked lint as `npm run lint | tail; echo $?`, the exact mistake from the Day 1 entry, so `lint=0` was `tail`'s code. Re-ran every check bare: lint 0, format 0, typecheck 0.
Rejected: tests for plan statuses that are not listed in `affectedPlans` (e.g. Appendix A: plan 2 stays `needs-revalidation`), and for the `500 internal` problem. Neither is observable over HTTP yet; the plan statuses wait for the store view requested in the PR #7 review.

## 2026-11-23 — deliberate contract break and fix (Bao, tasks 6.3–6.5)

Tool: Claude Code (Claude Opus 5.5).
Asked for: the deliberate break on branch `break/ownership` (only `src/`, the route skips the ownership check), a PR titled "Deliberate contract break: skip ownership check", then the fix as a separate commit on the same PR without touching `tests/` (PR #13).
Kept: the break commit ad4d740 deletes step 4 of contract 4.1, so user 1 changing user 2's cap gets 200 instead of `403 not-your-cap`. CI was red in the Tests step only (lint, format and typecheck green), with 5 of 107 tests failing, the 5 Khoi's PR #12 predicted for this break; merge was BLOCKED. Red runs 45114456886 and 45114641521. The fix commit b0109ba puts the 5 lines back; `src/` then matches `main` byte for byte, 107/107 pass, green run 45115019713.
Changed: Khoi merged PR #4 while the first run was going, so the PR showed BEHIND. The assistant merged `main` into the branch instead of rebasing (no rewritten history), and the merge commit was red again because the break was then the only difference from `main`.
Changed: the assistant paused after the red runs instead of pushing the fix at once, so Bao could screenshot the blocked merge first; the fix would have turned CI green within a minute and left no blocked state to capture.
Changed: locally `npm run format:check` fails on `.claude/settings.local.json`, an ignored per-user file CI never sees. The assistant checked `src` and `tests` with Prettier directly and let CI's full format step confirm the rest.
Rejected: touching `tests/` in either commit, and updating the `docs/PLAN.md` status table here. Open PR #11 rewrites that table, so the 6.3/6.4 rows go in #11 to avoid two PRs conflicting on it.

## 2026-11-23 — model, spending cap and README (Khoi, tasks 3.3, 3.4)

Tool: Claude Code (Claude Opus 5.5), with Claude in Chrome to read the Anthropic Console and set its spend limit.
Asked for: set a spend limit on the model API key (3.3, taken over from Bao) and write the README section on the model and the cap (3.4).
Kept: Claude Sonnet 5.5 as the model, and a $5 cap. The brief (section 5) leaves the provider to the team; we compared a Gemini free tier and kept Claude.
Changed: before any credit was bought, the Console showed no spend-limit setting (checked Workspaces, Rate limits, Billing and Usage; only token rate limits), so the first README draft named the prepaid balance as the cap. After Khoi bought $5 of credit (auto-reload off), a "Spend limits" page appeared with an organization monthly limit of $500 by default. With Khoi's go-ahead, the assistant set it to $5 in the Console and read it back ("Spend limit saved"; the Default workspace inherits it). The README now names both guards. Khoi entered the payment details and confirmed the purchase; the assistant did not handle the payment or the key.
Rejected: the assistant's first README line, "the model client is mocked". There is no model client in PA#2, so the line described code that does not exist; it now says tests will mock the client once it exists.

## 2026-11-23 — PA2.md (Khoi, task 9.1)

Tool: Claude Code (Claude Opus 5.5).
Asked for: `PA2.md` with the six links the rubric names.
Kept: one table, one row per rubric link, each pointing at a PR, a commit or a CI run read back with `gh run view`.
Changed: the blocked PR is #13, not #1. PR #1 was closed and never turned green, so it cannot be "the PR that turned green"; #13 has both the red runs and the commit that greened it. PR #1 stays as earlier proof that CI can fail.
Rejected: a guessed tag-run link. The `pa2` tag does not exist yet; the row says so and is filled in at task 9.4.

## 2026-11-23 — self-assessment after Khoi's review of PR #11 (Bao)

Tool: Claude Code (Claude Opus 5.5).
Asked for: Khoi's five review points on PR #11: evidence links instead of task numbers, claims against the bands, today's real gaps, the template headings, and `main` merged in.
Kept: Khoi's suggested claims (total 91 → 95) and his evidence, after checking each one: run 45115877930 scanned 40 commits with no leaks, `git log --first-parent main` has only PR merges since protection, and a PUT with `Content-Encoding: br-unknown` against `npm run dev` returned `500 internal` (a plain PUT returned 200).
Changed: `main`'s status table was older than the review assumed (no 3.5 or 6.2–6.5 rows, 3.3 still Todo), so "take main's rows" was not enough. The merge builds one table from `main`, PR #14's 3.3/3.4 rows and the merged PRs.
Rejected: trimming `CLAUDE.md` to the four sections in this PR. Editing it needs Bao's go-ahead, and the Permissions section is criterion 2's evidence; the gap is named under "What we did not manage" and row 1 stays 14.

## 2026-11-23 — final fresh clone and self-assessment cleanup (Khoi)

Tool: Claude Code (Claude Opus 5.5).
Asked for: re-run the fresh-clone test on the final `main`, then remove the "Before we submit" checklist from `SELF_ASSESSMENT_REPORT.md`.
Kept: the run. The public repo cloned at bb5861e into a new folder, Node 22.17.1: `npm ci`, `cp .env.example .env`, then lint, format check, type check and tests, each run bare: all exit 0, 107 tests passed. The server answered `/health` with 200, and a PUT of user 1's cap returned 200 with plan 1 flagged.
Changed: the server was started with `tsx src/server.ts`, the command behind `npm run dev` without watch mode, so it could be stopped cleanly after the check.
Rejected: nothing.
