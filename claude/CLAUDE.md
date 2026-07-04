# Skill Activation Rulebook

This is a **template** global-instructions file (`~/.claude/CLAUDE.md`). It wires up a
curated set of global skills, a persistent **agent fleet**, and a cross-project
**second brain**. Replace `the operator` / `YOUR_NAME` with yourself and adapt the
project references to your own work.

I maintain a curated set of global skills (in `~/.claude/skills/`). **At the start of any
task, match the request against the table below and proactively activate the relevant
skill(s) before doing the work — don't wait to be asked.** Match on *context and intent*,
not just literal keywords. When several apply, use them together (e.g. an authenticated
API endpoint → `backend-api-rulebook` + `secure-coding-rulebook` + `testing-rulebook`).
Activate a skill with the Skill tool (e.g. `/tldr`) or by following its guidance.

## Routing table

| Activate this skill | When the task involves… |
|---|---|
| **frontend-design** | Building or styling web UI — components, pages, landing pages, dashboards, "make this look good" |
| **web-design-guidelines** | Reviewing/auditing UI for accessibility, UX, or design-guideline compliance |
| **vercel-react-best-practices** | React/Next.js performance, data fetching, rendering, bundle size |
| **vercel-composition-patterns** | React component architecture — compound components, render props, reusable APIs |
| **vercel-react-native-skills** | React Native / Expo / mobile app work |
| **backend-api-rulebook** | Server-side code, REST/HTTP APIs, endpoints, DB schema/migrations, queries, reliability |
| **secure-coding-rulebook** | Auth, user input, injection/XSS/SSRF, secrets, crypto, "is this secure", "harden", threat-model |
| **testing-rulebook** | Writing/structuring tests, test strategy, mocking, or fixing a bug (always add a regression test) |
| **debugging-playbook** | Finding *why* something is broken — crashes, stack traces, failing/flaky tests, "it used to work" |
| **git-github-rulebook** | Git/GitHub mechanics — commits, branches, PRs, merge/rebase, conflicts, releases, "I messed up my branch" |
| **github-actions-docs** | GitHub Actions / CI-CD workflow YAML (triggers, matrices, caching, OIDC, reusable workflows) |
| **team-orchestration** | ANY large or multi-disciplinary task — building/shipping an app or feature end-to-end. Spin up a team and delegate to the dedicated agents below rather than doing it all solo |
| **context-engineering-collection** | Building, optimizing, or debugging agent systems / multi-agent architectures / context strategy |
| **skill-creator** | Creating, editing, optimizing, or evaluating a skill |
| **find-skills** | The user wants a capability that might exist as an installable skill ("is there a skill for…") |
| **tldr** | "What does this file do" / summarize a specific file (`/tldr <path>`) |
| **caveman** | The user wants ultra-terse, token-saving output ("caveman mode", "be brief", `/caveman`) |
| **agent-harness-construction** | Designing an agent's action space, tool definitions, or observation formatting for higher task-completion rates |
| **autonomous-loops** | Building autonomous Claude Code loops — sequential pipelines, multi-agent DAGs, quality gates |
| **eval-harness** | Eval-driven development — formally scoring Claude Code session quality against a rubric |
| **context-budget** | Auditing/trimming context-window consumption across agents, skills, MCP servers, rules for token savings |
| **iterative-retrieval** | Progressively refining context retrieval — the subagent "not enough context" problem |
| **continuous-learning-v2** | Instinct-based learning that observes sessions via hooks and evolves skills (needs hook wiring) |
| **cost-tracking** | Reporting Claude Code token usage, spend, and budgets by project/tool/session/date |
| **codebase-onboarding** | Joining an unfamiliar repo — architecture map, entry points, conventions, starter CLAUDE.md |
| **architecture-decision-records** | Capturing the *why* behind a non-obvious architectural decision as an ADR |
| **error-handling** | Robust error handling — typed errors, retries, circuit breakers, user-facing messages (TS/Python/Go) |
| **safety-guard** | Preventing destructive operations on production systems or during autonomous/agentic runs |
| **make-interfaces-feel-better** | Concrete UI polish — spacing, type, borders, shadows, motion, hit areas, interaction states |
| **motion-foundations** | Motion tokens, springs, perf/a11y/SSR rules for React/Next (`motion/react`) — base layer for animation work |
| **motion-patterns** | Ready-made React/Next animation patterns — modal, toast, stagger, page/exit transitions |
| **manim-video** | Clean animated technical explainers via Manim (concepts, graphs, system diagrams) |
| **remotion-video-creation** | Programmatic video in React (Remotion) — 29 domain rules for a video pipeline |
| **video-editing** | End-to-end video editing — FFmpeg, Remotion, ElevenLabs, fal.ai, Descript/CapCut polish |
| **content-strategy** | Editorial positioning, content pillars, calendars, topical authority, content governance |
| **scientific-thinking-literature-review** | Systematic literature review — search planning, source screening, synthesis, citation checks |
| **scientific-thinking-scholar-evaluation** | Evaluating papers/proposals/methods sections, evidence quality, research-writing feedback |

## Built-in commands also available
`/code-review` (bug + cleanup review of the diff), `/security-review` (security review of a
diff), `/verify` (run the app and confirm a change works), `/run` (launch the app),
`/simplify` (quality cleanup of changed code), `/deep-research`, `/claude-api`.

## Dedicated agents & orchestration policy — the Axon fleet

