# NOTICE — third-party attribution for `claude/skills/`

`claude/skills/` is copied verbatim from a personal Claude Code setup. Skills come from a
mix of sources: official Anthropic/Vercel skills, an open third-party "context engineering"
collection, a couple of skills salvaged from stale community pull requests, one vendored
third-party GitHub repo, and a number of first-party/custom skills with no external license
attached. This file documents what's known from each skill's own `SKILL.md` frontmatter and
bundled files. **Verify licensing yourself before redistributing** — this is a best-effort
survey, not a legal opinion.

## Anthropic (official)

- **frontend-design** — Apache License 2.0 (full text in `frontend-design/LICENSE.txt`).
  Matches Anthropic's official `anthropics/skills` "Frontend design" skill.
- **skill-creator** — no separate license file, but its own instructions reference building
  "internal Anthropic dashboards" as an example, consistent with this being Anthropic's own
  official meta-skill for authoring/evaluating Claude Code skills.

## Vercel (MIT, `author: vercel`)

- **vercel-composition-patterns**
- **vercel-react-best-practices**
- **vercel-react-native-skills**
- **web-design-guidelines**

All four declare `license: MIT` and `metadata.author: vercel` in their `SKILL.md`
frontmatter (from the `vercel-labs` skills distribution).

## eachlabs

- **pinterest-pin-generation** — `metadata.author: eachlabs`; wraps "each::sense AI" for
  Pinterest pin image generation.

## Remotion (official — `remotion-dev/skills`)

- **remotion-best-practices**, **remotion-markup**, **remotion-captions**, **remotion-create**,
  **remotion-render**, **remotion-interactivity**, **remotion-saas**, **mediabunny** — the
  official Remotion team's Agent Skills package (`github.com/remotion-dev/skills`, published
  as `@remotion/skills`). Installed via the Vercel Labs `skills` CLI
  (`npx skills add remotion-dev/skills`). `remotion-best-practices` is a hub skill that lazily
  links the other seven, so the always-loaded cost is one description rather than eight.
  These replace an earlier single `remotion-video-creation` skill, which was a stale snapshot
  of the same upstream source before it was restructured. **Remotion itself is source-available
  under its own licence, not MIT — verify Remotion's licence terms before any commercial use.**

## Next Level Builder (MIT)

- **ui-ux-pro-max-skill** — MIT License, `Copyright (c) 2024 Next Level Builder`. Vendored
  from `github.com/nextlevelbuilder/ui-ux-pro-max-skill` ("UI UX Pro Max", https://uupm.cc).
  Full `LICENSE` and `README.md` are bundled inside the skill folder.

## "Agent Skills for Context Engineering" (ECC)

An open collection of context/harness-engineering skills by Murat Can Koylan
(`deepwiki.com/muratcankoylan/Agent-Skills-for-Context-Engineering`), imported into this
setup on 2026-06-03 via a marketplace channel referenced as `affaan-m/ecc`. Each of these
carries `origin: ECC` in its `SKILL.md` frontmatter:

- agent-harness-construction
- architecture-decision-records
- autonomous-loops
- codebase-onboarding
- context-budget
- continuous-learning-v2
- error-handling
- eval-harness
- iterative-retrieval
- manim-video
- safety-guard
- video-editing
- context-engineering-collection (the reference collection + example code itself, bundled
  as its own skill folder — see its `README.md` for the upstream repo and academic
  citations)

## Community (`origin: community`)

Claude Code community-marketplace skills, some explicitly salvaged from stale/unmerged pull
requests against a community skills repo:

- **cost-tracking** — "salvaged from stale community PR #1304 by `MayurBhavsar`" (per its
  own `SKILL.md`).
- **make-interfaces-feel-better** — "salvaged from stale community PR #1659 by `linus707`"
  (per its own `SKILL.md`).
- **scientific-thinking-literature-review** — `origin: community`, no further attribution
  found in `SKILL.md`.
- **scientific-thinking-scholar-evaluation** — `origin: community`, no further attribution
  found in `SKILL.md`.

## Author noted, source repo not specified — verify before redistribution

- **motion-foundations** — `author: jeff` in frontmatter; no repo/license/URL given.
- **motion-patterns** — `author: jeff` in frontmatter; no repo/license/URL given.
- **ui-ux-pro-max** (note: distinct folder from `ui-ux-pro-max-skill` above) — covers
  similar ground (UI/UX design intelligence: styles, palettes, font pairings) but has no
  `LICENSE`/`README`/author field bundled in this folder. Possibly an earlier or partial
  snapshot of the same lineage as `ui-ux-pro-max-skill` (Next Level Builder) — **source
  unknown — verify before redistribution.**

## No attribution found — appears first-party/custom (no `origin`/`author`/`license` field)

These have no third-party marker in their `SKILL.md` and read as custom-authored for this
personal setup:

- backend-api-rulebook
- caveman
- content-strategy
- debugging-playbook
- find-skills
- fleet-evolve *(authored for this setup — Mahoraga's self-revision pass)*
- fleet-instincts *(authored for this setup — how agents record learnings)*
- git-github-rulebook
- github-actions-docs
- roblox-game-development
- secure-coding-rulebook
- session-handoff
- team-orchestration
- testing-rulebook
- tldr

If you plan to redistribute this bundle further, treat this last group as **source unknown
— verify before redistribution**, since "no marker found" isn't the same as "confirmed
first-party."
