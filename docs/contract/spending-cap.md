# Spending cap API: contract, version 1

AI Travel Planner (CSC13114, 23KTPM1) · PA#2 · owner: Nguyen Hoang Gia Bao · reviewer: Luong Linh Khoi

This file is the specification of one endpoint:
**`PUT /v1/groups/{groupId}/members/{userId}/spending-cap`**, by which a group
member sets their own personal spending cap. `tests/spendingCap.contract.test.ts`
checks the implementation against this file. If the code and this file disagree,
the code is wrong. If this file is wrong, change it in a separate commit that
says why, and add a line to the changelog (section 5). Never change it quietly.

## 1. Conventions

- Every endpoint in this contract lives under `/v1`.
- Requests and responses are JSON, UTF-8.
- **Money is an integer number of dong (VND)**: `capVnd`, `totalVnd`,
  `costPerMemberVnd`. Never a decimal, never a string, never thousands.
- Ids (`groupId`, `userId`, `planId`) are positive integers. In a path they are
  written in decimal digits with no sign and no leading zero (`7`, not `07`,
  `+7` or `7.0`). The server accepts only that form. Any other spelling (`07`,
  `+7`, `-7`, `7.0`, `7e0`, `0`, `abc`) names no group or member: in `groupId`
  it is `404 group-not-found`, in `userId` it is `404 member-not-found`, with the
  check order of section 4.1. It is never a `400`.
- Timestamps are ISO 8601 strings in UTC with milliseconds, e.g.
  `2026-11-21T08:30:00.000Z`.
- Clients ignore response fields they do not know. The server ignores request
  fields it does not know.

### Who may call it

