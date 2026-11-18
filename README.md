# AI Travel Planner

Class project for CSC13114 (23KTPM1). Team: Luong Linh Khoi (23127396), Nguyen Hoang Gia Bao (23127157).

## Setup

Requires Node.js 22 or later.

```sh
npm ci
```

## Checks

These are the exact commands CI runs, in this order. Each one must pass before a PR can merge.

| Check        | Command                |
| ------------ | ---------------------- |
| Lint         | `npm run lint`         |
| Format check | `npm run format:check` |
| Type check   | `npm run typecheck`    |
| Tests        | `npm test`             |

`npm run format` rewrites files to fix formatting.

## Run locally

```sh
npm run dev   # http://localhost:3000/health
```
