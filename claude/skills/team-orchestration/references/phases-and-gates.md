# Phases, gates, and definition of done

A **gate** = a task dependency + an acceptance check. Encode gates as `addBlockedBy`
links so a downstream task literally can't be claimed until its blockers resolve.
You (orchestrator) own confirming each gate's acceptance check before unblocking.

## Phase 0 — Design / RFC
Do this when scope is fuzzy or the design is expensive to reverse. Skip for trivial,
well-understood changes.
- Write a short RFC: problem, goals/non-goals, proposed approach, alternatives, risks.
- Produce ADRs for irreversible choices (framework, datastore, auth model).
- **Gate:** you approve the RFC + contracts before any building starts.

## Phase 1 — Scaffold + contracts
- Initialize repo, toolchain, lockfiles, formatter/linter, CI skeleton.
- `architect` publishes the API contract, data schema, and shared types.
- **Gate:** repo builds; shared types/API stubs compile; contract is unambiguous.

## Phase 2 — Parallel build (the fan-out)
- `frontend ‖ backend ‖ infra` build simultaneously against the contract.
- Frontend mocks the API until backend is live; backend implements the contract exactly.
- Commit in thin vertical slices; keep changes small (trunk-based, short-lived branches).
- **Gate:** each stream's unit tests pass; the contract still holds (no silent drift).

## Phase 3 — Security review (shift left, runs alongside Phase 2, gates Phase 5)
Security is not a final bolt-on. `security` works in parallel and must clear before release.
**Checklist:**
- **Threat model (STRIDE)** for the main data flows: Spoofing, Tampering, Repudiation,
  Information disclosure, Denial of service, Elevation of privilege.
- **AuthN/AuthZ:** every privileged path checks authorization, not just authentication;
  default-deny; least privilege.
- **Input handling:** validation + output encoding; parameterized queries (no string-built
  SQL); no SSRF/path traversal on user-controlled input.
- **Secrets:** none in source or history — verify with `gitleaks detect`. Secrets come
  from env/secret store.
- **Dependencies / supply chain (SCA):** `npm audit` / `pip-audit` / `govulncheck`; pin
  and review transitive deps; prefer lockfiles; be wary of typosquats.
- **Transport/crypto:** TLS everywhere; vetted libraries (no homemade crypto); sensible
  cookie/session flags.
- **Gate:** no high/critical findings open (or each explicitly accepted with written
  rationale). This role can block release.

## Phase 4 — Integration + debugging
- Wire frontend to the real backend; run integration/E2E across primary journeys.
- `qa` triages bugs with severity (Sev1 blocker → Sev4 trivial) and deterministic repro.
- Debug method: reproduce → isolate (binary-search the change/area) → fix root cause →
  add a regression test so it can't silently return.
- **Gate:** integration tests green; no open Sev1/Sev2.

## Phase 5 — Distribution / release
- **Pick a deploy strategy:**
  - *Rolling* — replace instances gradually (simple default).
  - *Blue-green* — stand up new version alongside, switch traffic, instant rollback.
  - *Canary* — route a small % to the new version, watch metrics, ramp up.
  - *Feature flags / progressive delivery* — ship code dark, enable gradually,
    decouple deploy from release.
- CI must run build + test + security scan on every change and be green.
- A **tested rollback path** exists before you ship.
- **Gate:** CI green; security + integration gates passed; rollback verified.

## Phase 6 — Observability + on-call ("you build it, you run it")
- Emit logs/metrics/traces; define at least one **SLO** (e.g. p99 latency, error rate)
  and its error budget.
- Write a **runbook** for the top failure modes and a **blameless postmortem** template
  for when incidents happen (focus on systems and contributing factors, not blame).
- Define incident severities and who the incident commander is.

## Definition of Done (check, don't assume)
A unit/feature is done only when ALL hold — and you verify, reporting what you observed:
1. Implements the agreed contract; edge/error cases handled.
2. Tests written and passing (unit + the integration path it touches).
3. Security checklist items for its surface satisfied (incl. `gitleaks` clean).
4. Builds in CI; lint/format clean.
5. Observable (logs/metrics on the important paths) where relevant.
6. Docs/runbook updated if behavior or operations changed.

If any item is unmet, the work is in progress, not done. Never report "done" on
output you didn't verify — if a test failed or a step was skipped, say so plainly.
