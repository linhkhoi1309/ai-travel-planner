import type { Request } from 'express';
import type { Store } from './store.js';

// PA#2 auth stub (contract Appendix A): `Authorization: Bearer <userId>`.
// Real sign-in replaces this in PA#3 without changing the endpoint contract.

const POSITIVE_INT = /^[1-9][0-9]*$/;

export function parsePositiveId(raw: string | undefined): number | null {
  if (raw === undefined || !POSITIVE_INT.test(raw)) return null;
  const id = Number(raw);
  return Number.isSafeInteger(id) ? id : null;
}

/** Returns the caller's user id, or null when the request is unauthenticated. */
export function authenticate(req: Request, store: Store): number | null {
  const header = req.get('authorization');
  if (header === undefined) return null;
  const match = /^Bearer ([^\s]+)$/i.exec(header.trim());
  const userId = parsePositiveId(match?.[1]);
  if (userId === null || !store.users.has(userId)) return null;
  return userId;
}
