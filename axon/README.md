# axon/ — the fleet layer

This directory is the "glue" that turns a set of Claude Code subagent definitions into a
persistent, self-aware fleet: durable charters, a display-name registry, and a handful of
Claude Code hooks that inject fleet context, bridge subagent activity, track cost, and
auto-capture session handoffs.

It is designed to sit alongside a home-directory folder conventionally called `~/axon`
(rename it to whatever you like — just keep the paths in `claude/settings.json` and the
hook scripts consistent).

## Layout

```
axon/
  agents/
    agent-names.json        # id -> display-name registry (single source of truth for names)
    <agent-id>/
      CHARTER.md             # the agent's persona, standing instructions, voice, memory rules
      capabilities.json       # tool/MCP/path grants for in-app or scripted dispatch (optional)
      skills.json              # which of claude/skills/ this agent should prioritize
      memory/                  # empty here — agents append memory.jsonl at runtime (gitignored)
  hooks/
    fleet-context-injector.mjs  # SessionStart — injects the fleet roster + delegation rules
    subagent-bridge.mjs         # PreToolUse(Task) + SubagentStop — activity + cost ledger
    cost-tracker.mjs            # SessionEnd — sums transcript token usage into a local SQLite DB
    auto-handoff/capture.mjs    # SessionEnd — writes a deterministic git-state handoff doc
```

## How it maps to `~/axon`

Clone or copy this `axon/` directory to `~/axon` (or point the env vars below at wherever
you put it). The hooks default to `~/axon` but every path is overridable:

| Hook | Reads | Env overrides |
|---|---|---|
| `fleet-context-injector.mjs` | `~/axon/agent-names.json` | (none yet — edit `AGENT_NAMES_PATH` in the script if you move it) |
| `subagent-bridge.mjs` | `~/axon/agents/`, `~/axon/agent-names.json` | `AXON_REPO_ROOT`, `AXON_AGENTS_DIR`, `AXON_AGENT_NAMES_PATH`, `AXON_BRIDGE_STATE_DIR`, `AXON_SERVICE_URL`, `AXON_PORT` |
| `cost-tracker.mjs` | (transcript path from the hook event) | writes to `~/.claude-cost-tracker/usage.db` |
| `auto-handoff/capture.mjs` | the repo the session ran in | `AXON_REPOS_ROOT`, `AXON_EXCLUDED_REPOS` |

## Wiring into `~/.claude/settings.json`

Register the hooks under the matching Claude Code hook events. Adjust the paths to wherever
you actually placed this directory.

```json
{
  "hooks": {
    "SessionStart": [
      { "hooks": [{ "type": "command", "command": "node \"~/axon/hooks/fleet-context-injector.mjs\"" }] }
    ],
    "PreToolUse": [
      { "matcher": "Task", "hooks": [{ "type": "command", "command": "node \"~/axon/hooks/subagent-bridge.mjs\"" }] }
    ],
    "SubagentStop": [
      { "hooks": [{ "type": "command", "command": "node \"~/axon/hooks/subagent-bridge.mjs\"" }] }
    ],
    "SessionEnd": [
      { "hooks": [{ "type": "command", "command": "node \"~/axon/hooks/cost-tracker.mjs\"" }] },
      { "hooks": [{ "type": "command", "command": "node \"~/axon/hooks/auto-handoff/capture.mjs\"" }] }
    ]
  }
}
```

Notes:
- All four hooks are fail-safe: they never throw in a way that blocks Claude Code, and
  always exit 0.
- If you already have other hooks registered on these events, append to the existing
  `hooks` array rather than replacing it.
- Requires Node >= 22.5.0 for `cost-tracker.mjs` (built-in `node:sqlite`).
- `subagent-bridge.mjs` and `auto-handoff/capture.mjs` post best-effort to a local daemon
  (`AXON_SERVICE_URL`, default `http://127.0.0.1:8787`) if you're also running the Axon app
  (not included in this starter bundle); without it, they still write their durable,
  file-based records (`agents/<id>/log/runs.jsonl`, `docs/handoffs/*.md`).

## Agent charters

Each `axon/agents/<id>/CHARTER.md` defines one persistent persona: role, standing
instructions, voice, a memory-discipline note, and its usual collaborators. The charters in
this bundle describe a generic, illustrative portfolio (an internal AI/RAG platform, a
video-content pipeline, a render-critique tool, etc.) — replace the specifics with your own
projects, keep the persona names and roles if you like the roster, or rename freely. See
`claude/CLAUDE.md`'s routing table for how the orchestrating Claude session is told to
delegate to this roster by default.

## Memory

Each agent's `memory/` folder is checked in empty (`.gitkeep` only). At runtime, agents
append durable facts/decisions to `memory/memory.jsonl` — keep that file gitignored (see the
repo's top-level `.gitignore`) since it accumulates whatever personal/project context you
feed the fleet.
