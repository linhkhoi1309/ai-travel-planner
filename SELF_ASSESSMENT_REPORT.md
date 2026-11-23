# Self-assessment — PA#2 (Harness and quality gate)

Submitted by:

- 23127157 — Nguyen Hoang Gia Bao
- 23127396 — Luong Linh Khoi

Total we claim: **95 / 100**

Repository: https://github.com/linhkhoi1309/ai-travel-planner

| #   | Criterion                   | Max | We claim | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | --------------------------- | --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rules file                  | 15  | 14       | `CLAUDE.md`: Stack / Commands / Conventions / Never, plus Permissions. The Never list is about this product (model key, real model calls in tests, editing tests or eval data). Lines with a story: the `\| tail; echo $?` exit code and CRLF (AI-LOG 2026-11-18, scaffold), `gh pr merge --admin` (AI-LOG 2026-11-18, Day 2), course files and Prettier (AI-LOG 2026-11-18, Bao), body parser before the checks (AI-LOG 2026-11-23, contract review). Not 15: see "What we did not manage" |
| 2   | Permissions and secrets     | 10  | 10       | Three tiers in `CLAUDE.md` § Permissions, mirrored in `.claude/settings.json` (PR #5). `.env.example` lists every variable without values (PR #6). README "Model and spending cap" (PR #14): $5 monthly spend limit, $5 prepaid, auto-reload off. gitleaks scans the whole history on every CI run (PR #10; run 45115877930 on `main`: 40 commits, no leaks)                                                                                                                                |
| 3   | One command for every check | 10  | 10       | README "Checks" table and `.github/workflows/ci.yml` run the same commands as separate steps: dependency audit, lint, format check, type check, tests. Fresh clone of `main` at bb5861e, following only the README: `npm ci`, `cp .env.example .env`, then all four checks exit 0, 107 tests passed (AI-LOG 2026-11-23, final fresh clone)                                                                                                                                                  |
| 4   | CI that blocks a merge      | 20  | 19       | `main` protected: PR, 1 approval, required check `checks`, admins included (`docs/branch-protection.png`, PR #4). **Blocked PR #13**: red runs 45114456886 and 45114641521, then the **commit that turned it green**, b0109ba (run 45115019713). PR #1 went red on Lint and showed `BLOCKED`. A direct push was rejected (AI-LOG 2026-11-18, Day 2). `git log --first-parent main` shows only merged PRs since protection                                                                   |
| 5   | Contract of one endpoint    | 25  | 23       | `docs/contract/spending-cap.md` (PR #7): who may call and the ownership rule with why each status, request and response field rules, eleven problem types with status and title (RFC 9457), check order, what happens to saved plans, idempotency, versioning and changelog, a seed in Appendix A. Reviewed by Khoi as a stranger: ten questions, each answered in its own commit. Not 25: plan statuses after a refusal are not observable over HTTP yet                                   |
| 6   | Contract tests that bite    | 15  | 14       | `tests/spendingCap.contract.test.ts` (PR #12), written from the contract alone and run by the required `checks` job: 106 tests, every problem `type`, ownership (403, and 404 for a non-member), idempotency, check order. Red on #12 before the code, green after. Deliberate break: PR #13 (5 ownership tests red, fix in `src/` only, `tests/` untouched). Ten deliberate breaks of PR #8 each caught (AI-LOG 2026-11-23, contract tests)                                                |
| 7   | AI-LOG.md                   | 5   | 5        | `AI-LOG.md`: tool and task for each entry, real Changed / Rejected lines, for example the check that could not fail (2026-11-18, scaffold) and the body parser that answered before auth (2026-11-23)                                                                                                                                                                                                                                                                                       |
|     | **Total**                   | 100 | **95**   |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |

## What we did not manage

- `CLAUDE.md` is 53 lines with a fifth section (Permissions) and a working-style line carried over from IA#2 ("End every answer with a numbered list…"), where the top band asks for a short file with the four sections.
- There is no test view of the store (`createApp({ store })`) in Appendix A, so "a failed request changes nothing" is checked for caps but not for plan statuses.
- `500 internal` is untested: nothing in the contract triggers it. An unknown `Content-Encoding` also gives a 500 (checked by hand on 2026-11-23), where a 415 would be the honest answer.
- No `CODEOWNERS` on `tests/` and `.github/`. With two members it would duplicate the rule we already have (one approval from the other person on every PR), and naming one owner per folder would leave that owner unable to get their own changes approved. We would add it once the team grows.
- `npm run format:check` fails locally when Claude Code's `.claude/settings.local.json` exists; CI never sees that file.
- There are no model calls in PA#2, so nothing yet checks that names and money never reach the model.

## What we would do differently

- Have the contract reviewed before writing any code. Ten review questions turned into ten contract commits and a second round on PR #8.
- Merge small PRs the same day. Several PRs sat open together, so `docs/PLAN.md` and `AI-LOG.md` kept needing merges from `main`.
