import express, { Router } from 'express';
import { authenticate, parsePositiveId } from '../auth.js';
import { sendProblem, type FieldError } from '../problem.js';
import type { Store } from '../store.js';

// PUT /v1/groups/{groupId}/members/{userId}/spending-cap
// Spec: docs/contract/spending-cap.md section 4.1. The checks run in the
// contract's order, so the body is read as raw text and parsed only at step 6.

const MAX_CAP_VND = 1_000_000_000;
const CAP_STEP_VND = 1_000;

function isJsonMediaType(contentType: string | undefined): boolean {
  if (contentType === undefined) return false;
  const mediaType = contentType.split(';')[0]?.trim().toLowerCase();
  return mediaType === 'application/json';
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

  router.put(
    '/v1/groups/:groupId/members/:userId/spending-cap',
    express.text({ type: () => true }),
    (req, res) => {
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

      // 6. valid JSON
      let body: unknown;
      try {
        body = JSON.parse(typeof req.body === 'string' ? req.body : '');
      } catch {
        sendProblem(res, 'invalid-json', 'The request body is not valid JSON.');
        return;
      }

      // 7. field rules
      const errors = validateBody(body);
      if (errors.length > 0) {
        const detail =
          errors.length === 1 ? '1 field is invalid' : `${errors.length} fields are invalid`;
        sendProblem(res, 'validation', detail, { errors });
        return;
      }
      const capVnd = (body as { capVnd: number }).capVnd;

      // 8. not above the group total (equal is allowed)
      if (capVnd > group.totalVnd) {
        sendProblem(
          res,
          'cap-exceeds-group-total',
          `capVnd ${capVnd} is above the group total of ${group.totalVnd}.`,
          { groupTotalVnd: group.totalVnd },
        );
        return;
      }

      // 9. store; updatedAt moves only when the value changes (idempotent PUT)
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
    },
  );

  return router;
}
