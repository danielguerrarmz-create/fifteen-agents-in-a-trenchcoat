# mcp/ — MCP server templates

`mcp-servers.template.json` documents the three MCP servers this setup is built around.
None of these need paid API keys except where noted; all values shown are placeholders —
**never commit real tokens**.

| Server | Purpose | Auth |
|---|---|---|
| `notion` | Two-way sync with a Notion workspace (tasks/projects DB) | Notion internal integration token |
| `chrome-devtools` | Live browser inspection/automation from Claude Code | none |
| `robloxstudio` | Bridges Claude Code into a running Roblox Studio session (for AI-assisted game dev) | none, but requires one-time manual setup in Studio (see below) |

## Adding these to your own setup

MCP servers can be registered at two scopes:

1. **Global** — merge the contents of `mcpServers` into `~/.claude.json` (Claude Code's
   global config). This makes the server available in every project.
2. **Per-project** — create a `.mcp.json` in the project root with the same shape. Claude
   Code picks this up automatically when you run `claude` from that directory. Prefer this
   for project-specific servers (e.g. `robloxstudio` only matters inside a Roblox project).

Copy `mcp-servers.template.json`'s contents into whichever file, fill in the real
`YOUR_NOTION_TOKEN` (or drop that server entirely if you don't use Notion), and restart
Claude Code so it picks up the new MCP config.

## robloxstudio-mcp one-time setup

This one needs manual, Studio-side steps that only you can do (no CLI can automate them):

1. Install the companion Roblox Studio plugin for `robloxstudio-mcp`.
2. In Studio: **Game Settings → Security → Allow HTTP Requests**.
3. Restart Claude Code so the MCP server loads and can reach the running Studio session.

## Secrets

Never commit a `.mcp.json` or `~/.claude.json` containing a real token. If you need to
share a project's MCP config, share the sanitized template (with placeholders) and let each
person fill in their own secrets locally, or use your OS keychain / a secrets manager and
reference an env var instead of a literal value where the MCP server supports it.
