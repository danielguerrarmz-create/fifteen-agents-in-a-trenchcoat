# Real-world models this playbook is grounded in

The structure here isn't invented — it's a distillation of how large engineering
organizations actually ship software. Each model below explains *why* a part of the
playbook exists, so you can adapt rather than follow rotely.

## Team Topologies (Matthew Skelton & Manuel Pais)
Organizes teams into four types: **stream-aligned** (own a slice of product end to end),
**platform** (provide shared rails so stream teams move fast), **enabling** (coach/uplift),
and **complicated-subsystem** (deep specialist areas). Core idea: **bound each team's
cognitive load** to one clear stream.
→ *In this playbook:* one role per teammate with bounded scope; `release` acts as the
platform team owning shared CI/deploy rails. Also **Conway's Law** — systems mirror the
communication structure that built them — so we shape the team to match the architecture
we want (the "Inverse Conway Maneuver"): contract boundaries = team boundaries.

## DORA / Accelerate (Forsgren, Humble, Kim)
Four metrics predict delivery performance: **deployment frequency**, **lead time for
changes**, **change failure rate**, **time to restore (MTTR)**. High performers ship
small and often with low failure rates and fast recovery.
→ *In this playbook:* thin vertical slices + feature flags (frequency, lead time);
security/test gates (change failure rate); Phase 6 runbook/observability/rollback (MTTR).

## Google SRE
**SLIs/SLOs and error budgets** quantify reliability and arbitrate the velocity-vs-
stability tension; **toil** (manual, repetitive ops work) should be automated away;
on-call is supported by runbooks and **blameless postmortems** that fix systems, not people.
→ *In this playbook:* Phase 6 SLOs, runbooks, and the blameless postmortem template.

## DevSecOps / shift-left security
Security moves earlier and runs continuously rather than as a final audit. Standard
controls: **threat modeling (STRIDE)**, **SAST** (static analysis), **DAST** (dynamic),
**SCA** (dependency/supply-chain scanning), **secret scanning**, and supply-chain
integrity (e.g. **SLSA** provenance, signed artifacts).
→ *In this playbook:* the `security` role runs in parallel from Phase 2 and gates release;
the Phase 3 checklist enumerates these controls. (`gitleaks` covers secret scanning here.)

## Trunk-based development + feature flags
Short-lived branches merged frequently into a single trunk, with CI on every change and
**feature flags** decoupling deploy from release. Reduces merge hell and enables
progressive delivery (canary/blue-green).
→ *In this playbook:* Phase 2 "thin slices, short-lived branches"; Phase 5 strategies.

## Amazon: two-pizza teams & "you build it, you run it"
Small autonomous teams own a service from build through production operation, which
aligns incentives toward reliability and fast iteration. **Working Backwards** (write
the press release / FAQ first) clarifies intent before building.
→ *In this playbook:* small ownable scopes; Phase 0 RFC as a "working backwards" step;
Phase 6 operational ownership.

## Architecture Decision Records (ADRs) & RFCs
Lightweight, durable records of *why* a decision was made (context → decision →
consequences), and proposal docs reviewed before big work starts. Used widely
(Google design docs, Amazon PRFAQ, countless RFC processes).
→ *In this playbook:* Phase 0 RFC + ADRs for expensive-to-reverse choices.

## A note on the "Spotify model" (squads/tribes/chapters/guilds)
Frequently cited, but Spotify itself has said it was aspirational and not fully adopted
as drawn. Treat it as *inspiration* for autonomy + cross-cutting communities (chapters/
guilds ≈ sharing patterns across teammates), not a literal blueprint. Prefer Team
Topologies for concrete guidance.
