---
name: fleet-evolve
description: Sweep the instincts the Axon fleet has recorded, cluster them, and propose concrete amendments to agent charters, skills, and preloads — then apply the ones the operator approves. This is the fleet's self-revision pass. Use when the operator says "/fleet-evolve", "evolve the fleet", "what has the fleet learned", "run the learning pass", or asks why an agent keeps making the same mistake. Also use to audit the fleet's context/token budget.
---

# Fleet Evolve — the self-revision pass

Mahoraga runs this. It is the only path by which the fleet changes itself, and it
is **gated**: Mahoraga proposes, the operator disposes. Never edit a fleet agent file
directly in this skill. Write a proposal and stop.

## Inputs

- `~/SecondBrain/99-Claude-Memory/instincts/*.md` — what the fleet learned.
- `~/.claude/agents/*.md` — the current fleet.
- `~/.claude/skills/` — what's already installed (never propose a duplicate).

## Phase 1 — Sweep

Read every instinct with `status: pending`. Discard, with a one-line reason logged,
any instinct that is:
- **Already covered** by an existing skill, an agent's charter, or CLAUDE.md.
- **Below 0.5 confidence and unsupported** by any sibling instinct.
- **Task-local trivia** rather than a durable behavior.

Discarding is the most valuable thing you do here. A fleet that absorbs every
stray observation degrades. Be ruthless; log what you dropped so it's auditable.

## Phase 2 — Cluster

Group surviving instincts by `domain` + `trigger` similarity. A cluster is
**actionable** when it has either:
- **2+ independent instincts** pointing the same way (ideally from different agents
  or different sessions — two from one agent in one session is one observation, not two), or
- **1 instinct at confidence 0.9** (the operator confirmed it directly).

A single 0.5 instinct is not a cluster. Leave it `pending` and let it accumulate.

## Phase 3 — Propose

For each actionable cluster, decide the **smallest intervention** that fixes it:

| The cluster says… | Propose |
|---|---|
| An agent keeps missing context it needs | Add a skill to that agent's `skills:` preload |
| An agent reaches for the wrong approach | A charter body amendment (one line, imperative) |
| A recurring workflow has no home | A new skill (only if no existing skill covers it) |
| An agent lacks a tool it keeps needing | A `tools:` addition — flag as permission-widening |
| The operator corrects the same thing repeatedly | A memory note, not an agent edit |

Prefer charter lines over new skills; prefer new skills over new agents. Never
propose a new fleet member — the roster is the operator's call.

Write each proposal to `~/.claude/agents/_proposals/YYYY-MM-DD-<agent>.md`:

```markdown
---
target: <agent filename, e.g. izaya.md>
kind: <preload | charter | tools | new-skill>
confidence: <cluster's aggregate>
sources: [<instinct ids that drove this>]
---

## What changes
<The exact diff. Show the before and after lines verbatim.>

## Why
<The evidence: which instincts, from which agents, saying what.>

## Cost
<Token cost if this is a preload: chars of the SKILL.md, and how often this
agent is spawned. A preload on a rarely-spawned agent is a net loss — say so.>

## Risk
<What breaks if this is wrong.>
```

Then **stop and report to the operator**. Do not apply.

## Phase 4 — Apply (only on the operator's explicit approval)

When the operator approves specific proposals by name:
1. Back up `~/.claude/agents/` first.
2. Apply only the approved diffs, exactly as written in the proposal.
3. Mark the driving instincts `status: applied` and add `applied: <date>`.
4. Move the proposal to `_proposals/applied/`.
5. Commit the SecondBrain vault.
6. Remind the operator that **agent changes only load at Claude Code startup** — a
   session restart is required before any of it takes effect.

Rejected proposals move to `_proposals/rejected/` with the operator's reason recorded.
Mark their instincts `status: rejected` so they never resurface in a later sweep —
an instinct that keeps coming back after rejection is how a learning loop fails to
converge.

## Context-budget audit (run this in the same pass)

The fleet's preloads are a standing token tax: every `skills:` entry is injected
in full on every spawn of that agent. Report:

- Per agent: total preload chars, and therefore tokens (÷4), paid **per spawn**.
- Which preloads are on rarely-spawned agents. Each subagent has its own cache
  entry, so a preload on an agent spawned once a week pays the 1.25× cache-write
  every time and **never gets a cache read**. That is pure cost — recommend
  dropping it to on-demand via the `Skill` tool.
- Any preloaded skill over ~10k chars (~2.5k tokens). Flag it. `ui-ux-pro-max`
  (~45k chars) must never be preloaded.

Recommend, don't apply. Same gate.
