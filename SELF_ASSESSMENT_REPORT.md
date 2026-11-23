# Self-assessment — PA#2 (Harness and quality gate)

Submitted by:

- 23127157 — Nguyen Hoang Gia Bao
- 23127396 — Luong Linh Khoi

Total we claim: **91 / 100** (draft, see "Before we submit")

Repository: https://github.com/linhkhoi1309/ai-travel-planner

| #   | Criterion                   | Max | We claim | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                             |
| --- | --------------------------- | --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Rules file                  | 15  | 14       | `CLAUDE.md`: Stack / Commands / Conventions / Never, plus Permissions. The Never list is about this product (model key, real model calls in tests, editing tests or eval data). Lines with a story: the `\| tail; echo $?` exit code and CRLF (AI-LOG 2026-11-18, scaffold), `gh pr merge --admin` (AI-LOG 2026-11-18, Day 2), course files and Prettier (AI-LOG 2026-11-18, Bao), body parser before the checks (AI-LOG 2026-11-23) |
| 2   | Permissions and secrets     | 10  | 9        | Three tiers in `CLAUDE.md` § Permissions, mirrored in `.claude/settings.json` (PR #5). `.env.example` lists every variable without values (PR #6). `git log --all -p` has no key (task 8.4). Spend limit on the key and the README section: tasks 3.3 and 3.4                                                                                                                                                                        |
| 3   | One command for every check | 10  | 10       | README "Checks" table and `.github/workflows/ci.yml` run the same four commands as separate steps. Fresh clone of `main` at cd84c6c: all four exit 0 (AI-LOG 2026-11-23, fresh clone)                                                                                                                                                                                                                                                |
| 4   | CI that blocks a merge      | 20  | 18       | `main` protected: PR, 1 approval, required check `checks`, admins included (`docs/branch-protection.png`, PR #4). PR #1 went red on Lint and showed `BLOCKED`. A direct push was rejected (AI-LOG 2026-11-18, Day 2). Since then every change to `main` is a merged PR (`git log --first-parent main`). Red PR turned green: task 6.3/6.4                                                                                            |
| 5   | Contract of one endpoint    | 25  | 22       | `docs/contract/spending-cap.md` (PR #7): who may call and the ownership rule with why each status, request and response field rules, eleven problem types with status and title (RFC 9457), check order, what happens to saved plans, idempotency, versioning and changelog, a seed in Appendix A. Reviewed by Khoi as a stranger: ten questions, each answered in its own commit                                                    |
| 6   | Contract tests that bite    | 15  | 13       | `tests/spendingCap.contract.test.ts` written from the contract alone (task 6.2), run by the required `checks` job. Deliberate break: task 6.3/6.4                                                                                                                                                                                                                                                                                    |
| 7   | AI-LOG.md                   | 5   | 5        | `AI-LOG.md`: tool and task for each entry, real Changed / Rejected lines, for example the check that could not fail (2026-11-18, scaffold) and the body parser that answered before auth (2026-11-23)                                                                                                                                                                                                                                |
|     | **Total**                   | 100 | **91**   |                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## What we did not manage

<!-- Draft. Rewrite from what is really missing on the day we submit. -->

- The model API key, its spend limit and the README section about it came last (tasks 3.3, 3.4), after the endpoint work.
- PR #8, the endpoint, was written before the contract review and had to be changed for four of Khoi's ten answers (Bearer spacing, `405`, charset, `413`).
- There are no model calls in PA#2, so nothing yet checks the rule that money and names never reach the model.

## What we would do differently

- Have the contract reviewed before writing any code. Ten review questions turned into ten contract commits and a second round on PR #8.
- Merge small PRs the same day. Several PRs sat open together, so `docs/PLAN.md` and `AI-LOG.md` kept needing merges from `main`.

## Before we submit (delete this section)

Each condition below must hold on the `pa2` tag, or the claim drops to the number shown:

| #   | Condition                                                                        | If not met |
| --- | -------------------------------------------------------------------------------- | ---------- |
| 2   | 3.3 spend limit set and 3.4 README "Model and spending cap" merged               | 7          |
| 4   | PR #4 (screenshot) merged; 6.3/6.4 gives a red PR and the commit that greened it | 14         |
| 5   | PR #7 merged                                                                     | 0          |
| 6   | 6.2 merged and run in CI                                                         | 0          |
| 6   | 6.3/6.4 deliberate break shown red in CI                                         | 10         |

Fill in the links (PRs, commits, CI runs) once they exist, and check that the zip name
`23127157-23127396_<total>.zip` uses the final total.
