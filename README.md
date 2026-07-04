# claude-fleet-starter

A sanitized, reusable starter for a **permanent Claude Code setup**: a curated global
skill library, a persistent **agent fleet** (15 named specialists that accumulate memory
and compound over time), the **hooks** that wire them together, and a cross-project
**second brain** (Obsidian PARA vault). Everything personal has been stripped — this is a
template you make your own.

> Rename it to whatever you like. The internal fleet/system name here is **"axon."**

## What's inside

```
claude/                     → maps to ~/.claude/
├── CLAUDE.md               Global rulebook: skill-routing table + fleet orchestration
│                           policy + second-brain protocol. The heart of the setup.
├── settings.json           Hook wiring + agent-teams flag (TEMPLATE — replace <HOME>).
├── agents/                 The 15 fleet agent definitions (persona, role, model, memory).
└── skills/                 ~40 skills (see NOTICE.md for third-party attributions).

axon/                       → maps to ~/axon/ (the fleet's home; the app itself is NOT included)
├── agents/<id>/            Per-agent CHARTER.md + capabilities.json + skills.json +
│                           an empty memory/ scaffold (memory accumulates here at runtime).
├── hooks/                  The glue: fleet-context injector, subagent bridge, cost
│                           tracker, auto-handoff capture.
└── README.md              What the axon layer does and how it wires into settings.json.

secondbrain/                → maps to ~/SecondBrain/ (Obsidian PARA vault)
├── 00-Inbox .. 99-Claude-Memory   Empty PARA scaffold.
├── Templates/             Note templates (incl. the Claude-Memory format).
├── MEMORY.md              Empty memory index template.
└── README.md              The PARA + Claude-memory protocol.

mcp/                        MCP server config templates (placeholder tokens).
plugins/                    How to install the plugin marketplace + plugins.
NOTICE.md                   Third-party skill attributions.
LICENSE
```

## Quick start

1. **Skills + rulebook + agents** → copy `claude/` into `~/.claude/`:
   - `claude/CLAUDE.md` → `~/.claude/CLAUDE.md`
   - `claude/skills/*` → `~/.claude/skills/`
   - `claude/agents/*` → `~/.claude/agents/`
   - `claude/settings.json` → merge into `~/.claude/settings.json` (**replace `<HOME>`**
     with your absolute home path; hook commands don't expand `~`). Remove hooks you skip.
2. **Fleet home** → copy `axon/` to `~/axon/` (or edit the paths to wherever you put it).
   The hooks in `settings.json` point at `~/axon/hooks/…`.
3. **Second brain** → copy `secondbrain/` to `~/SecondBrain/` and open it as an Obsidian
   vault (optional but the fleet's memory protocol references it).
4. **MCP servers** → see `mcp/README.md` (Notion, Chrome DevTools, etc. — add your own tokens).
5. **Plugins** → see `plugins/README.md`.
6. **Restart Claude Code.** Agents and `CLAUDE.md` load at startup; `~/.claude/agents/`
   changes need a session restart before they're delegatable.

## The fleet at a glance

15 specialists (rename the personas to taste): Edward (senior SWE), Lain (AI/RAG), Doraemon
(devops), Gojo (QA/security), Lelouch (PM), Sai (design), Erwin (marketing), Shikamaru
(content/SEO), Kamina (video), Senku (research), Nami (controller), Kaiba (CFO), Reigen
(fundraising), Mahoraga (read-only health monitor), Izaya (read-only market intel). Full
roster + orchestration rules live in `claude/CLAUDE.md`.

Each agent reads its `~/axon/agents/<id>/memory/memory.jsonl` at task start and appends
durable learnings before finishing — that's how the fleet compounds. The scaffolds ship
empty; memory builds up as you use them.

## What was removed (and why)

This bundle was sanitized for public sharing. **Not included:** any credentials/tokens,
the original owner's name/email, absolute user paths, all accumulated agent + project
memory, personal project/employer details, and the Axon desktop application code itself
(only the fleet + hooks + config are here). Personal specifics in charters were
generalized to neutral, reusable guidance.

## License

Original skill/plugin content belongs to its respective authors — see `NOTICE.md`. The
scaffolding, rulebook, fleet charters, and hooks in this repo are provided under the
`LICENSE` file. Review third-party skill licenses before redistributing.
