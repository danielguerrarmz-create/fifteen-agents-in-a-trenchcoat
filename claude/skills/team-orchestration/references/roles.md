# Roles reference

Each teammate gets ONE clear role with bounded scope (Team Topologies: cap cognitive
load per stream). For each role: what they own, the tools/skills they should lean on,
and their definition of done (DoD). Assign the role and DoD explicitly in the spawn
prompt — a teammate without a DoD will declare victory too early.

Available local tooling on this machine (installed during setup): Node/npm, Python,
Go, OpenSSL, `gitleaks` (secret scanner), git. Relevant global skills:
`frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`,
`vercel-composition-patterns`, `vercel-react-native-skills`, `github-actions-docs`,
`context-engineering-collection`. Point teammates at the skill that fits their role.

---

## architect  (analog: Staff engineer / RFC author)
**Owns:** the design. Produces a short design doc / RFC, the API contract, the data
schema, and Architecture Decision Records (ADRs) for any choice that's expensive to
reverse (framework, datastore, auth model).
**Leans on:** `context-engineering-collection` for system structure.
**DoD:** contracts and schema are concrete enough that frontend and backend can build
in parallel without further questions; each significant decision has a one-paragraph
ADR (context → decision → consequences). You (orchestrator) approve before Phase 2.

## backend  (analog: Backend / API engineer)
**Owns:** services, business logic, data access, the API *implementation* of the
contract, server-side validation, and migrations.
**Leans on:** language/runtime idioms; parameterized queries; input validation.
**DoD:** every contract endpoint implemented and unit-tested; errors return the
contract's status codes; no secrets in code (verify with `gitleaks`); migrations run
cleanly forward.

## frontend  (analog: Frontend engineer)
**Owns:** UI, client state, routing, data fetching against the contract, loading/
error/empty states, and accessibility.
**Leans on:** `frontend-design`, `web-design-guidelines`, `vercel-react-best-practices`,
`vercel-composition-patterns` (or `vercel-react-native-skills` for mobile).
**DoD:** screens build against the agreed contract (mock until backend is live);
handles loading/error/empty; meets basic a11y (keyboard nav, labels, contrast);
no console errors.

## security  (analog: AppSec / DevSecOps engineer)
**Owns:** shifting security left. Threat model (STRIDE), reviewing authn/authz,
dependency/supply-chain risk, secret hygiene, and the security gate before release.
**Leans on:** `gitleaks` (secret scan), `OpenSSL`, dependency audit (`npm audit`,
`pip-audit`, `govulncheck`). See the security checklist in `phases-and-gates.md`.
**DoD:** threat model documented for the main data flows; SCA/secret scans run with
no high/critical issues outstanding (or each accepted with written justification);
authz checked on every privileged path. This role can **block the release gate**.

## release  (analog: DevOps / SRE / Release engineer — "you build it, you run it")
**Owns:** the path to production. CI pipeline, build/packaging, deploy strategy
(canary/blue-green/rolling), feature flags, rollback plan, and observability
(logs/metrics/traces, SLOs).
**Leans on:** `github-actions-docs` for CI/CD; trunk-based dev + feature flags.
**DoD:** CI runs build+test+scan on every change and is green; a deploy strategy and
a tested rollback path exist; basic observability and an SLO are defined; a runbook
covers the top failure modes.

## qa  (analog: SDET / QA engineer)
**Owns:** test strategy, integration/E2E tests, bug triage with severity, and
reproductions. Acts as the integration gate.
**Leans on:** the test runner for the stack; deterministic repro steps.
**DoD:** integration tests cover the primary user journeys and pass; bugs filed with
severity (Sev1 blocker → Sev4 trivial) and clear repro; no open Sev1/Sev2 at the gate.

---

## Collapsing / expanding the roster
- **Tiny job:** you = architect + orchestrator; one `fullstack` teammate; you self-serve
  the security/release checklists.
- **Standard app:** architect (often you), backend, frontend, security, release, qa.
- **Large / multi-surface:** split `backend` into `api` + `data`; add `mobile`,
  `infra`/`platform`. Keep one `release`/platform teammate owning the shared rails so
  the others aren't each reinventing CI (Team Topologies "platform team").
