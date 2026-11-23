# CLAUDE.md

AI Travel Planner backend (CSC13114, 23KTPM1), team Khoi + Bao. PA#2 (due 2026-11-26 22:00) is the harness: checks, CI that blocks a merge, and one endpoint contract with tests. The plan and who owns what are in `docs/PLAN.md`. Written deliverables are in English.

## Stack

- TypeScript (strict, `noUncheckedIndexedAccess`), Node 22, ESM (`"type": "module"`, relative imports end in `.js`).
- Express 5. In-memory store (`src/store.ts`), auth stub (`src/auth.ts`). No database and no model calls in PA#2.
- Vitest + Supertest, ESLint (typescript-eslint), Prettier, `tsc --noEmit`. GitHub Actions, job `checks`.

## Commands

```sh
npm ci
npm audit --omit=dev --audit-level=high
npm run lint          # eslint .
npm run format:check  # prettier --check .   (npm run format to fix)
npm run typecheck     # tsc --noEmit
npm test              # vitest run
npm run dev           # http://localhost:3000, stop with Ctrl+C
```

CI runs the audit and the four checks, in this order, as separate steps (after a gitleaks secret scan). README, CI and this file list the same commands; change all three together.

## Conventions

- `docs/contract/spending-cap.md` is the spec for `PUT /v1/groups/{groupId}/members/{userId}/spending-cap`. If code and contract disagree, the code is wrong. Change the contract only in its own commit that says why, with a changelog line.
- Errors are RFC 9457 problem details built with `src/problem.ts`. Money is an integer number of VND, never a float or a string.
- `createApp()` returns a fresh app and store seeded from contract Appendix A, so each test starts clean.
- One task per branch, one PR per task, reviewed by the other teammate. Update the status table in `docs/PLAN.md` in the PR that finishes a task.
- Record every assistant-assisted task in `AI-LOG.md` (Tool / Asked for / Kept / Changed / Rejected), as it happens.
- Check a command's exit code by running it bare. `cmd | tail; echo $?` reports `tail`'s exit code, which is how a broken check once looked green (AI-LOG 2026-11-18, scaffold).
- Line endings are LF (`.gitattributes`). CRLF made `prettier --check` disagree between Windows and Linux CI (AI-LOG 2026-11-18, scaffold).
- No body parser (`express.json()`, `express.text()`) in front of the spending-cap route: it answers before the auth and ownership checks, or turns a bad body into a 500. The route reads raw bytes and checks them in contract order (AI-LOG 2026-11-18 and 2026-11-23, spending-cap).
- We work on Windows, in a path with spaces. In Node, use `fileURLToPath(import.meta.url)`, never `new URL(...).pathname`.
- End every answer with a numbered list of the user's next steps.

## Never

- Never put a model API key in the browser bundle, the repo or a log. Keys live in the backend `.env` only.
- Never make a real model call in unit tests; mock the model client.
- Never let the model read the database or do money math: data only through the backend tools, money only in code. Never send names or email addresses to a model.
- Never edit a test, the eval data or a validator rule to make a check pass. Never change `tests/` and `src/` in the same commit to turn a check green.
- Never add `|| true` or `continue-on-error` to CI. A check that cannot fail proves nothing.
- Never push to `main`, force-push, or rebase shared history. Never `gh pr merge --admin` past a red or unreviewed PR (AI-LOG 2026-11-18, Day 2).
- Never commit `.env` or the course files (rubric, brief, templates, IA#3 `CONTRACT.md`); keep them outside the repo folder, or Prettier checks them locally (AI-LOG 2026-11-18, Bao).

## Permissions

Mirrored in `.claude/settings.json` (`allow` / `ask` / `deny`).

- **Allowed:** read the repo (except `.env`), run the four checks and `npm run format`, read-only git (`status`, `diff`, `log`), edit `src/` and `docs/`.
- **Ask first:** install or remove dependencies; edit `tests/`, `.github/`, `package.json`, `.claude/` or this file; any `git commit`, `git push` or `gh` command that writes.
- **Never:** read or print `.env` or any secret, `git push --force`, push to `main`, `gh pr merge --admin`.
