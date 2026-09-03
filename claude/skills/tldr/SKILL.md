---
name: tldr
description: Summarize what a file does in plain English. Use when the user asks for a quick explanation, summary, or "what does this file do" for a specific file path. Invoke with /tldr <file-path>.
argument-hint: [file-path]
allowed-tools: Read, Glob
---

# tldr — plain-English file summary

Produce a short, jargon-light summary of the file the user names.

## Steps
1. Read the file at the path provided as the argument. If no path was given, ask the user which file (or use Glob to help locate it).
2. Summarize in this exact shape:
   - **Purpose** — one sentence on what the file is for.
   - **Key parts** — 3–6 bullets naming the most important functions/classes/sections and what each does.
   - **Dependencies** — notable imports or external things it relies on (skip if none).
   - **Gotchas** — anything surprising, risky, or easy to misuse (skip if none).
3. Keep it under ~150 words. Favor clarity over completeness — this is a TL;DR, not documentation.

## Rules
- Do not modify the file (read-only skill).
- If the file is huge, summarize the structure rather than every detail.
- Match the reader's likely level: explain domain jargon briefly the first time it appears.

<!--
This skill is also a TEMPLATE. To make your own global skill:
  1. Create ~/.claude/skills/<your-skill-name>\SKILL.md
  2. Set `name` + a strong `description` (the description is how Claude decides when to auto-use it).
  3. Optional frontmatter: allowed-tools, argument-hint, disable-model-invocation,
     user-invocable, model, effort, context: fork, agent, paths, hooks.
  4. It auto-loads in every session — no settings.json change needed.
-->
