# Instincts — the Axon fleet's learning pile

Fleet agents (Edward, Gojo, Izaya, Kamina, …) write one file here whenever they
finish a task having learned something durable. Mahoraga is the only reader: he
sweeps this directory, throws most of it away, clusters what survives, and
proposes changes to the fleet in `~/.claude/agents/_proposals/`. **the operator
approves; nothing here mutates an agent on its own.**

Set up 2026-07-14. The protocol lives in the `fleet-instincts` skill; the sweep
lives in `fleet-evolve`.

## Format

One lesson per file, `<slug>.md`:

```markdown
---
id: izaya-source-triage
trigger: when researching a funding round
agent: izaya
confidence: 0.7          # 0.3 guess · 0.5 default · 0.7 strong · 0.9 the operator confirmed
domain: research         # research | security | video | design | finance | build | content
scope: global            # or a project name
status: pending          # pending | applied | rejected  (Mahoraga sets this)
---

Check the filing before the press release; announced round sizes are routinely
inflated relative to the Form D.

**Why:** Two of five rounds checked in this task had a gap over 30%.
**How to apply:** Cite the filing figure, note the announced one as a claim.
```

## What does NOT belong here

- Anything the repo, git history, or an existing skill already records.
- Task-local trivia ("the config was at line 40").
- Guesses. Low-confidence noise poisons the cluster and wastes Mahoraga's sweep.

Writing nothing is the correct outcome for most tasks. A padded instinct is worse
than none, because it dilutes the signal the whole loop depends on.

## Status lifecycle

`pending` → swept by Mahoraga → either `applied` (a proposal the operator approved drew
on it) or `rejected` (the operator declined). A rejected instinct is never resurfaced in
a later sweep. That is deliberate: an instinct that keeps coming back after
rejection is exactly how a learning loop fails to converge.
