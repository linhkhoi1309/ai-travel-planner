# AI Travel Planner

Class project for CSC13114 (23KTPM1). Team: Luong Linh Khoi (23127396), Nguyen Hoang Gia Bao (23127157).

A group of friends plans a day in Ho Chi Minh City: an agent proposes a schedule and a spending plan from checked place data, and the backend validates it before the group sees it. PA#2 builds the harness around one endpoint, `PUT /v1/groups/{groupId}/members/{userId}/spending-cap`; its contract is [`docs/contract/spending-cap.md`](docs/contract/spending-cap.md) and its contract tests are in `tests/`.

## Setup

Requires Node.js 22 or later.

```sh
npm ci
cp .env.example .env   # then fill in .env locally; never commit it
```

PA#2 needs no values in `.env`: the checks and the tests run without a model key.

## Checks

These are the exact commands CI runs, in this order. Each one must pass before a PR can merge.

| Check            | Command                                   |
| ---------------- | ----------------------------------------- |
| Dependency audit | `npm audit --omit=dev --audit-level=high` |
| Lint             | `npm run lint`                            |
| Format check     | `npm run format:check`                    |
| Type check       | `npm run typecheck`                       |
| Tests            | `npm test`                                |

`npm run format` rewrites files to fix formatting.

Before these, CI runs a secret scan over the whole git history with [gitleaks](https://github.com/gitleaks/gitleaks) 8.30.1. Any finding fails the job, even for a key that was later deleted. To run it locally, install gitleaks and run:

```sh
gitleaks git --redact --verbose .
```

## Run locally

```sh
npm run dev   # http://localhost:3000/health
```

## Model and spending cap

|                           |                                                                                                                                                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider and model        | Anthropic, Claude Sonnet 5.5 (`MODEL_NAME=claude-sonnet-5-5`)                                                                                                                                                                                               |
| Spending cap              | **$5 per month**, as the organization's monthly spend limit in the Anthropic Console (it also applies to the workspace that holds the key). The account is prepaid with $5 of credit and auto-reload is off, so API requests stop when the balance runs out |
| Where the key lives       | `ANTHROPIC_API_KEY` in the backend's local `.env` only. Never in the browser bundle, the repository, a log or CI                                                                                                                                            |
| Cost of one plan          | Not measured yet: PA#2 makes no model calls. We measure it when the agent runs in PA#3 and record it here and in `AI-LOG.md`                                                                                                                                |
| What is sent to the model | Only places and interests, never names or email addresses (brief, section 3)                                                                                                                                                                                |

There is no model client in PA#2. When one is added, unit and contract tests mock it and never call a real model (`CLAUDE.md`, Never).
