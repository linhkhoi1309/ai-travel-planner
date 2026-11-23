import express, { Router, type RequestHandler } from 'express';
import { authenticate, parsePositiveId } from '../auth.js';
import { sendProblem, type FieldError } from '../problem.js';
import type { Store } from '../store.js';

// PUT /v1/groups/{groupId}/members/{userId}/spending-cap
// Spec: docs/contract/spending-cap.md section 4.1. The checks run in the
// contract's order, so the body is read as raw bytes, and a read error (such
// as a body over the limit) is kept until its step instead of ending the request.

const PATH = '/v1/groups/:groupId/members/:userId/spending-cap';
const MAX_CAP_VND = 1_000_000_000;
const CAP_STEP_VND = 1_000;
const MAX_BODY_BYTES = 10_240;

const rawBody = express.raw({ type: () => true, limit: MAX_BODY_BYTES });

/** Reads the body into req.body (a Buffer), keeping any read error in res.locals. */
const readBody: RequestHandler = (req, res, next) => {
  rawBody(req, res, (err?: unknown) => {
    if (err !== undefined) res.locals.bodyError = err;
    next();
  });
};

function isTooLarge(err: unknown): boolean {
  return typeof err === 'object' && err !== null && (err as { status?: unknown }).status === 413;
}

/**
 * Contract 4.1: media type application/json in any case; a charset parameter,
 * if present, must be utf-8 (any case, quoted or not); other parameters ignored.
 */
function isJsonMediaType(contentType: string | undefined): boolean {
  if (contentType === undefined) return false;
  const [mediaType, ...params] = contentType.split(';');
  if (mediaType?.trim().toLowerCase() !== 'application/json') return false;
  for (const param of params) {
    const eq = param.indexOf('=');
    if (eq === -1 || param.slice(0, eq).trim().toLowerCase() !== 'charset') continue;
    let value = param.slice(eq + 1).trim();
    if (value.length >= 2 && value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    if (value.toLowerCase() !== 'utf-8') return false;
  }
  return true;
}

/** Decodes the body as UTF-8 and parses it; undefined when it is not valid JSON. */
function parseJson(body: unknown): { value: unknown } | undefined {
  const bytes = Buffer.isBuffer(body) ? body : Buffer.alloc(0);
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { value: JSON.parse(text) as unknown };
  } catch {
    return undefined;
  }
}

function validateBody(body: unknown): FieldError[] {
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return [{ pointer: '', detail: 'must be a JSON object' }];
  }
  const capVnd: unknown = (body as Record<string, unknown>).capVnd;
  if (capVnd === undefined) {
    return [{ pointer: '/capVnd', detail: 'is required' }];
  }
  if (
    typeof capVnd !== 'number' ||
    !Number.isInteger(capVnd) ||
    capVnd < 0 ||
    capVnd > MAX_CAP_VND ||
    capVnd % CAP_STEP_VND !== 0
  ) {
    return [
      {
        pointer: '/capVnd',
        detail: `must be an integer from 0 to ${MAX_CAP_VND} and a multiple of ${CAP_STEP_VND}`,
      },
    ];
  }
  return [];
}

export function spendingCapRouter(store: Store, now: () => Date): Router {
  const router = Router();

  router.put<typeof PATH>(PATH, readBody, (req, res, next) => {
    // 1. authenticated
    const callerId = authenticate(req, store);
    if (callerId === null) {
      res.set('WWW-Authenticate', 'Bearer');
      sendProblem(res, 'unauthenticated', 'Send Authorization: Bearer <token>.');
      return;
    }

    // 2. group exists and the caller is a member (same answer for both)
    const groupId = parsePositiveId(req.params.groupId);
    const group = groupId === null ? undefined : store.groups.get(groupId);
    if (group === undefined || !group.members.has(callerId)) {
      sendProblem(res, 'group-not-found', 'No group with this id is visible to you.');
      return;
    }

    // 3. the target member exists in this group
    const userId = parsePositiveId(req.params.userId);
    const member = userId === null ? undefined : group.members.get(userId);
    if (member === undefined) {
      sendProblem(res, 'member-not-found', 'This group has no member with this id.');
      return;
    }

    // 4. ownership: a member may change only their own cap
    if (member.userId !== callerId) {
      sendProblem(res, 'not-your-cap', 'You can only change your own spending cap.');
      return;
    }

    // 5. media type
    if (!isJsonMediaType(req.get('content-type'))) {
      sendProblem(res, 'unsupported-media-type', 'Send Content-Type: application/json.');
      return;
    }

    // 6. body size (a read error other than the size is a 500)
    const bodyError: unknown = res.locals.bodyError;
    if (bodyError !== undefined) {
      if (isTooLarge(bodyError)) {
        sendProblem(res, 'payload-too-large', `The body is larger than ${MAX_BODY_BYTES} bytes.`);
      } else {
        next(bodyError);
      }
      return;
    }

    // 7. valid JSON (UTF-8)
    const parsed = parseJson(req.body);
    if (parsed === undefined) {
      sendProblem(res, 'invalid-json', 'The request body is not valid JSON.');
      return;
    }
    const body = parsed.value;

    // 8. field rules
    const errors = validateBody(body);
    if (errors.length > 0) {
      const detail =
        errors.length === 1 ? '1 field is invalid' : `${errors.length} fields are invalid`;
      sendProblem(res, 'validation', detail, { errors });
      return;
    }
    const capVnd = (body as { capVnd: number }).capVnd;

    // 9. not above the group total (equal is allowed)
    if (capVnd > group.totalVnd) {
      sendProblem(
        res,
        'cap-exceeds-group-total',
        `capVnd ${capVnd} is above the group total of ${group.totalVnd}.`,
        { groupTotalVnd: group.totalVnd },
      );
      return;
    }

    // 10. store; updatedAt moves only when the value changes (idempotent PUT)
    if (member.capVnd !== capVnd) {
      member.capVnd = capVnd;
      member.updatedAt = now().toISOString();
    }

    // Flag every saved plan of this group that the cap no longer fits.
    // Plans are never deleted or edited, and raising a cap never unflags one.
    const affectedPlans: { planId: number; status: string }[] = [];
    const plans = [...store.plans.values()]
      .filter((plan) => plan.groupId === group.id)
      .sort((a, b) => a.id - b.id);
    for (const plan of plans) {
      const cost = plan.costPerMemberVnd.get(member.userId) ?? 0;
      if (cost > capVnd) {
        plan.status = 'needs-revalidation';
        affectedPlans.push({ planId: plan.id, status: plan.status });
      }
    }

    res.status(200).json({
      groupId: group.id,
      userId: member.userId,
      capVnd,
      updatedAt: member.updatedAt,
      affectedPlans,
    });
  });

  // Any other method: 405 before auth, so it reveals nothing (contract 4.1).
  // Express drops the body of a HEAD response itself.
  router.all(PATH, (req, res) => {
    res.set('Allow', 'PUT');
    sendProblem(res, 'method-not-allowed', `${req.method} is not allowed here; use PUT.`);
  });

  return router;
}
