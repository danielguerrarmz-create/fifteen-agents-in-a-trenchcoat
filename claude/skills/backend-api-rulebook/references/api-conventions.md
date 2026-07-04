# API conventions reference

## HTTP status codes — when to use which
| Code | Meaning | Use when |
|---|---|---|
| 200 OK | success w/ body | successful GET/PATCH/PUT returning data |
| 201 Created | resource created | successful POST; include `Location` header |
| 202 Accepted | accepted, async | work queued, not yet done |
| 204 No Content | success, no body | successful DELETE or update with nothing to return |
| 400 Bad Request | malformed | unparseable/invalid syntax |
| 401 Unauthorized | not authenticated | missing/invalid credentials |
| 403 Forbidden | authenticated, not allowed | valid identity lacks permission |
| 404 Not Found | absent | resource doesn't exist (or hide existence from unauthorized) |
| 409 Conflict | state conflict | duplicate, version conflict, already-exists |
| 422 Unprocessable | semantically invalid | well-formed but fails validation rules |
| 429 Too Many Requests | rate limited | over quota; include `Retry-After` |
| 500 Internal | server bug | unexpected error — never leak internals to the client |
| 503 Service Unavailable | down/overloaded | dependency down, shedding load; include `Retry-After` |

Distinguish 401 (who are you?) from 403 (you can't do this), and 400 (bad syntax) from
422 (good syntax, bad meaning).

## Standard error body (RFC 9457 problem+json)
```json
{
  "type": "https://api.example.com/errors/insufficient-funds",
  "title": "Insufficient funds",
  "status": 422,
  "detail": "Account balance 12.00 is below the 50.00 transfer amount.",
  "instance": "/accounts/abc/transfers/xyz",
  "errors": [{ "field": "amount", "message": "exceeds available balance" }]
}
```
Keep `title` stable/generic (good for clients to switch on); put the specific, human
detail in `detail`. Add a machine-readable `code` or `type` so clients branch reliably.

## Cursor pagination
Request: `GET /items?limit=50&cursor=eyJpZCI6MTAyM30`
Response:
```json
{
  "data": [ ... ],
  "page": { "next_cursor": "eyJpZCI6MTA3M30", "has_more": true }
}
```
Cursor encodes the last-seen sort key (e.g. `{id|created_at}`), so it's stable as rows are
inserted/deleted — unlike `offset`, which skips/duplicates rows under concurrent writes and
degrades on large offsets.

## Idempotency-key flow (safe POST retries)
1. Client sends `Idempotency-Key: <uuid>` header on a create POST.
2. Server stores the key → result mapping (with a TTL) atomically with the create.
3. A retry with the same key returns the *original* result instead of creating again.
4. Different body + same key → `409` (the key is being reused incorrectly).

## Naming & shape conventions
- Plural resource collections: `/users`, `/users/{id}`, `/users/{id}/sessions`.
- Lowercase, hyphenated paths; consistent casing for JSON fields (pick snake_case or
  camelCase and never mix).
- Timestamps in ISO-8601 / RFC 3339 UTC (`2026-05-31T12:00:00Z`).
- Return the created/updated resource so clients don't need a follow-up GET.
- Booleans read as questions (`is_active`, `has_more`), not negations (`not_disabled`).
