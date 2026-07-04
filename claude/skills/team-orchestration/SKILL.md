---
name: team-orchestration
description: >-
  Playbook for orchestrating an autonomous agent team (Claude Code "agent teams")
  to build and ship applications end to end. Use this whenever the user wants to
  build, develop, ship, or rearchitect an application or feature with MULTIPLE agents
  working together — e.g. "spin up a team to build X", "have agents build this app",
  "orchestrate a team", "build this end to end", "develop and ship this with a team",
  or any multi-discipline effort spanning full-stack development, security, release/
  distribution, and debugging. Strongly prefer this skill any time the work is large
  enough to split across teammates, even if the user doesn't say the word "team".
  It maps how real engineering organizations are structured (Team Topologies, DORA,
  Google SRE, DevSecOps, trunk-based delivery) onto a concrete agent-team workflow.
---

# Team Orchestration Playbook

You are the **orchestrator** (the tech lead / engineering manager) of an autonomous
agent team that builds and ships software. Your job is **not to write all the code
yourself** — it is to decompose the work, staff it onto teammates, define the
contracts and quality gates between them, keep them unblocked, and integrate their
output into a shippable result.

This playbook exists because ad-hoc "spawn some agents" coordination produces
duplicated work, integration hell, and skipped security/release steps. Real
engineering orgs solved these problems with **explicit contracts, clear ownership,
and quality gates**. We borrow that structure. See `references/real-world-models.md`
for the source frameworks and why each matters.

## When to use the agent-teams machinery vs. plain subagents

- **Plain subagents** (the `Agent` tool, results report only to you): use for
  independent fan-out where pieces don't need to talk — research, parallel analysis.
- **Agent teams** (`TeamCreate` + `Task*` + `SendMessage`): use for *building an
  application*, where teammates share a task list, depend on each other's output,
  and must coordinate (frontend consuming a backend contract, security gating a
  release). This skill is about the latter. It requires the agent-teams feature
  (`CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1`).

## The core loop

1. **Frame the work** — restate the goal, constraints, and a definition of done.
   If scope is fuzzy, do a short design/RFC step first (Phase 0 below).
2. **Choose the team shape** — pick roles from the roster (`references/roles.md`)
   sized to the work. Don't staff roles you won't use.
3. **Define contracts first** — APIs, schemas, and interfaces are agreed *before*
   parallel work starts. This is what makes parallelism safe (see "Contract-first").
4. **Create the team and the task graph** — `TeamCreate`, then `TaskCreate` with
   explicit `addBlockedBy` dependencies that encode the phases and gates.
5. **Staff and launch** — spawn teammates, assign task ownership, kick off the
   unblocked tasks.
6. **Drive to done** — keep teammates unblocked, enforce the gates, integrate,
   and only declare done when the definition of done and gates are satisfied.
7. **Shut down cleanly** — `shutdown_request` to each teammate, then `TeamDelete`.

## Roster (map real org roles → teammates)

Staff only what the work needs. Full role specs, tools, and per-role definition of
done are in `references/roles.md`. The common set:

| Teammate | Real-world analog | Owns |
|---|---|---|
| `architect` | Staff eng / RFC author | Design doc, API contracts, ADRs (Phase 0) |
| `backend` | Backend / API engineer | Services, data layer, business logic |
| `frontend` | Frontend engineer | UI, client state, accessibility |
| `security` | AppSec / DevSecOps | Threat model, SAST/SCA/secret scan, authz review |
| `release` | DevOps / SRE / Release eng | CI/CD, packaging, deploy strategy, observability |
| `qa` | SDET / QA | Test strategy, integration tests, bug triage, repro |

For small jobs, collapse roles (one `fullstack` teammate; you act as `architect`).
For large jobs, split further (separate `data`, `mobile`, `infra`). The principle
from **Team Topologies**: keep each teammate's cognitive load bounded to one clear
stream of work, and let a "platform" teammate (`release`) own the shared rails.

## Phases and gates

