# PA#2 plan: Harness and quality gate

**Due:** Thu Nov 26, 22:00. You have 8 days. **Worth:** 100 points, which is 4% of the course.

This assignment isn't about features. It checks four things: rules for your AI assistant, checks that run on every change, a CI that **really blocks** a bad merge, and a written contract for **one endpoint** with tests that enforce it. The grader only looks at what the repository shows, including its git history.

## Team status (update this table in every PR that finishes a task)

Last updated: 2026-11-18 by Khoi.

| Task                                 | Owner | Status                                             | Evidence                                          |
| ------------------------------------ | ----- | -------------------------------------------------- | ------------------------------------------------- |
| 1.1 Public repo                      | K     | Done; Bao (`gbao23127157`) added with Write access | https://github.com/linhkhoi1309/ai-travel-planner |
| 1.2 `.gitignore` first               | K     | Done                                               | commit 93fccb2                                    |
| 1.3 Scaffold + 4 checks              | K     | Done                                               | commit 8b72b0c                                    |
| 1.4 AI-LOG.md                        | K     | Done                                               | `AI-LOG.md`                                       |
| 1.5 IA#3 CONTRACT.md sections to Bao | K     | Done                                               | sent privately                                    |
| 2.1 CI workflow                      | K     | Done                                               | `.github/workflows/ci.yml`, run 44291324404       |
| 2.2 CI can fail                      | K     | Done                                               | PR #1 (red Lint, merge BLOCKED, closed)           |
| 2.3 Branch protection                | K     | Done                                               | `docs/branch-protection.png`                      |
| 2.4 PR-only from now                 | K     | Done                                               | direct push rejected                              |
| 2.5 CLAUDE.md draft                  | B     | Done                                               | PR #5                                             |
| 3.1 `.env.example`                   | B     | Done                                               | PR #6                                             |
| 3.2 3-tier permissions               | B     | Done                                               | PR #5 (`CLAUDE.md`, `.claude/settings.json`)      |
| 3.3 API key spending cap             | K     | $5 prepaid credit, auto-reload off                 | screenshot kept privately                         |
| 3.4 README model + cap section       | K     | PR open                                            | README "Model and spending cap"                   |
| 4.1 Contract                         | B     | PR open; changes requested in Khoi's review (4.2)  | PR #7                                             |
| 6.1 Endpoint code                    | B     | Draft PR, waits for #7                             | PR #8                                             |
| Day 2 AI-LOG entry                   | K     | Done                                               | PR #2                                             |
| Bao's Day 2 AI-LOG entries           | B     | Done                                               | PR #9                                             |

## How we stay in sync

- This file and `AI-LOG.md` live in the repo. Run `git switch main && git pull` before starting work.
- Change the plan or the status only through a PR, like any other file.
- Course PDFs (rubric, brief, self-assessment template) are **not** in this public repo; share them privately.

---

## ⚠️ Read these traps first

1. **Don't rebase or rewrite history** after the work is done. If you do, the evidence for criteria 4 and 6 (the CI and the tests) no longer counts.
2. **Turn on branch protection early.** After that, nobody may push straight to `main`. Every change goes through a PR.
3. **Never commit a secret, even briefly.** A key that was later removed still costs points.
4. **Never change a test and the code in the same commit just to make it pass.** That can drop criterion 6 to 0–2 points.
5. The shared place data only comes out **Nov 27, after the deadline**. Use your own small fixture data for now.

---

## Phase 0: Setup (Day 1, Nov 18–19)

- [ ] Create a **public** GitHub repo. Add all teammates.
- [ ] Pick the stack. A suggestion: TypeScript with Node/Express or Next.js, using ESLint, Prettier, `tsc` and Vitest/Jest + Supertest.
- [ ] Add `.gitignore` (including `.env`) **before** the first commit.
- [ ] Copy `AI-LOG.md` into the repo root and **write entries as you go**.
- [ ] Choose the endpoint (see Phase 4).

## Phase 1: Rules file, criterion 1 (15 pts)

