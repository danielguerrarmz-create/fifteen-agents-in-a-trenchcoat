---
name: fleet-instincts
description: Record a durable learning from a completed task as an instinct note, so the Axon fleet compounds instead of forgetting. Use at the END of any substantive task when you learned something that would change how this work is done next time — a correction, a confirmed approach, a gotcha, a source that proved reliable or unreliable. Do NOT use for facts the repo/git already records, or for conversation-only trivia.
---

# Fleet Instincts — how the fleet compounds

An **instinct** is one atomic learned behavior: a trigger, what to do, and why.
Instincts are written by fleet agents during work, and swept later by Mahoraga,
who clusters them and proposes changes to the fleet. You write; you never apply.

## When to write one

Write an instinct when, having finished the work, you can complete this sentence
with something that is **not already obvious from the code, the repo, or CLAUDE.md**:

> "Next time someone does this, they should know ______."

Good instincts:
- A source, tool, or approach that proved reliable (or that wasted time).
- A correction the operator made, and the reasoning behind it.
- A gotcha that cost you a retry loop and would cost the next agent one too.
- A sequencing lesson ("check X before Y or you redo Y").

**Do not** write an instinct for:
- Anything the repo, git history, or an existing skill already records.
- One-off facts about this specific task ("the file was at line 40").
- Restating your own charter back at yourself.
- Something you are guessing at. Low-confidence noise poisons the cluster.

One lesson per file. If you learned two things, write two files.

## How to write one

Create `~/secondbrain/99-Claude-Memory/instincts/<slug>.md`:

```markdown
---
id: <short-kebab-case-slug>
trigger: <the situation that should fire this — "when researching a funding round">
agent: <your agent name, e.g. izaya>
confidence: <0.3 low / 0.5 default / 0.7 strong / 0.9 the operator confirmed it>
domain: <one word: research | security | video | design | finance | build | content>
scope: <project name, or "global" if it applies everywhere>
status: pending
---

<One or two sentences: what to do.>

**Why:** <what happened that taught you this>
**How to apply:** <what a future agent should do differently>
```

Set `confidence` honestly. `0.9` is reserved for things the operator explicitly
confirmed or corrected. A guess is `0.3` and will likely be discarded — that is
fine and correct.

Leave `status: pending`. Mahoraga sets it. Never edit another agent's instinct,
and never promote your own.

## Escalating to Mahoraga

If the learning is **urgent or structural** (an agent is misconfigured, a skill
is wrong, a gate is missing), still write the instinct, but also say so plainly
in your final summary to the orchestrator so it reaches the operator this session
rather than on the next sweep.

## What happens next

Mahoraga sweeps `instincts/` on demand (`/fleet-evolve`), clusters related
instincts, and writes **proposals** to `~/.claude/agents/_proposals/`. the operator
approves or rejects. Only then does anything change. Nothing you write here
mutates the fleet on its own.
