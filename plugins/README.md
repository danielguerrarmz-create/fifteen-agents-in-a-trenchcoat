# plugins/ — Claude Code plugin marketplace setup

This starter kit doesn't vendor any plugin binaries or caches (those are local build/install
artifacts, not source you'd want to share). Instead, here's how to install the plugin this
setup uses.

## Marketplace

Claude Code plugins are distributed via marketplaces — git repos or registries that list
installable plugins. This setup uses Anthropic's official marketplace:

```
anthropics/claude-plugins-official
```

## Installing a plugin

From any Claude Code session:

```
/plugin marketplace add anthropics/claude-plugins-official
/plugin install discord
```

- `marketplace add` registers the marketplace (one-time, global).
- `plugin install <name>` installs a specific plugin from a registered marketplace.
- Use `/plugin` with no arguments to browse installed/available plugins interactively.

## The `discord` plugin

Adds Discord-related tooling/integration to Claude Code. Check the plugin's own README
(surfaced via `/plugin`) for what it wires up and any tokens it needs — provide those via
your own `.env`/secrets manager, never hardcode them in a shared config.

## Notes

- Plugin installs are local (cache + compiled bits live under your Claude Code data
  directory) — don't commit that cache to a shared repo; it's excluded by this repo's
  `.gitignore`.
- If you maintain your own private plugin marketplace, the same `/plugin marketplace add
  <owner>/<repo>` flow works for any git repo that follows the marketplace manifest format.
