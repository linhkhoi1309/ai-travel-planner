// Contract tests for PUT /v1/groups/{groupId}/members/{userId}/spending-cap.
// Written from docs/contract/spending-cap.md only. Each test is named after the
// contract sentence it checks; section numbers point into that file. Expected
// values come from the contract and its Appendix A seed, never from the code.
//
// After every refusal we check the state, not just the status: the owner
// repeats their last successful PUT, and the contract (4.1 Idempotency) says
// that repeat must return the identical response. If the refused request had
// changed the cap, `updatedAt` would move and the bodies would differ. The
// clock is faked and moved forward between requests, so a change cannot hide
// inside the same millisecond.

import request from 'supertest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createApp } from '../src/app.js';

type App = ReturnType<typeof createApp>;
type Res = request.Response;
type Id = number | string;

const PROBLEMS = 'https://ai-travel-planner.example/problems/';
const T0 = new Date('2026-11-21T08:30:00.000Z');

const PROBLEM = {
  unauthenticated: [401, 'Authentication required'],
  'group-not-found': [404, 'Group not found'],
  'member-not-found': [404, 'Member not found'],
  'not-your-cap': [403, 'Not your spending cap'],
  'unsupported-media-type': [415, 'Unsupported media type'],
  'payload-too-large': [413, 'Payload too large'],
  'invalid-json': [400, 'Malformed JSON'],
  validation: [400, 'Invalid request'],
  'cap-exceeds-group-total': [422, 'Cap exceeds group total'],
  'method-not-allowed': [405, 'Method not allowed'],
} as const;
type Slug = keyof typeof PROBLEM;

let app: App;

beforeEach(() => {
  // Only Date is faked; real timers keep Express and Supertest working.
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(T0);
  app = createApp();
});

afterEach(() => {
  vi.useRealTimers();
});

const capPath = (groupId: Id, userId: Id) => `/v1/groups/${groupId}/members/${userId}/spending-cap`;

interface PutOptions {
  /** Caller's user id, sent as `Bearer <as>`. Defaults to `userId` (own cap). */
  as?: Id;
  /** The whole Authorization header; `null` sends none. Overrides `as`. */
  auth?: string | null;
  /** Content-Type header; `null` sends none. */
  contentType?: string | null;
}

/** PUT a body; a string is sent byte for byte, anything else as JSON. */
function put(groupId: Id, userId: Id, body: unknown, opts: PutOptions = {}): Promise<Res> {
  const auth = opts.auth === undefined ? `Bearer ${opts.as ?? userId}` : opts.auth;
  const contentType = opts.contentType === undefined ? 'application/json' : opts.contentType;
  const raw = typeof body === 'string' ? body : JSON.stringify(body);

  let req = request(app).put(capPath(groupId, userId));
  if (auth !== null) req = req.set('Authorization', auth);
  req = req.set('Content-Type', contentType ?? 'application/json').send(raw);
  if (contentType === null) req = req.unset('Content-Type');
  return req;
}

/** Move the faked clock forward by one second. */
function tick() {
  vi.setSystemTime(new Date(Date.now() + 1000));
}

function expectProblem(res: Res, slug: Slug) {
  const [status, title] = PROBLEM[slug];
  expect(res.status).toBe(status);
  expect(res.headers['content-type']).toMatch(/^application\/problem\+json\s*(;|$)/i);
  expect(res.body).toMatchObject({ type: PROBLEMS + slug, title, status });
  expect(typeof res.body.detail).toBe('string');
}

/** Store a cap for its owner and return the 200 body. */
async function baseline(groupId: Id, userId: Id, capVnd: number) {
  const res = await put(groupId, userId, { capVnd });
  expect(res.status).toBe(200);
  tick();
  return res.body as unknown;
}

/** Section 4.1: "A failed request changes nothing." The owner's repeat must be identical. */
async function expectCapUnchanged(groupId: Id, userId: Id, capVnd: number, stored: unknown) {
  tick();
  const res = await put(groupId, userId, { capVnd });
  expect(res.status).toBe(200);
  expect(res.body).toEqual(stored);
}

const plans = (...ids: number[]) => ids.map((planId) => ({ planId, status: 'needs-revalidation' }));