Delivery flows through phases with **gates** between them — a gate is a task
dependency plus an acceptance check. This mirrors how real orgs prevent "merge it
and pray." Full checklists per phase in `references/phases-and-gates.md`.

```
Phase 0  Design / RFC        → gate: contracts + ADR approved by you
Phase 1  Scaffold + contracts→ gate: shared types/API stubs compile, repo builds
Phase 2  Parallel build      → frontend ‖ backend ‖ infra against the contract
Phase 3  Security review     → gate: threat model done, no high/critical findings
Phase 4  Integration + debug → gate: integration tests green, no known Sev1/Sev2
Phase 5  Distribution/release→ gate: CI green, deploy strategy chosen, rollback ready
Phase 6  Observability/on-call→ SLOs defined, runbook + postmortem template ready
```

Encode this as the task graph: Phase-2 tasks are `addBlockedBy` Phase-1; the release
task is blocked by both security and integration. That way teammates physically
cannot skip a gate — the task stays unclaimable until its blockers resolve.

## Contract-first decomposition (the key to safe parallelism)

The single most important move: **agree the interfaces before building behind them.**
Have `architect` (or you) produce, in Phase 1:
- API contract (endpoints, methods, request/response shapes, status codes, errors)
- Data schema (tables/collections, key fields, indexes)
- Shared types / interface definitions both sides import

Then `frontend` builds against the contract (mocking the backend) while `backend`
implements it — truly in parallel, no waiting. This is why Phase 2 fans out cleanly.
When a contract must change mid-build, the owner announces it via `SendMessage` to
everyone who consumes it; treat a silent contract change as a defect.

## Driving the team (mechanics)

- **Create the task graph with dependencies.** Use `TaskCreate` for each unit and
  `TaskUpdate addBlockedBy` to wire the phase/gate ordering. Prefer many small,
  ownable tasks over a few giant ones.
- **Assign ownership** with `TaskUpdate owner: <name>`. Lowest-ID unblocked task
  first.
- **Kick off** the unblocked Phase-1 tasks with a `SendMessage` to their owners.
  Teammates go idle between turns — idle is normal, not "stuck." Don't nag.
- **Let teammates coordinate peer-to-peer** (frontend ↔ backend on the contract).
  You don't have to relay every message; you enforce gates and integrate.
- **Enforce gates yourself.** Before unblocking Phase 5, confirm `security` reported
  no high/critical findings and `qa` reports integration green. If a gate fails,
  the work goes back, not forward.
- **Definition of done is explicit and checked**, never assumed. See the DoD section
  in `references/phases-and-gates.md`.
- **Shut down** when the DoD is met: send `{"type":"shutdown_request"}` to each
  teammate, then `TeamDelete`.

## Quality bar (DORA-aligned)

Optimize the team toward the four **DORA** outcomes, because they correlate with
real delivery performance:
- **Lead time** — keep tasks small and unblocked; contract-first prevents stalls.
- **Deployment frequency** — ship in thin vertical slices behind feature flags, not
  one big-bang merge.
- **Change failure rate** — gates (security, tests) exist to drive this down.
- **MTTR** — Phase 6 (runbook, observability, rollback) is what makes recovery fast.

If you ever feel pressure to skip security or release rigor to "go faster," that is
exactly the false economy these gates prevent — say so and hold the gate.

## Anti-patterns to avoid

- Spawning role-less teammates and hoping coordination emerges. Assign a role + DoD.
- Starting parallel build before the contract exists → integration rework.
- Treating security/release as an afterthought bolted on at the end (shift left).
- One mega-task owned by everyone → no real ownership. Decompose.
- Declaring "done" on unverified output. Check the gate; report what you actually saw.

## Further reading (load as needed)
- `references/roles.md` — full per-role responsibilities, tools, and definition of done
- `references/phases-and-gates.md` — phase checklists, CI/CD gates, security checklist,
  release strategies, incident/on-call, definition of done
- `references/real-world-models.md` — the real frameworks this is grounded in and why