- [ ] Use `CLAUDE.md` if you use Claude Code. Use `AGENTS.md` or `.github/copilot-instructions.md` for other tools.
- [ ] Keep it **short**, with exactly four sections: **Stack, Commands, Conventions, Never**.
- [ ] The **Never** list must be about this product:
  - no model API key in the browser bundle
  - no real model call in unit tests (mock it)
  - never edit a test, the eval data or a validator rule to make a check pass
- [ ] **At least 2 lines must trace back to a real mistake**, through a commit or an AI-LOG entry. Example: "the AI wrote a CI step with `|| true`, so we added the rule _never swallow exit codes in CI_." Write these down as they happen.
- [ ] Edit it by hand. A pasted template scores only 3–7.

## Phase 2: Permissions and secrets, criterion 2 (10 pts)

- [ ] Write the assistant's permissions in **3 tiers**: _allowed / ask first / never_. Put them in the rules file or in `.claude/settings.json` plus a doc.
- [ ] Add `.env.example` listing **every** variable, with **no values**.
- [ ] Set a **spending cap** on the model API key, and state it in the README along with which model you use.
- [ ] Optional: add a secret scanner such as gitleaks to CI.

## Phase 3: One command per check, criterion 3 (10 pts)

- [ ] Add one script each for `lint`, `format:check`, `typecheck` and `test`.
- [ ] The README documents exactly these commands.
- [ ] CI runs **the very same commands**, with no variations.
- [ ] Do a fresh clone, follow the README, and confirm everything goes green.

## Phase 4: The endpoint contract, criterion 5 (25 pts, the biggest)

- [ ] Write it in `docs/contract/<endpoint>.md`, **using the same sections as `CONTRACT.md` from IA#3**. That file isn't in this folder, so find your IA#3 copy.
- [ ] **My recommended endpoint:** `PUT /groups/{groupId}/members/{userId}/spending-cap`
  - It has a clear ownership rule: a member may change only their own cap.
  - It doesn't depend on the LLM or on the shared place data.
  - PUT is naturally idempotent, which is easy to state and test.
  - It must say what happens to a saved plan that no longer fits the new cap. For example, the plan gets flagged as `invalidated` and the group is notified.
  - Other options: `POST /plans/{planId}/save`, which depends on the validator, or `GET /places`, which needs paging and data.
- [ ] The contract must include:
  - **Who may call it:** the role plus the ownership rule, and the status for another user's data (403 or 404; pick one and justify it).
  - **Request and response shape** with field rules: types, min/max, VND as an integer, and so on.
  - **Every error** as RFC 9457 problem details (`type`, `title`, `status`, `detail`), with each `type` URI listed alongside its status. Typical errors: 400 validation, 401 unauthenticated, 403 not owner, 404 group or member not found, 409/422 cap above the group total.
  - **Idempotency or paging**, whichever applies.
  - **What happens when it changes**: side effects and versioning.
- [ ] The test: could a stranger write a client from this file alone?

## Phase 5: Minimal implementation and contract tests, criterion 6 (15 pts)

- [ ] Implement just that endpoint, with an in-memory or SQLite store and a stub for auth.
- [ ] Tests follow the contract:
  - [ ] the success path, checking the response body shape as well as the status
  - [ ] **each error `type`**, asserting the problem-details body
  - [ ] ownership: another user's cap returns the status your contract names
  - [ ] idempotency: the same PUT twice gives the same result
