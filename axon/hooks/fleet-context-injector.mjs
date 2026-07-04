#!/usr/bin/env node
/**
 * Axon fleet-context-injector — SessionStart hook
 *
 * Fires at the start of every Claude Code session. Outputs a SessionStart hook
 * JSON response that injects the live Axon fleet roster + standing delegation
 * rules as additionalContext so the orchestrator always knows the fleet exists
 * and is the required default.
 *
 * Agent roster is read from ~/axon/agent-names.json (id -> display name). Role +
 * model metadata is baked in here (kept in sync with CLAUDE.md). If
 * agent-names.json is missing or malformed, a hardcoded fallback roster is used
 * so the hook never silently degrades.
 *
 * Safe: always exits 0. Never throws in a way that blocks Claude Code.
 * Stderr output is prefixed [fleet-context-injector].
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// ── Fleet metadata (role + model; update here when CLAUDE.md changes) ─────────
// This roster is illustrative — rename/re-role the fleet to fit your own projects.

const FLEET_META = [
  { id: 'claudio',               display: 'Edward',    role: 'Senior SWE / primary builder & overseer',         model: 'opus'   },
  { id: 'atlas-rag-engineer',    display: 'Lain',      role: 'AI Systems & RAG Engineer',                       model: 'opus'   },
  { id: 'dev-automation',        display: 'Doraemon',  role: 'DevOps & Automation (builds, packaging)',         model: 'sonnet' },
  { id: 'vega-guardian',         display: 'Gojo',      role: 'QA & Security Guardian',                          model: 'opus'   },
  { id: 'marco-pm',              display: 'Lelouch',   role: 'Product Manager (scope/sequencing)',              model: 'sonnet' },
  { id: 'mira-designer',         display: 'Sai',       role: 'Product Designer',                                model: 'sonnet' },
  { id: 'bianca-marketing',      display: 'Erwin',     role: 'Marketing Manager',                               model: 'sonnet' },
  { id: 'selene-seo',            display: 'Shikamaru', role: 'Content & SEO Strategist',                        model: 'sonnet' },
  { id: 'quetzal-video',         display: 'Kamina',    role: 'Video Producer (Remotion)',                       model: 'sonnet' },
  { id: 'rosalind-scholar',      display: 'Senku',     role: 'Research & Scholar (comp design / HCI)',          model: 'sonnet' },
  { id: 'sloane-controller',     display: 'Nami',      role: 'Controller / Accountant',                         model: 'sonnet' },
  { id: 'augustin-cfo',          display: 'Kaiba',     role: 'CFO / Finance Lead',                              model: 'opus'   },
  { id: 'esperanza-fundraising', display: 'Reigen',    role: 'Fundraising & Investor Relations',                model: 'sonnet' },
  { id: 'mahoraga',              display: 'Mahoraga',  role: 'Assistance Monitor (read-only/advisory)',         model: 'opus'   },
  { id: 'market-intel',          display: 'Izaya',     role: 'Market Intelligence Analyst (read-only)',         model: 'sonnet' },
];

// ── Load live display-name map from agent-names.json (optional override) ──────

const AGENT_NAMES_PATH = path.join(os.homedir(), 'axon', 'agent-names.json');

function loadDisplayNames() {
  try {
    const raw = fs.readFileSync(AGENT_NAMES_PATH, 'utf8');
    return JSON.parse(raw); // { id: displayName, ... }
  } catch {
    process.stderr.write('[fleet-context-injector] agent-names.json not found or malformed — using baked-in roster\n');
    return null;
  }
}

// ── Build the compact fleet table (token-lean) ─────────────────────────────────

function buildFleetTable(nameMap) {
  const rows = FLEET_META.map(({ id, display, role, model }) => {
    // Live display name from agent-names.json wins if present.
    const liveDisplay = nameMap ? (nameMap[id] || display) : display;
    return `| ${liveDisplay} | ${id} | ${role} | ${model} |`;
  });

  return [
    '## Axon Fleet — active agents (MANDATORY default for ALL tasks)',
    '',
    '| Name | Agent ID | Role | Model |',
    '|------|----------|------|-------|',
    ...rows,
    '',
    '### Standing rules — NO EXCEPTIONS, EVERY SESSION',
    '1. ALWAYS delegate to the matching fleet member. Never spin up generic throwaway subagents.',
    '2. Match by role: Edward=SWE, Sai=design, Gojo=QA/security, Doraemon=DevOps/build,',
    '   Lelouch=PM, Lain=RAG/AI systems, Kamina=video, Shikamaru/Erwin=content/marketing,',
    '   Nami/Kaiba/Reigen=finance, Senku=research, Izaya=market intel, Mahoraga=health/audit.',
    '3. Fleet members compound: each reads memory at start and appends learnings at end.',
    '4. High-stakes / irreversible decisions -> convene MAGI council or escalate to YOUR_NAME.',
    '5. Solo execution only for trivial single-step tasks.',
  ].join('\n');
}

// ── Main ───────────────────────────────────────────────────────────────────────

let raw = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { raw += chunk; });

process.stdin.on('end', () => {
  try {
    const nameMap = loadDisplayNames();
    const fleetTable = buildFleetTable(nameMap);

    const response = {
      additionalContext: fleetTable,
    };

    process.stdout.write(JSON.stringify(response));
  } catch (err) {
    process.stderr.write(`[fleet-context-injector] error: ${String(err)}\n`);
    // Emit empty additionalContext so Claude Code doesn't see a parse failure.
    process.stdout.write(JSON.stringify({ additionalContext: '' }));
  }

  process.exit(0);
});