describe('4.1 success: the cap is stored and a SpendingCap is returned', () => {
  it('200 with the SpendingCap body and Content-Type application/json (section 4.1 example)', async () => {
    const res = await put(1, 1, { capVnd: 800000 });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/^application\/json\s*(;|$)/i);
    expect(res.body).toEqual({
      groupId: 1,
      userId: 1,
      capVnd: 800000,
      updatedAt: T0.toISOString(),
      affectedPlans: plans(1),
    });
  });

  it.each([
    [4000000, []],
    [900000, []],
    [800000, [1]],
    [500000, [1, 2]],
  ])(
    'Appendix A, from a fresh seed: user 1 sends %i, affectedPlans lists plans %j',
    async (capVnd, ids) => {
      const res = await put(1, 1, { capVnd });

      expect(res.status).toBe(200);
      expect(res.body.capVnd).toBe(capVnd);
      expect(res.body.affectedPlans).toEqual(plans(...ids));
    },
  );

  it('a cap equal to a plan cost fits, so the plan is not listed (900000 vs plan 1)', async () => {
    const res = await put(1, 1, { capVnd: 900000 });
    expect(res.body.affectedPlans).toEqual([]);
  });

  it('a cap equal to the group total is allowed', async () => {
    const res = await put(1, 1, { capVnd: 4000000 });
    expect(res.status).toBe(200);
    expect(res.body.capVnd).toBe(4000000);
  });

  it('0 is a valid cap: the member plans to spend nothing', async () => {
    const res = await put(1, 1, { capVnd: 0 });
    expect(res.status).toBe(200);
    expect(res.body.capVnd).toBe(0);
    expect(res.body.affectedPlans).toEqual(plans(1, 2));
  });

  it('a member of another group sets their own cap: user 5 in group 2, plan 3 no longer fits', async () => {
    const res = await put(2, 5, { capVnd: 1000000 });
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      groupId: 2,
      userId: 5,
      capVnd: 1000000,
      affectedPlans: plans(3),
    });
  });

  it.each(['{"capVnd":800000.0}', '{"capVnd":8e5}'])(
    '%s is the same JSON value as 800000, so it is accepted',
    async (raw) => {
      const res = await put(1, 1, raw);
      expect(res.status).toBe(200);
      expect(res.body.capVnd).toBe(800000);
    },
  );

  it('other fields are ignored', async () => {
    const res = await put(1, 1, { capVnd: 800000, note: 'ignored', capUsd: 30 });
    expect(res.status).toBe(200);
    expect(res.body.capVnd).toBe(800000);
  });

  it.each([
    'Application/JSON',
    'application/json; charset=utf-8',
    'application/json; charset=UTF-8',
    'application/json; charset="utf-8"',
    'application/json; foo=bar',
  ])(
    'Content-Type %s is accepted (media type case-insensitive, utf-8 charset, other parameters ignored)',
    async (ct) => {
      const res = await put(1, 1, { capVnd: 800000 }, { contentType: ct });
      expect(res.status).toBe(200);
    },
  );

  it('a body of exactly 10240 bytes is allowed', async () => {
    const json = '{"capVnd":800000}';
    const raw = json + ' '.repeat(10240 - json.length);
    expect(Buffer.byteLength(raw)).toBe(10240);

    const res = await put(1, 1, raw);
    expect(res.status).toBe(200);
  });

  it.each(['Bearer 1', 'bearer 1', 'BEARER 1', 'Bearer  1', 'Bearer 1 '])(
    'Appendix A token table: "%s" is user 1',
    async (auth) => {
      const res = await put(1, 1, { capVnd: 800000 }, { auth });
      expect(res.status).toBe(200);
      expect(res.body.userId).toBe(1);
    },
  );
});

describe('4.1 idempotency: the same PUT twice has the same effect as once', () => {
  it('a repeat returns the identical response, and updatedAt keeps its old value', async () => {
    const first = await put(1, 1, { capVnd: 800000 });
    tick();
    const second = await put(1, 1, { capVnd: 800000 });

    expect(second.status).toBe(200);
    expect(second.body).toEqual(first.body);
    expect(second.body.updatedAt).toBe(T0.toISOString());
  });

  it('a repeat lists the same plans again', async () => {
    await put(1, 1, { capVnd: 500000 });
    tick();
    const repeat = await put(1, 1, { capVnd: 500000 });
    expect(repeat.body.affectedPlans).toEqual(plans(1, 2));
  });

  it('after 800000 → 900000 → 800000, updatedAt is the time of the third PUT, not the first', async () => {
    await put(1, 1, { capVnd: 800000 });
    tick();
    await put(1, 1, { capVnd: 900000 });
    tick();
    const third = await put(1, 1, { capVnd: 800000 });

    expect(third.body.updatedAt).toBe(new Date(T0.getTime() + 2000).toISOString());
  });
});