- [ ] The tests must run in the **required** CI.
- [ ] **Deliberate break:** open a PR where the _code_ violates the contract (for example, it returns 200 for someone else's cap). CI goes red. Then fix the **code, not the test**, in a separate commit. Save the links.

## Phase 6: CI that blocks a merge, criterion 4 (20 pts)

- [ ] Use GitHub Actions on `pull_request` and on `push` to main, running the Phase 3 commands.
- [ ] **Check that CI can actually fail.** No `|| true` and no `continue-on-error`. If the AI writes such a step, log it in AI-LOG. That gives you both a rules-file story and a good Rejected entry.
- [ ] Protect `main`: require a PR, require the status checks, and block direct pushes.
- [ ] Take a **screenshot** of the branch-protection settings.
- [ ] Open a PR with a red check that GitHub blocks from merging, then the commit that turns it green. The Phase 5 break can serve as this.

## Phase 7: Submission (Nov 25–26)

- [ ] `PA2.md` at the root, linking to: the repo, the protection screenshot, the blocked PR, the PR that turned green, the CI run for the tag, and the deliberate contract break.
- [ ] `AI-LOG.md` with real **Changed / Rejected** entries.
- [ ] `SELF_ASSESSMENT_REPORT.md`: one row per criterion (all 7), marks claimed, evidence for each, and "What we did not manage". **Score honestly.** A gap within ±10 costs nothing, but over-claiming is penalised.
- [ ] Tag the submitted commit `pa2` and push the tag. Confirm CI runs on the tag.
- [ ] Zip the repo **including `.git`** as `<ID1>-<ID2>-<ID3>_<total>.zip`, with IDs in ascending order. One member submits from their student Google account.

---

## Team decisions (answers to the open questions)

1. Who is on the team, and what are their student IDs (for the zip name)?
   Luong Linh Khoi - Student ID: 23127396
   Nguyen Hoang Gia Bao - Student ID: 23127157
2. Which stack and which AI tool will you use? This decides whether you write `CLAUDE.md` or `AGENTS.md`.
   I will use Claude
3. Do you have the **IA#3 `CONTRACT.md`** section list? The contract must follow it.
   Yes I have
4. Is the spending-cap endpoint OK, or do you prefer another one?
   OK

---

# Detailed plan and task assignment

## Team and roles

| Code  | Member               | Student ID | Role                                                                                              |
| ----- | -------------------- | ---------- | ------------------------------------------------------------------------------------------------- |
| **K** | Luong Linh Khoi      | 23127396   | **Harness owner**: repo, tooling, CI, branch protection, contract tests, submission               |
| **B** | Nguyen Hoang Gia Bao | 23127157   | **Contract owner**: rules content, secrets, the contract, the endpoint code, the deliberate break |

**Why this split:** Bao writes the contract and the code, and Khoi writes the tests **only from the contract file**. If Khoi can't write a test without asking Bao, the contract isn't specific enough to pass the "a stranger could write a client" check. It also leaves real PRs and commits from both of you in the history.

Zip name: `23127157-23127396_<total>.zip` (IDs in ascending order, so Bao's comes first).

## Fixed decisions (agree on these Day 1, then don't change them)

- **AI tool:** Claude Code, so the rules file is `CLAUDE.md` plus `.claude/settings.json`.
- **Stack:** TypeScript, Node 22, Express, Vitest + Supertest, ESLint (typescript-eslint), Prettier, `tsc --noEmit`. These are my suggestions; change them on Day 1 if you prefer something else.
- **Endpoint:** `PUT /groups/{groupId}/members/{userId}/spending-cap`
- **Contract file:** `docs/contract/spending-cap.md`, with the same section headings as IA#3 `CONTRACT.md`.
- **Workflow:** after Day 2 (branch protection ON), **every change goes through a PR** reviewed by the other person. Never push to `main`, never force-push, never rebase `main`.
- **Commands** (identical in the README and CI):
  ```
  npm ci
  npm run lint          # eslint .
  npm run format:check  # prettier --check .
  npm run typecheck     # tsc --noEmit
  npm test              # vitest run
  ```

## Target repo layout

```
.github/workflows/ci.yml
.claude/settings.json
docs/contract/spending-cap.md
docs/branch-protection.png
src/app.ts                 # express app (exported for tests)
src/server.ts              # listen()
src/routes/spendingCap.ts
src/problem.ts             # RFC 9457 helper
src/store.ts               # in-memory groups/members/plans + seed fixtures
src/auth.ts                # stub: user id from header, e.g. Authorization: Bearer <userId>
tests/spendingCap.contract.test.ts
.env.example  .gitignore  .prettierrc  eslint.config.js  tsconfig.json  package.json
README.md  CLAUDE.md  AI-LOG.md  PA2.md  SELF_ASSESSMENT_REPORT.md
```

---

## Day-by-day tasks

### Day 1 (Wed Nov 18): setup. No protection yet, so direct pushes are OK today only.

| #   | Task                                                                                                                | Owner | Done when                      |
| --- | ------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------ |
| 1.1 | Create a **public** GitHub repo `ai-travel-planner` and add B as collaborator (Admin or Maintain)                   | **K** | B can push                     |
| 1.2 | **First commit:** `.gitignore` (`node_modules`, `.env`, `.env.*` but keep `!.env.example`, `dist`, `coverage`)      | **K** | committed before anything else |
| 1.3 | Scaffold: `package.json`, TS, ESLint, Prettier, Vitest, empty `src/app.ts` with a `GET /health`, and 1 trivial test | **K** | all 4 commands green locally   |
| 1.4 | Copy `AI-LOG.md` into the root and add the first entry (the scaffolding)                                            | **K** | file in repo                   |
| 1.5 | Send B the IA#3 `CONTRACT.md` section list                                                                          | **K** | B has it                       |
| 1.6 | Read the rubric criteria 1, 2, 5 and 6 and the brief section 3 ("Fixed for every team")                             | **B** | —                              |

### Day 2 (Thu Nov 19): CI and protection

| #   | Task                                                                                                                                                                                                                                                                                                                                 | Owner | Done when                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----- | ------------------------------------------------ |
| 2.1 | `.github/workflows/ci.yml`: on `pull_request`, `push` to `main` and `push` of tags. One job `checks`: checkout, setup-node 22 with npm cache, `npm ci`, then the 4 commands **as separate steps**. No `continue-on-error`, no `\|\| true`                                                                                            | **K** | workflow green on main                           |
| 2.2 | **Prove CI can fail:** on a scratch branch, add a lint error, open a PR, see red, then close it. If Claude's first version of the workflow couldn't fail, write that in AI-LOG (Rejected)                                                                                                                                            | **K** | red run seen                                     |
| 2.3 | **Branch protection on `main`** (Settings → Branches or Rulesets): require a PR, 1 approval, require the status check `checks`, require the branch to be up to date, **do not allow bypass** (also for admins), block force pushes and deletions                                                                                     | **K** | screenshot saved to `docs/branch-protection.png` |
| 2.4 | From now on: **no direct pushes to main.** Tell B                                                                                                                                                                                                                                                                                    | **K** | —                                                |
| 2.5 | Draft `CLAUDE.md` (branch `docs/claude-md`): four sections **Stack / Commands / Conventions / Never**, under ~40 lines. Never list: no model key in the browser bundle; no real model call in unit tests; never edit a test, eval data or validator rule to make a check pass; never push to main or force-push; never commit `.env` | **B** | PR merged (K reviews)                            |

### Day 3 (Fri Nov 20): permissions, secrets, README

| #   | Task                                                                                                                                                                                                                                                                                                                                                                   | Owner | Done when                 |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------- |
| 3.1 | `.env.example` with every variable and no values: `PORT=`, `NODE_ENV=`, `ANTHROPIC_API_KEY=`, `MODEL_NAME=`                                                                                                                                                                                                                                                            | **B** | PR merged                 |
| 3.2 | **3-tier permissions:** a `## Permissions` section in `CLAUDE.md` (Allowed: read files, run the 4 check commands, edit `src/` and `docs/` / Ask first: install dependencies, edit `tests/`, edit CI, any git push / Never: read `.env`, `git push --force`, push to main, print secrets) **plus** `.claude/settings.json` with matching `allow` / `ask` / `deny` rules | **B** | PR merged                 |
| 3.3 | Create the model API key in the Anthropic Console and **set a monthly spend limit** (e.g. $5). Keep the key only in your local `.env`                                                                                                                                                                                                                                  | **B** | screenshot kept privately |
| 3.4 | README: project summary, setup (`npm ci`, `cp .env.example .env`), **the 4 commands exactly as CI runs them**, "Model and spending cap" section (model name, cap amount, "the key lives only in the backend")                                                                                                                                                          | **K** | PR merged                 |
| 3.5 | Optional: add a gitleaks secret-scan step to CI                                                                                                                                                                                                                                                                                                                        | **K** | —                         |

### Days 4–5 (Sat–Sun Nov 21–22): the contract (25 pts)

| #   | Task                                                                                                                                 | Owner | Done when                   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | ----- | --------------------------- |
| 4.1 | Write `docs/contract/spending-cap.md` with the IA#3 headings. It must cover everything listed below                                  | **B** | PR opened                   |
| 4.2 | Review it **as a stranger**: list every question you'd need answered to write a test or client. B fixes each one **in the contract** | **K** | PR merged, 0 open questions |

**What the contract must decide (B):**

- **Who may call it:** an authenticated user who is a **member of `groupId`**, and **only when `userId` == the caller**. Choose and justify the status codes: a non-member gets `404` (don't reveal the group exists); a member editing someone else's cap gets `403`.
- **Request:** `{ "capVnd": integer }`. Rules: integer (no decimals, no strings), `0 ≤ capVnd ≤ group.totalVnd`, maybe a multiple of 1,000; unknown fields are rejected or ignored (pick one).
- **Response 200:** `{ groupId, userId, capVnd, updatedAt, affectedPlans: [{ planId, status }] }`
- **Errors (RFC 9457, `application/problem+json`)**, each with its `type` URI and status:
  - `…/problems/unauthenticated`: 401
  - `…/problems/validation-error`: 400 (with an `errors[]` extension naming the field)
  - `…/problems/not-a-member`: 404
  - `…/problems/not-your-cap`: 403
  - `…/problems/member-not-found`: 404
  - `…/problems/cap-exceeds-group-total`: 422
- **Idempotency:** a PUT with the same body twice gives the same state and the same response (`updatedAt` unchanged if the value is unchanged; decide and say so).
- **Effect on saved plans:** saved plans in the group whose per-person cost for this member now exceeds `capVnd` are marked `needs-revalidation`; they are **not** deleted or edited, and they're listed in `affectedPlans`.
- **Changes and versioning:** how the contract will change (additive only; breaking changes mean a new version), plus a changelog section.

### Days 6–7 (Mon–Tue Nov 23–24): code, tests, deliberate break

Work on **two branches in parallel**, both based on the merged contract.

| #   | Task                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 | Owner        | Done when                                        |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ | ------------------------------------------------ |
| 6.1 | Branch `feat/spending-cap`: `store.ts` seed (1 group, total 4,000,000; 4 members; 1 saved plan), `auth.ts` stub, `problem.ts`, the route. Follow the contract exactly                                                                                                                                                                                                                                                                                                                                | **B**        | PR green and merged                              |
| 6.2 | Branch `test/spending-cap-contract`: written **from the contract file only**, one test per rule: success 200 with body shape; **each** error `type` with the full problem body (`type`, `title`, `status`, content-type `application/problem+json`); ownership (another member's cap gives 403; a non-member gives 404); validation edge cases (string, decimal, negative, above total); idempotency (same PUT twice); saved plan flagged `needs-revalidation`. **Mock nothing that calls a model.** | **K**        | merged after 6.1 (or together if both are ready) |
| 6.3 | **Deliberate contract break (criterion 6), done as a recorded PR:** branch `break/ownership`, change **only `src/`** so the route skips the ownership check (another member's cap returns 200). Open a PR titled "Deliberate contract break: skip ownership check". CI goes **red** and **merge is blocked**                                                                                                                                                                                         | **B**        | screenshot plus link to the red run              |
| 6.4 | On the **same PR**, push a **separate commit** that fixes the code (restores the check), **without touching `tests/`**. CI goes green, then merge                                                                                                                                                                                                                                                                                                                                                    | **B**        | link to the green commit                         |
| 6.5 | Log 6.3/6.4 in AI-LOG, plus any test or code Claude wrote that you changed or rejected                                                                                                                                                                                                                                                                                                                                                                                                               | **B**, **K** | entries added                                    |

> 6.3/6.4 give you the evidence for **both** criterion 4 (a blocked PR plus the commit that turned it green) and criterion 6 (a deliberate break).

### Day 8 (Wed Nov 25): polish and verify

| #   | Task                                                                                                                                                                          | Owner         | Done when           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------- | ------------------- |
| 8.1 | **Fresh-clone test:** clone into a new folder, follow only the README, run all 4 commands, everything green. Fix the README via PR if anything's off                          | **B**         | done on B's machine |
| 8.2 | Update `CLAUDE.md`: add **≥ 2 lines that trace back to something real** that went wrong this week, each citing the AI-LOG entry or commit. Delete generic lines               | **K** + **B** | PR merged           |
| 8.3 | Read the AI-LOG together: each person has real Kept/Changed/Rejected entries, and the model plus estimated cost per plan is stated ("not used yet in PA#2; key capped at $X") | **K** + **B** | —                   |
| 8.4 | History check: no secret anywhere (`git log -p \| grep -i "sk-ant"` returns nothing). Also run gitleaks if added                                                              | **K**         | clean               |

### Day 9 (Thu Nov 26): submit (finish before 20:00, the deadline is 22:00)

| #   | Task                                                                                                                                                                                                                                                   | Owner                       | Done when     |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | ------------- |
| 9.1 | `PA2.md` at the root: links to the repo, `docs/branch-protection.png`, the blocked PR (6.3), the green commit/PR (6.4), the deliberate break, and the CI run for the tag (filled in after 9.4)                                                         | **K**                       | PR merged     |
| 9.2 | `SELF_ASSESSMENT_REPORT.md`: both members listed, 7 rows (criteria 1–7, max 15/10/10/20/25/15/5), honest claims with **an evidence link on every row**, "What we did not manage", "What we would do differently". Both agree on the total              | **B** drafts, **K** reviews | PR merged     |
| 9.3 | Final check: everything merged, main green                                                                                                                                                                                                             | **K**                       | —             |
| 9.4 | `git tag pa2` then `git push origin pa2`. Wait for the tag's CI run to go green and put its link in PA2.md through a final PR. Then move the tag to that final commit (`git tag -f pa2` + `git push -f origin pa2`; this moves only the tag, not main) | **K**                       | tag run green |
| 9.5 | Zip the repo **including `.git`**, named `23127157-23127396_<total>.zip` with total = the self-assessment total                                                                                                                                        | **K**                       | —             |
| 9.6 | Submit from **one** student account (`23127396@student.hcmus.edu.vn`)                                                                                                                                                                                  | **K**                       | submitted     |

---

## Summary by person

**Khoi (K):** repo and scaffold · CI workflow and proving it can fail · branch protection and screenshot · README · contract review as a stranger · all contract tests · history and secret check · PA2.md · tag, zip, submit.

**Bao (B):** CLAUDE.md draft · `.env.example` · 3-tier permissions and `.claude/settings.json` · API key spending cap · **the contract** · endpoint code · deliberate break PR and fix · fresh-clone test · self-assessment draft.

**Both:** review each other's PRs (required by protection) · AI-LOG entries **as you go**, each person logging their own work · real-story lines in CLAUDE.md.

## Rules to protect your score

- Never edit `tests/` and `src/` in the same commit to make something pass.
- Never rebase, squash-rewrite or force-push `main`. Use "Create a merge commit" or "Squash and merge" on GitHub; both are fine.
- Every claim in the self-assessment needs a link (file, commit, PR or CI run).
- Write down real AI mistakes as they happen. They are your evidence for criteria 1 and 7.
