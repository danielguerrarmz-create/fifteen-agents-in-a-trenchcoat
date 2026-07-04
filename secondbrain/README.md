# secondbrain/ — persistent cross-project memory (PARA + Claude-memory protocol)

This is a starter scaffold for a long-term knowledge base — a "second brain" — meant to be
the source of truth for anything that should persist **across sessions and projects**,
independent of any single repo's own docs. It's designed to live as an Obsidian vault (or
any plain-Markdown, git-backed folder) at a stable path such as `~/SecondBrain`, and to be
read by Claude Code at the start of substantive work.

## Structure (PARA)

- **00-Inbox** — unsorted capture; triage into the folders below.
- **01-Projects** — things with a goal and an end date. One note per project.
- **02-Areas** — ongoing responsibilities with no end date (health, finances, a role).
- **03-Resources** — reference material and things you're interested in, not tied to a
  specific project.
- **04-Archive** — completed/inactive projects and areas, moved here rather than deleted.
- **05-Daily** — daily notes (optional; use if you like a daily-journal habit).
- **06-Wiki** — an optional condensed, cross-linked knowledge layer distilled from your own
  session history (see below).
- **99-Claude-Memory** — durable, atomic memory notes written by Claude Code itself (see
  the protocol below). This is the folder Claude actually writes to.

## The Claude-memory protocol

1. **At the start of substantive work**, read `MEMORY.md` (this index) and open any linked
   memory notes that look relevant to the task.
2. **Save durable, cross-project facts** as individual notes in `99-Claude-Memory/` using
   `Templates/Claude-Memory.md`: YAML frontmatter with `metadata.type: user | feedback |
   project | reference`; for `feedback`/`project` notes, add **Why:** and **How to apply:**
   lines so the note is actionable, not just descriptive.
3. **Add a one-line pointer** under the right heading in `MEMORY.md`:
   `- [Title](99-Claude-Memory/file.md) — hook`.
4. **Link related notes** with `[[wiki-links]]`, and link to your own PARA notes where it
   connects the graph.
5. **Before saving, check for an existing note** that already covers the same ground and
   update that instead of duplicating. Delete notes that turn out to be wrong.
6. **Don't store** what the repo/code/git already records, secrets, or conversation-only
   trivia. Convert relative dates ("yesterday", "last week") to absolute dates when saving.
7. **Prefer this vault over any single project's own harness/agent memory** for anything
   meant to outlive that project.

## Optional: an LLM Wiki layer (`06-Wiki/`)

If you have a large archive of past AI-assistant transcripts, you can distill it into a
condensed, cross-linked wiki under `06-Wiki/` (a "hot" page of the most-relevant condensed
facts, an index, and topic pages) so future sessions can pull cross-project context in a
couple of reads instead of searching the raw archive. Keep the raw transcript archive
local-only/git-ignored; version only the distilled wiki pages. This is an advanced/optional
pattern — most setups won't need it starting out.

## Templates

See `Templates/` for the note shapes referenced above (`Area.md`, `Claude-Memory.md`,
`Daily.md`, `Project.md`, `Resource.md`). Frontmatter uses a `{{date}}`/`{{title}}`
placeholder convention — fill these in (or wire up your editor's templating) when creating
a new note.