describe('4.1 saved plans: a plan the new cap does not fit is flagged and listed', () => {
  it('Appendix A sequence 500000 → 800000 → 4000000 lists plans 1+2, then 1, then none', async () => {
    const step1 = await put(1, 1, { capVnd: 500000 });
    tick();
    const step2 = await put(1, 1, { capVnd: 800000 });
    tick();
    const step3 = await put(1, 1, { capVnd: 4000000 });

    expect(step1.body.affectedPlans).toEqual(plans(1, 2));
    expect(step2.body.affectedPlans).toEqual(plans(1));
    expect(step3.body.affectedPlans).toEqual([]);
  });

  it('lowering a cap below a saved plan cost is allowed (200), not refused', async () => {
    const res = await put(1, 1, { capVnd: 100000 });
    expect(res.status).toBe(200);
  });

  it("other members' caps are not touched", async () => {
    const stored = await baseline(1, 2, 2000000);
    await put(1, 1, { capVnd: 500000 });
    await expectCapUnchanged(1, 2, 2000000, stored);
  });
});

describe('405 method-not-allowed: any method but PUT, before every other check', () => {
  it.each(['get', 'post', 'patch', 'delete', 'options'] as const)(
    '%s gets 405 with Allow: PUT',
    async (method) => {
      const res = await request(app)[method](capPath(1, 1)).set('Authorization', 'Bearer 1');
      expectProblem(res, 'method-not-allowed');
      expect(res.headers['allow']).toBe('PUT');
    },
  );

  it('for any groupId and userId, with or without a token, so it reveals nothing', async () => {
    const res = await request(app).delete(capPath(99, 6));
    expectProblem(res, 'method-not-allowed');
    expect(res.headers['allow']).toBe('PUT');
  });

  it('HEAD has the same status and headers, but no body', async () => {
    const res = await request(app).head(capPath(1, 1));
    expect(res.status).toBe(405);
    expect(res.headers['allow']).toBe('PUT');
    expect(res.text ?? '').toBe('');
  });
});

describe('Step 1, 401 unauthenticated: we do not know who is calling', () => {
  it.each([
    ['no header', null],
    ['Basic 1', 'Basic 1'],
    ['Bearer with no token', 'Bearer'],
    ['two tokens', 'Bearer 1 2'],
    ['a leading zero', 'Bearer 01'],
    ['a sign', 'Bearer +1'],
    ['not a positive id (0)', 'Bearer 0'],
    ['not a positive id (-1)', 'Bearer -1'],
    ['no such user', 'Bearer 7'],
  ])('%s → 401 with WWW-Authenticate exactly Bearer', async (_label, auth) => {
    const res = await put(1, 1, { capVnd: 800000 }, { auth });
    expectProblem(res, 'unauthenticated');
    expect(res.headers['www-authenticate']).toBe('Bearer');
  });

  it('401 comes before 404: no token on an unknown group', async () => {
    const res = await put(99, 1, { capVnd: 800000 }, { auth: null });
    expectProblem(res, 'unauthenticated');
  });

  it('a failed request changes nothing (401 on user 1’s cap)', async () => {
    const stored = await baseline(1, 1, 2000000);
    await put(1, 1, { capVnd: 800000 }, { auth: 'Bearer 7' });
    await expectCapUnchanged(1, 1, 2000000, stored);
  });
});