- The caller is **authenticated**: every request carries
  `Authorization: Bearer <token>`, and the token identifies one user. (How a token
  is obtained is not part of this contract. The PA#2 stub is in Appendix A.)
- The caller is a **member of `groupId`**.
- The caller may change **only their own cap**: `userId` must equal the caller's
  user id. Nobody, not even the member who created the group, can set another
  member's cap.

Why these statuses:

| Situation                                                        | Status                 | Why                                                                                                                                                                                                    |
| ---------------------------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| No or bad token                                                  | `401 unauthenticated`  | We do not know who is calling.                                                                                                                                                                         |
| The caller is not a member of the group, or the group is unknown | `404 group-not-found`  | Group ids are small sequential integers, so they are easy to guess. Answering 403 would tell an outsider that the group exists. Both cases return the **same** response, so they cannot be told apart. |
| The caller is a member, but `userId` is not a member             | `404 member-not-found` | Members already see the group's member list, so this hides nothing.                                                                                                                                    |
| The caller is a member, and `userId` is another member           | `403 not-your-cap`     | The caller already knows that member exists, so hiding it with a 404 would protect nothing and would mislead the client. 403 tells the client this is a permission rule, and retrying will not help.   |

## 2. Errors

Every 4xx or 5xx response from this endpoint is a **problem details** object
(RFC 9457) with the media type `application/problem+json` (a `charset=utf-8`
parameter may follow it, so clients compare the media type, not the whole
header):

```http
HTTP/1.1 400 Bad Request
Content-Type: application/problem+json

{
  "type": "https://ai-travel-planner.example/problems/validation",
  "title": "Invalid request",
  "status": 400,
  "detail": "1 field is invalid",
  "errors": [
    { "pointer": "/capVnd", "detail": "must be an integer from 0 to 1000000000 and a multiple of 1000" }
  ]
}
```

| Member          | Rule                                                                                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `type`          | `https://ai-travel-planner.example/problems/` followed by a slug from the table below. No other values                                                                                            |
| `title`         | exactly the title from the table below                                                                                                                                                            |
| `status`        | a number, equal to the HTTP status of the response                                                                                                                                                |
| `detail`        | one sentence about **this** occurrence. Never a stack trace, a file path or an internal message. Clients must not parse it                                                                        |
| `errors`        | only on `validation`: one entry **per broken field** (not just the first), each `{ "pointer", "detail" }`, where `pointer` is a JSON Pointer into the body (`/capVnd`) or `""` for the whole body |
| `groupTotalVnd` | only on `cap-exceeds-group-total`: the group total, an integer number of VND                                                                                                                      |

| Slug                      | Status | Title                   | When                                                                                                 |
| ------------------------- | ------ | ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `unauthenticated`         | 401    | Authentication required | no `Authorization` header, a header that is not `Bearer <token>`, or a token that identifies no user |
| `group-not-found`         | 404    | Group not found         | `groupId` is not a positive integer, no group has that id, or the caller is not a member of it       |
| `member-not-found`        | 404    | Member not found        | `userId` is not a positive integer, or no member of the group has that id                            |
| `not-your-cap`            | 403    | Not your spending cap   | `userId` is another member of the group, not the caller                                              |
| `unsupported-media-type`  | 415    | Unsupported media type  | the `Content-Type` header is missing or its media type is not `application/json`                     |
| `invalid-json`            | 400    | Malformed JSON          | the body is not valid JSON (an empty body counts as not valid JSON)                                  |
| `validation`              | 400    | Invalid request         | the body is valid JSON but breaks a field rule in section 4                                          |
| `cap-exceeds-group-total` | 422    | Cap exceeds group total | `capVnd` is valid but larger than the group's `totalVnd`                                             |
| `internal`                | 500    | Internal error          | anything else. `detail` is the fixed sentence `"Something went wrong on our side."`                  |

- A `401` also carries the header `WWW-Authenticate: Bearer`.
- Clients decide what to do from `type`, never from `title` or `detail`.

## 3. Resources

**SpendingCap**: one member's cap in one group.

```json
{
  "groupId": 1,
  "userId": 1,
  "capVnd": 800000,
  "updatedAt": "2026-11-21T08:30:00.000Z",
  "affectedPlans": [{ "planId": 1, "status": "needs-revalidation" }]
}
```

| Field           | Type                          | Meaning                                                                                                 |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------- |
| `groupId`       | integer                       | the group, from the path                                                                                |
| `userId`        | integer                       | the member, from the path (always the caller)                                                           |
| `capVnd`        | integer                       | the member's cap now in effect, `0` to the group's `totalVnd`                                           |
| `updatedAt`     | string (ISO 8601, UTC)        | when `capVnd` last **changed** to its current value                                                     |
| `affectedPlans` | array of `{ planId, status }` | the saved plans of this group that this cap no longer fits, ordered by `planId` ascending. May be empty |

**Group** (not returned by this endpoint, but its rules apply): a `totalVnd`
budget for the whole group and a list of members. Every member has a cap slot
from the moment they join; before the first PUT it is unset.

**Saved plan** (not returned by this endpoint): a schedule shared with the group.
It records `costPerMemberVnd`, the planned spending of each member, and a
`status`:

- `saved`: the validator accepted it when it was saved.
- `needs-revalidation`: something it depended on changed (here, a member's cap).
  It must go through the validator again before the group relies on it. Clients
  must accept status values they do not know.

## 4. Endpoints

### 4.1 `PUT /v1/groups/{groupId}/members/{userId}/spending-cap`: set my cap

Request headers: `Authorization: Bearer <token>` and
`Content-Type: application/json` (a `charset` parameter is allowed).

Request body:

```json
{ "capVnd": 800000 }
```

| Field    | Rule                                                                                                                                                |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `capVnd` | **required**. A JSON number whose value is an integer, from `0` to `1000000000`, and a multiple of `1000`. Strings, booleans and `null` are invalid |

- A body that is valid JSON but not an object (an array, a number, `null`) is a
  `validation` error with pointer `""`.
- A missing `capVnd` is a `validation` error with pointer `/capVnd`.
- `800000.0` and `8e5` are the same JSON value as `800000`, so they are accepted.
  `800000.5` is not an integer and is invalid.
- `0` is a valid cap: the member plans to spend nothing.
- Other fields are ignored.

The server checks, **in this order**, and stops at the first step that fails:

1. The caller is authenticated, else `401 unauthenticated`.
2. `groupId` is a positive integer, the group exists and the caller is a member
   of it, else `404 group-not-found`.
3. `userId` is a positive integer and a member of the group, else
   `404 member-not-found`.
4. `userId` is the caller, else `403 not-your-cap`.
5. The `Content-Type` is `application/json`, else `415 unsupported-media-type`.
6. The body is valid JSON, else `400 invalid-json`.
7. The body follows the table above, else `400 validation`.
8. `capVnd` ≤ the group's `totalVnd`, else `422 cap-exceeds-group-total`.
   A cap **equal** to the total is allowed.
9. The cap is stored and the saved plans are checked (below): **`200`**, with a
   SpendingCap as the body and `Content-Type: application/json`.

So a request with a broken body for another member's cap gets `403`, not `400`:
who may call comes before what they send.

A failed request changes nothing.

**What happens to saved plans.** After storing the cap, the server looks at every
saved plan of this group (whatever its status):

- A plan whose `costPerMemberVnd` for this member is **greater than** the new
  `capVnd` no longer fits. Its status becomes `needs-revalidation` (if it is
  already, it stays so), and it is listed in `affectedPlans`.
- A plan whose cost for this member is **equal to or below** the cap is not
  listed and is not changed.
- Plans are **never deleted, and their places, times and costs are never edited**
  by this endpoint. Only `status` changes.
- **Raising** a cap never sets a plan back to `saved`. A flagged plan stays
  `needs-revalidation` until it is saved again through the validator, because
  only the validator can say it fits every member and the group total.
- Lowering a cap below a saved plan's cost is **allowed** (`200`). The plan is
  flagged; the request is not refused.
- Other members' caps and their plans are not touched.
- No notification is sent in version 1. Members see the flag on the plan.

**Idempotency.** PUT replaces the cap, so the same request sent twice has the same
effect as sending it once. A client that gets no answer may safely send it again.

- If `capVnd` equals the stored cap, the cap does not change: `updatedAt` keeps
  its old value, so the response is identical to the response of the PUT that
  stored this cap. (After `800000` → `900000` → `800000`, the cap changed back,
  so `updatedAt` is the time of the third PUT, not the first.)
- `affectedPlans` is computed from the stored state, not from what this request
  changed, so a repeat lists the same plans again.
- The plan check above runs on **every** successful PUT, a repeat included. If a
  plan changed since the last PUT (in a later version, for example, it was saved
  again through the validator), the plan rule wins: a plan whose cost is above
  the cap is flagged again and listed, even though the cap did not change. Only
  the cap and `updatedAt` are guaranteed not to change on a repeat.
- No `Idempotency-Key` header is needed or read.
- Two different PUTs for the same cap at the same time: the last one the server
  stores wins. There is no `If-Match` in version 1.

**Example: a successful change**

```http
PUT /v1/groups/1/members/1/spending-cap HTTP/1.1
Authorization: Bearer 1
Content-Type: application/json

{ "capVnd": 800000 }
```

```http
HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8

{
  "groupId": 1,
  "userId": 1,
  "capVnd": 800000,
  "updatedAt": "2026-11-21T08:30:00.000Z",
  "affectedPlans": [{ "planId": 1, "status": "needs-revalidation" }]
}
```

**Example: another member's cap**

```http
PUT /v1/groups/1/members/2/spending-cap HTTP/1.1
Authorization: Bearer 1
Content-Type: application/json

{ "capVnd": 800000 }
```

```http
HTTP/1.1 403 Forbidden
Content-Type: application/problem+json

{
  "type": "https://ai-travel-planner.example/problems/not-your-cap",
  "title": "Not your spending cap",
  "status": 403,
  "detail": "You can only change your own spending cap."
}
```

**Example: above the group total**

```http
HTTP/1.1 422 Unprocessable Entity
Content-Type: application/problem+json

{
  "type": "https://ai-travel-planner.example/problems/cap-exceeds-group-total",
  "title": "Cap exceeds group total",
  "status": 422,
  "detail": "capVnd 5000000 is above the group total of 4000000.",
  "groupTotalVnd": 4000000
}
```

## 5. Versions and changes

- **Within `/v1`, only additive changes**: a new optional request field, a new
  response field, a new problem type, a new plan `status` value, a new endpoint.
  Clients are written to tolerate these (section 1, section 3).
- Anything else is a **breaking change** and needs `/v2`: renaming or removing a
  field, changing a type or a unit, tightening a rule (for example a larger
  multiple than 1000), changing the status or `type` of an error, changing the
  order of the checks in section 4.1, or changing what happens to saved plans.
  `/v1` keeps running until a `Sunset` date (RFC 8594) announced at least 30 days
  ahead, and its responses carry `Deprecation` (RFC 9745) from the day `/v2`
  ships.
- Every change to this file is its own commit and gets a line below.

### Changelog

| Date       | Version | Change                                                                                                                                                |
| ---------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-11-18 | 1       | First version.                                                                                                                                        |
| 2026-11-18 | 1       | Section 2: say that a `charset` parameter may follow `application/problem+json`. Clarification, no behaviour change.                                  |
| 2026-11-23 | 1       | 4.1 Idempotency: a repeat matches the response of the PUT that stored the cap, not the first one for that value (review of PR #7, item 1).            |
| 2026-11-23 | 1       | 4.1 Idempotency: the plan check runs on every PUT, a repeat included; on a repeat only the cap and `updatedAt` stay fixed (review of PR #7, item 9).  |
| 2026-11-23 | 1       | Section 1: a path id in any other form (`01`, `+1`, `1.0`) is `404 group-not-found` or `404 member-not-found`, never `400` (review of PR #7, item 2). |
| 2026-11-23 | 1       | Appendix A: token edge cases. Scheme case-insensitive, one or more spaces, token written like a path id (review of PR #7, item 3).                    |
| 2026-11-23 | 1       | Appendix A: add the sequence 500000 → 800000 → 4000000, showing that a raised cap lists only the plans it does not fit (review of PR #7, item 4).     |

## Appendix A: the PA#2 stub (not part of the API)

PA#2 has no sign-in and no database. This appendix fixes the stub and the seed so
that tests can be written from this file alone. It will be replaced in PA#3; the
sections above will not change because of that.

- **Token.** The bearer token is the user's id in decimal, e.g.
  `Authorization: Bearer 1`. A token that is not one of the user ids below is
  `401 unauthenticated`. The header follows RFC 9110 (section 11): the scheme
  `Bearer` is case-insensitive, one or more spaces separate it from the token,
  and whitespace before or after the whole value is not part of it. The token
  itself is written like a path id (section 1): digits, no sign, no leading zero.

  | `Authorization` header             | Result                       |
  | ---------------------------------- | ---------------------------- |
  | `Bearer 1`, `bearer 1`, `BEARER 1` | user 1                       |
  | `Bearer  1` (two spaces)           | user 1                       |
  | `Bearer 1 ` (trailing space)       | user 1                       |
  | `Bearer 01`, `Bearer +1`           | `401` (not written as an id) |
  | `Bearer 0`, `Bearer -1`            | `401` (not a positive id)    |
  | `Bearer 7`                         | `401` (no such user)         |
  | `Bearer`, `Bearer 1 2`, `Basic 1`  | `401` (not `Bearer <token>`) |
  | no header                          | `401`                        |

- **Store.** In memory. `createApp()` (exported from `src/app.ts`) returns an app
  with its own store, freshly seeded, so each test can start from the seed below.

| User | Member of |
| ---- | --------- |
| 1    | group 1   |
| 2    | group 1   |
| 3    | group 1   |
| 4    | group 1   |
| 5    | group 2   |
| 6    | no group  |

| Group | `totalVnd` | Members    | Caps at start |
| ----- | ---------- | ---------- | ------------- |
| 1     | 4000000    | 1, 2, 3, 4 | all unset     |
| 2     | 2000000    | 5          | unset         |

| Plan | Group | Status at start | `costPerMemberVnd`                         |
| ---- | ----- | --------------- | ------------------------------------------ |
| 1    | 1     | `saved`         | 1: 900000, 2: 950000, 3: 800000, 4: 700000 |
| 2    | 1     | `saved`         | 1: 600000, 2: 600000, 3: 600000, 4: 600000 |
| 3    | 2     | `saved`         | 5: 1500000                                 |

What the seed gives, for user 1 in group 1 (each row from a fresh seed):

| `capVnd` sent | `affectedPlans`                     |
| ------------- | ----------------------------------- |
| 4000000       | `[]`                                |
| 900000        | `[]` (equal to plan 1's cost: fits) |
| 800000        | plan 1                              |
| 500000        | plan 1, plan 2                      |
| 4001000       | none: `422 cap-exceeds-group-total` |

A sequence, for user 1 in group 1, from a fresh seed (each step follows the one
before):

| Step | `capVnd` sent | `affectedPlans` | Plan 1 status        | Plan 2 status        |
| ---- | ------------- | --------------- | -------------------- | -------------------- |
| 1    | 500000        | plan 1, plan 2  | `needs-revalidation` | `needs-revalidation` |
| 2    | 800000        | plan 1          | `needs-revalidation` | `needs-revalidation` |
| 3    | 4000000       | `[]`            | `needs-revalidation` | `needs-revalidation` |

At step 2, plan 2 (cost 600000) fits the new cap, so it is not listed, but it
stays `needs-revalidation`: raising a cap never sets a plan back to `saved`
(section 4.1). `affectedPlans` lists the plans the cap does not fit, not every
flagged plan.

And: user 5 on group 1 gets `404 group-not-found`, the same as anyone on
group 99; user 1 on group 1 for user 6 gets `404 member-not-found`; user 1 on
group 1 for user 2 gets `403 not-your-cap`.