The **Axon fleet** are permanent agents for **every** project (`~/.claude/agents/`). They
persist across sessions, accumulate memory in `~/axon/agents/<id>/memory/memory.jsonl`, and
**compound with each task**. Call them by display name or let auto-delegation route to them.

| Agent (display) | id | Role | Model |
|---|---|---|---|
| **Edward** | claudio | Senior SWE / primary builder & overseer | opus |
| **Lain** | atlas-rag-engineer | AI Systems & RAG Engineer | opus |
| **Doraemon** | dev-automation | DevOps & Automation (builds, packaging) | sonnet |
| **Gojo** | vega-guardian | QA & Security Guardian | opus |
| **Lelouch** | marco-pm | Product Manager (scope/sequencing) | sonnet |
| **Sai** | mira-designer | Product Designer | sonnet |
| **Erwin** | bianca-marketing | Marketing Manager | sonnet |
| **Shikamaru** | selene-seo | Content & SEO Strategist | sonnet |
| **Kamina** | quetzal-video | Video Producer (Remotion pipeline) | sonnet |
| **Senku** | rosalind-scholar | Research & Scholar | sonnet |
| **Nami** | sloane-controller | Controller / Accountant | sonnet |
| **Kaiba** | augustin-cfo | CFO / Finance Lead | opus |
| **Reigen** | esperanza-fundraising | Fundraising & Investor Relations | sonnet |
| **Mahoraga** | mahoraga | Assistance Monitor (read-only/advisory) | opus |
| **Izaya** | market-intel | Market Intelligence Analyst (read-only) | sonnet |

**Standing rules:**
1. **Delegate to the fleet by default.** From the first message of every session, across
   every project. Match the task to the right member (Edward = engineering, Sai = design,
   Gojo = QA/security, Doraemon = build/devops/packaging, Lelouch = PM/scope, Lain =
   RAG/AI-systems, Kamina = video, Shikamaru/Erwin = content/marketing,
   Nami/Kaiba/Reigen = finance, Senku = research, Izaya = market intel, Mahoraga =
   health/audit). If you're about to start work without delegating, stop and route first.
2. **The fleet replaces generic throwaway subagents.** When a fleet member needs more
   hands, **it** spawns its own sub-agents (general-purpose / Explore) and directs them.
3. **They compound:** each member reads its memory at task start and appends durable
   learnings before finishing, so the fleet grows over time. Don't let a task's knowledge
   evaporate into a throwaway agent.
4. Very high-stakes / irreversible / security-critical calls → convene the **MAGI
   council** (a multi-agent review) / escalate to the operator rather than deciding solo.
5. Reserve solo (orchestrator-only) execution for trivial single-step tasks (rename a
   file, one-line tweak with no downstream risk).

**Activation note:** Claude Code loads `~/.claude/agents/` at **startup** — after adding
or editing fleet files, a **session restart** is required before they become delegatable.

## Persistent second brain (Obsidian vault) — cross-project memory

Keep a canonical, long-term knowledge base — a shared "second brain" — as an Obsidian
vault at **`~/SecondBrain`** (PARA structure; git-backed private repo). This is the source
of truth for anything that should persist across **sessions and projects**.

- **At the start of substantive work, read `~/SecondBrain/MEMORY.md`** (the index) and
  open any linked memory notes that look relevant.
- **Save durable, cross-project facts** as individual notes in
  `SecondBrain/99-Claude-Memory/` using the `Templates/Claude-Memory.md` format (YAML
  frontmatter with `metadata.type: user | feedback | project | reference`; for
  feedback/project add **Why:** and **How to apply:** lines). Then add a one-line pointer
  under the right heading in `SecondBrain/MEMORY.md`
  (`- [Title](99-Claude-Memory/file.md) — hook`). Link related notes with `[[name]]`.
- **Before saving, check for an existing note** that already covers it and update that
  instead of duplicating; delete notes that turn out to be wrong.
- **Don't store** what the repo/code/git already records, secrets, or conversation-only
  trivia. Convert relative dates to absolute.
- **Prefer this vault over per-project harness memory** for anything meant to last beyond
  the current project. Keep notes clean Markdown. Commit meaningful changes to git when
  wrapping up a work session.

### Optional: distilled wiki layer (`SecondBrain/06-Wiki/`)
A condensed, cross-linked knowledge base distilled from your archived Claude transcripts
(keep the raw archive local-only/git-ignored; version only the distilled wiki). Read
`06-Wiki/hot.md` → `06-Wiki/index.md` → drill into a page to pull cross-project context.
Don't read it for generic coding questions or things already in the current project.

## Activation rules
- **Prefer activating a matching skill over winging it.** These encode conventions and
  safety rules (never force-push shared branches, never commit secrets, regression-test
  every bug fix) that are easy to skip from memory.
- **Stack skills** for multi-faceted work rather than picking just one.
- **Don't force-trigger.** A *conceptual question about* a topic is not the same as *doing
  the work* — answer directly. Single trivial tasks usually don't need a skill either.
- For diff review prefer the built-in `/code-review` / `/security-review`; for *writing*
  new secure code prefer `secure-coding-rulebook`.

## Environment notes
- Example environment: native Windows 11 (PowerShell / Git Bash; no WSL). Adjust to yours.
- Agent teams can run in-process (cycle teammates with Shift+Down) or via tmux split panes
  under WSL+tmux. Set `teammateMode` in `~/.claude/settings.json` accordingly.