describe('Step 2, 404 group-not-found: the caller is not a member, or the group is unknown', () => {
  it('a non-member (user 5 on group 1) gets 404, the same response as anyone on group 99', async () => {
    const nonMember = await put(1, 5, { capVnd: 800000 }, { as: 5 });
    const unknown = await put(99, 1, { capVnd: 800000 }, { as: 1 });

    expectProblem(nonMember, 'group-not-found');
    expectProblem(unknown, 'group-not-found');
    expect(nonMember.body).toEqual(unknown.body);
  });

  it('user 6, in no group, gets 404 on group 1', async () => {
    const res = await put(1, 6, { capVnd: 800000 }, { as: 6 });
    expectProblem(res, 'group-not-found');
  });

  it.each(['01', '+1', '-1', '1.0', '1e0', '0', 'abc'])(
    'section 1: groupId "%s" names no group → 404, never 400',
    async (groupId) => {
      const res = await put(groupId, 1, { capVnd: 800000 }, { as: 1 });
      expectProblem(res, 'group-not-found');
    },
  );

  it('the group check comes before the member check (group 99, user 6)', async () => {
    const res = await put(99, 6, { capVnd: 800000 }, { as: 1 });
    expectProblem(res, 'group-not-found');
  });

  it('a failed request changes nothing (user 5 on user 1’s cap in group 1)', async () => {
    const stored = await baseline(1, 1, 2000000);
    await put(1, 1, { capVnd: 800000 }, { as: 5 });
    await expectCapUnchanged(1, 1, 2000000, stored);
  });
});

describe('Step 3, 404 member-not-found: userId is not a member of the group', () => {
  it('user 1 on group 1 for user 6 gets 404 member-not-found', async () => {
    const res = await put(1, 6, { capVnd: 800000 }, { as: 1 });
    expectProblem(res, 'member-not-found');
  });

  it('user 1 on group 1 for user 5 (a member of group 2 only) gets 404 member-not-found', async () => {
    const res = await put(1, 5, { capVnd: 800000 }, { as: 1 });
    expectProblem(res, 'member-not-found');
  });

  it.each(['02', '+2', '2.0', '2e0', '0', '99', 'abc'])(
    'section 1: userId "%s" names no member → 404, never 400',
    async (userId) => {
      const res = await put(1, userId, { capVnd: 800000 }, { as: 1 });
      expectProblem(res, 'member-not-found');
    },
  );

  it('the member check comes before the body checks (bad JSON for user 6)', async () => {
    const res = await put(1, 6, 'not json', { as: 1 });
    expectProblem(res, 'member-not-found');
  });
});

describe('Step 4, 403 not-your-cap: nobody can set another member’s cap', () => {
  it('user 1 on group 1 for user 2 gets 403 (section 4.1 example)', async () => {
    const res = await put(1, 2, { capVnd: 800000 }, { as: 1 });
    expectProblem(res, 'not-your-cap');
  });

  it('a failed request changes nothing: user 2’s cap and updatedAt stay as user 2 stored them', async () => {
    const stored = await baseline(1, 2, 2000000);
    const res = await put(1, 2, { capVnd: 800000 }, { as: 1 });
    expectProblem(res, 'not-your-cap');
    await expectCapUnchanged(1, 2, 2000000, stored);
  });

  it('a broken body for another member’s cap gets 403, not 400: who may call comes first', async () => {
    const res = await put(1, 2, 'not json', { as: 1 });
    expectProblem(res, 'not-your-cap');
  });

  it('403 comes before 415: no Content-Type on another member’s cap', async () => {
    const res = await put(1, 2, { capVnd: 800000 }, { as: 1, contentType: null });
    expectProblem(res, 'not-your-cap');
  });

  it('403 comes before 413: an oversized body on another member’s cap', async () => {
    const res = await put(1, 2, 'x'.repeat(10241), { as: 1 });
    expectProblem(res, 'not-your-cap');
  });
});

describe('Step 5, 415 unsupported-media-type', () => {
  it.each([
    ['missing', null],
    ['empty', ''],
    ['text/json', 'text/json'],
    ['a form', 'application/x-www-form-urlencoded'],
    ['application/problem+json', 'application/problem+json'],
    ['a latin1 charset', 'application/json; charset=latin1'],
    ['a utf-16 charset', 'application/json; charset=utf-16'],
  ])('Content-Type %s → 415', async (_label, contentType) => {
    const res = await put(1, 1, { capVnd: 800000 }, { contentType });
    expectProblem(res, 'unsupported-media-type');
  });

  it('415 comes before 413 and 400: an oversized non-JSON body sent as text/plain', async () => {
    const res = await put(1, 1, 'x'.repeat(10241), { contentType: 'text/plain' });
    expectProblem(res, 'unsupported-media-type');
  });

  it('a failed request changes nothing (415)', async () => {
    const stored = await baseline(1, 1, 2000000);
    await put(1, 1, { capVnd: 800000 }, { contentType: 'text/json' });
    await expectCapUnchanged(1, 1, 2000000, stored);
  });
});

