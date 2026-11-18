# CLAUDE.md

AI Travel Planner backend (CSC13114, 23KTPM1). PA#2 is the harness: checks, CI, and one endpoint contract.

## Stack

- TypeScript (strict, `noUncheckedIndexedAccess`), Node 22, ESM (`"type": "module"`, imports end in `.js`).
- Express 5. In-memory store for now; no database, no model calls yet.
- Vitest + Supertest for tests, ESLint (typescript-eslint), Prettier, `tsc --noEmit`.

## Commands

```sh
npm ci
npm run lint          # eslint .
npm run format:check  # prettier --check .   (npm run format to fix)
npm run typecheck     # tsc --noEmit
npm test              # vitest run
```

CI runs exactly these four, in this order. Don't add a variant to CI that isn't in the README.

## Conventions

- `docs/contract/spending-cap.md` is the spec. If code and contract disagree, the code is wrong; change the contract only in its own commit that says why.
- Errors are RFC 9457 problem details (`application/problem+json`), built with `src/problem.ts`. Money is an integer number of VND.
- `createApp()` builds a fresh app and store, so every test starts from the seed.
- One task per branch, one PR per task; the other teammate reviews. Update the status table in `docs/PLAN.md` when a PR finishes a task.
- Check a command's exit code by running it bare. `cmd | tail; echo $?` reports the exit code of `tail`, which is how a broken check once looked green (AI-LOG 2026-11-18, scaffold).
- Line endings are LF (`.gitattributes`). CRLF made `prettier --check` pass on Windows and fail on Linux CI (AI-LOG 2026-11-18, scaffold).

## Never

- Never put a model API key (or any secret) in the browser bundle, in the repo, or in a log. Keys live in the backend `.env` only.
- Never make a real model call in unit tests; mock the model client.
- Never edit a test, the eval data or a validator rule to make a check pass. Fix the code, or change the contract in its own commit.
- Never change `tests/` and `src/` in the same commit to turn a check green.
- Never add `|| true` or `continue-on-error` to CI. A check that cannot fail proves nothing.
- Never push to `main`, force-push, or rebase shared history. Never use `gh pr merge --admin` to get past a red or unreviewed PR (AI-LOG 2026-11-18, Day 2).
- Never commit `.env`, and never read or print it.

## Permissions

Mirrored in `.claude/settings.json` (`allow` / `ask` / `deny`).

- **Allowed:** read the repo (except `.env`), run the four check commands and `npm run format`, read-only git (`status`, `diff`, `log`), edit `src/` and `docs/`.
- **Ask first:** install or remove dependencies, edit `tests/`, `.github/`, `package.json` or this file, any `git commit` or `git push`, any `gh` command that writes.
- **Never:** read `.env`, `git push --force`, push to `main`, `gh pr merge --admin`, print a secret.
