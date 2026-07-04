---
name: backend-api-rulebook
description: >-
  Rules and best practices for designing and building backend services and APIs. Use
  this whenever the work involves server-side code, HTTP/REST APIs, endpoints, request/
  response design, status codes, API versioning, data modeling, database schema or
  migrations, queries and indexing, validation, pagination, rate limiting, idempotency,
  caching, background jobs, or service reliability (timeouts, retries, error handling).
  Strongly prefer this skill any time you're writing or reviewing an API endpoint, a
  service, a data layer, or anything server-side — even phrased casually like "add an
  endpoint for X", "design the API", "set up the database", or "why is this query slow".
  Complements the frontend/React skills (this is the server half of full-stack) and
  defers deep security detail to secure-coding-rulebook.
---

# Backend & API Rulebook

A backend's job is to be a correct, reliable, and predictable contract for its callers.
Most production incidents trace back to a handful of missing habits: unvalidated input,
unhandled failure modes, sloppy data access, and APIs that surprise their consumers.
This rulebook encodes the habits that prevent them. Detailed conventions (status-code
table, error shape, pagination patterns) are in `references/api-conventions.md`.

## API design

- **Model resources, not actions.** URLs name nouns (`/orders/{id}/items`); HTTP methods
  are the verbs. Reserve RPC-style verbs in paths for genuine operations that aren't CRUD.
- **Use HTTP correctly:** `GET` (safe, cacheable, no side effects), `POST` (create),
  `PUT` (full replace, idempotent), `PATCH` (partial update), `DELETE` (idempotent).
  Return honest status codes (`200/201/204`, `400/401/403/404/409/422`, `429`, `500/503`).
  Full table in the reference.
- **One consistent error shape** across the whole API (recommend RFC 9457 problem+json:
  `type`, `title`, `status`, `detail`, `instance`). Callers should parse errors one way.
- **Validate every input at the boundary** and reject early with `400/422` + a useful
  message. Never trust client data — size, type, range, format, and authorization.
- **Version from day one** (`/v1/…` or a header). Once published, an endpoint's contract
  is a promise; make breaking changes a new version, and announce them.
- **Idempotency for unsafe retries:** support an idempotency key on `POST`s that create,
  so a client retry after a timeout doesn't double-charge/double-create.
- **Pagination, filtering, sorting** on any list that can grow. Prefer cursor-based
  pagination for large/active datasets (offset pagination drifts and gets slow).
- **Rate-limit** public endpoints; return `429` with `Retry-After`.

## Data layer

- **Design the schema deliberately:** right types, `NOT NULL` where required, foreign keys,
  unique constraints. Let the database enforce invariants — it's the last line of defense.
- **Migrations are versioned, forward-only, and reversible-in-practice.** Never edit a
  shipped migration; add a new one. Make them backward-compatible so deploys don't require
  downtime (expand → migrate → contract for column changes).
- **Index for your real query patterns** (and the unique/lookup columns). Unindexed lookups
  are the #1 silent performance cliff.
- **Kill N+1 queries:** fetch related data in a set, not in a loop. Watch ORMs especially.
- **Use transactions** for multi-step writes that must be all-or-nothing; keep them short.
- **Never build queries by string concatenation** — parameterize (prevents SQL injection;
  see secure-coding-rulebook).

## Reliability

- **Everything that crosses the network can fail or hang.** Set timeouts on every outbound
  call; never wait forever.
- **Retry only idempotent operations**, with exponential backoff + jitter and a cap. Blind
  retries amplify outages.
- **Fail gracefully:** degrade (serve cached/partial) rather than cascade. Consider circuit
  breakers for flaky dependencies.
- **Be stateless** where possible (state in the DB/cache, not process memory) so you can
  scale horizontally and restart freely. Follow 12-factor: config from environment, not code.
- **Make work that can be async, async:** offload slow/unreliable tasks (email, image
  processing) to a queue/worker; return fast.

## Observability (so you can operate it)

- **Structured logs** (JSON), with a **request/correlation ID** threaded through, so a single
  request is traceable end to end. Log decisions and failures, not noise. Never log secrets/PII.
- **Emit metrics** for rate, errors, and latency (RED) on key endpoints; add traces for
  cross-service calls.
- Surface health/readiness endpoints for the platform to probe.

## Definition of done for an endpoint
1. Validates input and authorizes the caller.
2. Returns correct status codes and the standard error shape.
3. Has unit tests for logic + an integration test hitting the route (see testing-rulebook).
4. Data access is parameterized, indexed, and free of N+1.
5. Has timeouts on outbound calls; failure modes handled.
6. Logs with a correlation ID; no secrets leaked.

See `references/api-conventions.md` for the status-code table, the problem+json error
template, cursor-pagination shape, and idempotency-key flow.
