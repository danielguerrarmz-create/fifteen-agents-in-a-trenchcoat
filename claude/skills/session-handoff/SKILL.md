---
name: session-handoff
description: Wrap up a work session into a durable, multi-surface handoff so the next session or a teammate can resume instantly. Use at the end of a substantive working session, or when the user says "session handoff", "update the handoff", "wrap up", "document this session", or "log today's progress". Writes/updates a dated handoff doc (What/Why/Verify/Left/Files), adds an entry to the project's live tracker/changelog, appends a dated session log to the project's Notion page(s), and commits — pushing only with approval.
argument-hint: [optional focus note]
user-invocable: true
---

# session-handoff — wrap up a work session

Produce a complete, honest record of what changed this session across every surface that
tracks the project, so work can resume with zero re-derivation.

## Steps
1. **Date + scope.** Get today's date with Bash `date +%F` (convert any relative dates to absolute). Review what changed: `git log` since the last handoff, `git status`, and the conversation.
2. **Find the project's surfaces:**
   - **Handoff dir** — prefer an existing `handoffs/` or `docs/handoffs/`; create one if neither exists.
   - **Live tracker** — a status/changelog file if the project has one (e.g. a `<!-- CHANGELOG_INJECT -->` marker in an HTML tracker, a `CHANGELOG.md`, or a PROGRESS doc).
   - **Notion** — search the Notion MCP for the project's page(s).
3. **Write the handoff** at `<handoff-dir>/YYYY-MM-DD-<slug>.md` in this exact shape:
   - **What** — bullets of what shipped/changed.
   - **Why** — the reasoning/goal behind it.
   - **Verify** — how it was checked (tests, live re-fetch, manual). Be explicit about what was *not* verified.
   - **Left** — owner actions + next steps, each with an owner.
   - **Files** — key files touched + the session's commit range.
4. **Update the live tracker** (if one exists): add a dated entry at the **top** of the changelog, matching its existing format/markup exactly (don't reinvent the structure).
5. **Update Notion:** append a `## Session log — YYYY-MM-DD` section (insert_content at end) to the project's page(s). Search to find the page first; if multiple pages apply (e.g. an umbrella + a sub-project), log to each relevant one.
6. **Commit** the repo changes (handoff + tracker). Run `gitleaks` if available. **Push only with the user's explicit OK.** Never commit secrets, `.env`, or gitignored working artifacts.
7. **Report:** the handoff path, the tracker entry, which Notion page(s) were updated, and the commit hash.

## Rules
- **Honest status.** If tests failed, a step was skipped, or something is deployed-but-unverified, say so plainly. Never claim "done + verified" without evidence — re-fetch/re-run to confirm when feasible.
- **Match each surface's existing format** — changelog markup, Notion page structure, handoff conventions. Adapt, don't impose.
- **Convert relative dates to absolute.**
- **Don't push without explicit approval**; don't commit secrets or gitignored state files.
- If a surface doesn't exist for this project (no Notion page, no tracker), **skip it and note that in your report** — don't fabricate one.
- Keep the handoff scannable: bullets over prose, link to detail files rather than inlining everything.

## Example (a studio operations system)
- Handoff dir: `handoffs/` → `handoffs/2026-06-22-session-geo-and-content-os.md`
- Tracker: `web-playbook.html` (insert a `change-entry` after `<!-- CHANGELOG_INJECT -->`)
- Notion: append "Session log — <date>" to the **Operations OS** and **Content OS** pages
- Commit the doc + tracker; push after the operator's OK.
