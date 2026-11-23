import type { Response } from 'express';

// RFC 9457 problem details. Slugs, statuses and titles come from
// docs/contract/spending-cap.md section 2; keep the two in step.
export const PROBLEM_BASE = 'https://ai-travel-planner.example/problems/';

export const PROBLEMS = {
  unauthenticated: { status: 401, title: 'Authentication required' },
  'group-not-found': { status: 404, title: 'Group not found' },
  'member-not-found': { status: 404, title: 'Member not found' },
  'not-your-cap': { status: 403, title: 'Not your spending cap' },
  'unsupported-media-type': { status: 415, title: 'Unsupported media type' },
  'payload-too-large': { status: 413, title: 'Payload too large' },
  'invalid-json': { status: 400, title: 'Malformed JSON' },
  validation: { status: 400, title: 'Invalid request' },
  'cap-exceeds-group-total': { status: 422, title: 'Cap exceeds group total' },
  'method-not-allowed': { status: 405, title: 'Method not allowed' },
  internal: { status: 500, title: 'Internal error' },
} as const;

export type ProblemSlug = keyof typeof PROBLEMS;

export interface FieldError {
  pointer: string;
  detail: string;
}

export function sendProblem(
  res: Response,
  slug: ProblemSlug,
  detail: string,
  extensions: Record<string, unknown> = {},
): void {
  const { status, title } = PROBLEMS[slug];
  res
    .status(status)
    .type('application/problem+json')
    .send(JSON.stringify({ type: PROBLEM_BASE + slug, title, status, detail, ...extensions }));
}