describe('Step 6, 413 payload-too-large: the body is larger than 10240 bytes', () => {
  it('a valid body of 10241 bytes → 413', async () => {
    const json = '{"capVnd":800000}';
    const raw = json + ' '.repeat(10241 - json.length);
    const res = await put(1, 1, raw);
    expectProblem(res, 'payload-too-large');
  });

  it('413 comes before 400: 10241 bytes of invalid JSON', async () => {
    const res = await put(1, 1, 'x'.repeat(10241));
    expectProblem(res, 'payload-too-large');
  });

  it('a failed request changes nothing (413)', async () => {
    const stored = await baseline(1, 1, 2000000);
    const json = '{"capVnd":800000}';
    await put(1, 1, json + ' '.repeat(10241 - json.length));
    await expectCapUnchanged(1, 1, 2000000, stored);
  });
});

describe('Step 7, 400 invalid-json: the body is not valid JSON', () => {
  it.each([
    ['an empty body', ''],
    ['a cut-off object', '{"capVnd":'],
    ['single quotes', "{'capVnd':800000}"],
    ['plain text', 'not json'],
  ])('%s → 400 invalid-json', async (_label, raw) => {
    const res = await put(1, 1, raw);
    expectProblem(res, 'invalid-json');
  });

  it('a failed request changes nothing (400 invalid-json)', async () => {
    const stored = await baseline(1, 1, 2000000);
    await put(1, 1, '{"capVnd":800000');
    await expectCapUnchanged(1, 1, 2000000, stored);
  });
});

describe('Step 8, 400 validation: valid JSON that breaks a field rule', () => {
  it.each([
    ['a string', '{"capVnd":"800000"}', '/capVnd'],
    ['a boolean', '{"capVnd":true}', '/capVnd'],
    ['null', '{"capVnd":null}', '/capVnd'],
    ['a decimal (800000.5)', '{"capVnd":800000.5}', '/capVnd'],
    ['a negative number', '{"capVnd":-1000}', '/capVnd'],
    ['not a multiple of 1000', '{"capVnd":800500}', '/capVnd'],
    ['above 1000000000, a multiple of 1000', '{"capVnd":1001000000}', '/capVnd'],
    ['capVnd missing', '{}', '/capVnd'],
    ['an array body', '[]', ''],
    ['a number body', '5', ''],
    ['a null body', 'null', ''],
  ])(
    '%s (body %s) → 400 validation with one error at pointer "%s"',
    async (_label, raw, pointer) => {
      const res = await put(1, 1, raw);
      expectProblem(res, 'validation');
      expect(res.body.errors).toHaveLength(1);
      expect(res.body.errors[0].pointer).toBe(pointer);
      expect(typeof res.body.errors[0].detail).toBe('string');
    },
  );

  it('validation comes before 422: 1001000000 is above both the maximum and the group total', async () => {
    const res = await put(1, 1, { capVnd: 1001000000 });
    expectProblem(res, 'validation');
  });

  it('a failed request changes nothing (400 validation)', async () => {
    const stored = await baseline(1, 1, 2000000);
    await put(1, 1, { capVnd: 800500 });
    await expectCapUnchanged(1, 1, 2000000, stored);
  });
});

describe('Step 9, 422 cap-exceeds-group-total: a valid cap larger than totalVnd', () => {
  it('user 1 sends 4001000 → 422 with groupTotalVnd 4000000 (Appendix A)', async () => {
    const res = await put(1, 1, { capVnd: 4001000 });
    expectProblem(res, 'cap-exceeds-group-total');
    expect(res.body.groupTotalVnd).toBe(4000000);
  });

  it('user 5 sends 2001000 in group 2 → 422 with groupTotalVnd 2000000', async () => {
    const res = await put(2, 5, { capVnd: 2001000 });
    expectProblem(res, 'cap-exceeds-group-total');
    expect(res.body.groupTotalVnd).toBe(2000000);
  });

  it('a failed request changes nothing (422)', async () => {
    const stored = await baseline(1, 1, 2000000);
    await put(1, 1, { capVnd: 4001000 });
    await expectCapUnchanged(1, 1, 2000000, stored);
  });
});
