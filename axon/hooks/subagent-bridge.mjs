#!/usr/bin/env node
/**
 * Axon subagent-bridge — PreToolUse(Task) + SubagentStop hook.
 *
 * Bridges Claude Code SUBAGENT runs (the fleet working through the Task tool in a terminal
 * session) into the Axon app, so the app's activity feed + per-agent health reflect real
 * fleet work — not just the app's own /api/agents/dispatch path.
 *
 * Two events, one script (dispatched on hook_event_name):
 *
 *   PreToolUse (matcher: Task) — fires when the orchestrator spawns a subagent. tool_input
 *     carries { subagent_type, prompt, description }. We map subagent_type -> app agent id
 *     (reverse of agent-names.json), mint a runId, stash a correlation record, and best-effort
 *     POST /api/agents/<id>/activity/start so the agent shows as "working" LIVE.
 *
 *   SubagentStop (matcher: *) — fires when a subagent finishes. We pop the correlation record
 *     (by session_id [+ agent_type]) to recover the runId, parse the subagent's own transcript
 *     for cost/tokens/model, APPEND the durable cost-ledger row to
 *     agents/<id>/log/runs.jsonl (ALWAYS — survives even if the daemon is down), and best-effort
 *     POST /api/agents/<id>/activity/end so the live feed settles.
 *
 * Only agents present in agent-names.json are recorded; generic subagent types
 * (general-purpose, Explore, Plan, claude, claude-code-guide, statusline-setup, ...) are
 * IGNORED.
 *
 * FAIL-SAFE: never throws in a way that blocks Claude Code. Always exits 0. The disk ledger
 * write is the durable record; the HTTP POSTs are best-effort (short timeout, errors swallowed).
 * Stderr output is prefixed [subagent-bridge].
 *
 * Config (env overrides, for tests + non-default installs):
 *   AXON_REPO_ROOT         -> repo root (default ~/axon)
 *   AXON_AGENTS_DIR        -> agents dir (default <root>/agents)
 *   AXON_AGENT_NAMES_PATH  -> id->Name map (default <root>/agent-names.json)
 *   AXON_BRIDGE_STATE_DIR  -> correlation state dir (default <root>/.bridge)
 *   AXON_SERVICE_URL       -> daemon base URL (default http://127.0.0.1:<AXON_PORT|8787>)
 *   AXON_PORT              -> daemon port (default 8787)
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_STDIN = 256 * 1024; // 256 KiB — hook events are small; cap defensively

// Generic / non-fleet subagent types we must never record (case-insensitive).
const IGNORED_TYPES = new Set([
  "general-purpose",
  "explore",
  "plan",
  "claude",
  "claude-code-guide",
  "statusline-setup",
  "output-style-setup",
]);

// Approximate per-1M-token billing rates (USD) — mirrors hooks/cost-tracker.mjs.
const RATE_TABLE = {
  haiku: { in: 0.8, out: 4.0, cacheWrite: 1.0, cacheRead: 0.08 },
  sonnet: { in: 3.0, out: 15.0, cacheWrite: 3.75, cacheRead: 0.3 },
  opus: { in: 15.0, out: 75.0, cacheWrite: 18.75, cacheRead: 1.5 },
};

// ── Config ──────────────────────────────────────────────────────────────────────

export function resolveConfig(env = process.env) {
  const root = env.AXON_REPO_ROOT || path.join(os.homedir(), "axon");
  const agentsDir = env.AXON_AGENTS_DIR || path.join(root, "agents");
  const namesPath = env.AXON_AGENT_NAMES_PATH || path.join(root, "agent-names.json");
  const bridgeDir = env.AXON_BRIDGE_STATE_DIR || path.join(root, ".bridge");
  const port = env.AXON_PORT || "8787";
  const serviceUrl = (env.AXON_SERVICE_URL || `http://127.0.0.1:${port}`).replace(/\/+$/, "");
  return { root, agentsDir, namesPath, bridgeDir, serviceUrl };
}

// ── Name mapping ──────────────────────────────────────────────────────────────────

/** Load the id->Name map (agent-names.json). Returns {} on any error. */
export function loadNames(namesPath) {
  try {
    const data = JSON.parse(fs.readFileSync(namesPath, "utf8"));
    return data && typeof data === "object" ? data : {};
  } catch {
    return {};
  }
}

/**
 * Map a Claude Code subagent_type / agent_type to an Axon app agent id, or null when it's not
 * one of the known fleet agents. The subagent_type is the .md filename = the lowercased
 * display name (doraemon, edward, shikamaru, ...). We reverse agent-names.json (id->Name) on
 * the lowercased name. We also accept a value that is itself a known app id (defensive).
 */
export function resolveAgentId(type, namesMap) {
  if (!type || typeof type !== "string") return null;
  const key = type.trim().toLowerCase();
  if (!key || IGNORED_TYPES.has(key)) return null;
  // Direct id match (e.g. someone used "dev-automation" as the subagent type).
  for (const id of Object.keys(namesMap)) {
    if (id.toLowerCase() === key) return id;
  }
  // Reverse name match: lowercased display name -> id.
  for (const [id, name] of Object.entries(namesMap)) {
    if (typeof name === "string" && name.trim().toLowerCase() === key) return id;
  }
  return null;
}

// ── Correlation state (pending starts) ──────────────────────────────────────────────

const PENDING_TTL_MS = 6 * 60 * 60 * 1000; // 6h — prune abandoned starts

function pendingFile(bridgeDir) {
  return path.join(bridgeDir, "pending.jsonl");
}

function readPending(bridgeDir) {
  try {
    const txt = fs.readFileSync(pendingFile(bridgeDir), "utf8");
    return txt
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .flatMap((l) => {
        try {
          return [JSON.parse(l)];
        } catch {
          return [];
        }
      });
  } catch {
    return [];
  }
}

function writePending(bridgeDir, rows) {
  try {
    fs.mkdirSync(bridgeDir, { recursive: true });
    fs.writeFileSync(pendingFile(bridgeDir), rows.map((r) => JSON.stringify(r)).join("\n") + (rows.length ? "\n" : ""));
  } catch {
    /* best-effort */
  }
}

/** Append one pending start record. */
export function appendPending(bridgeDir, rec) {
  const now = Date.now();
  const rows = readPending(bridgeDir).filter((r) => now - (r.at ?? 0) < PENDING_TTL_MS);
  rows.push({ ...rec, at: now });
  writePending(bridgeDir, rows);
}

/**
 * Pop the OLDEST pending start matching the session (and type, when known), pruning stale
 * rows. Returns the matched record or null. With same-type parallel subagents this is FIFO
 * (best-effort correlation — the docs expose no shared start/stop id).
 */
export function popPending(bridgeDir, sid, type) {
  const now = Date.now();
  const rows = readPending(bridgeDir).filter((r) => now - (r.at ?? 0) < PENDING_TTL_MS);
  const typeKey = type ? String(type).toLowerCase() : null;
  let idx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (rows[i].sid !== sid) continue;
    if (typeKey && rows[i].type && String(rows[i].type).toLowerCase() !== typeKey) continue;
    idx = i;
    break;
  }
  if (idx === -1) {
    writePending(bridgeDir, rows); // persist the prune
    return null;
  }
  const [hit] = rows.splice(idx, 1);
  writePending(bridgeDir, rows);
  return hit;
}

// ── Transcript cost parsing ──────────────────────────────────────────────────────────

function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function ratesFor(model) {
  const m = String(model ?? "").toLowerCase();
  if (m.includes("haiku")) return RATE_TABLE.haiku;
  if (m.includes("opus")) return RATE_TABLE.opus;
  return RATE_TABLE.sonnet;
}

/**
 * Locate a subagent's OWN transcript. Claude Code stores it at
 * <project>/<sessionId>/subagents/agent-<agentId>.jsonl, while transcript_path for the session
 * is <project>/<sessionId>.jsonl. Prefer the per-subagent file (so cost is THIS run, not the
 * whole session); fall back to transcript_path only if it is itself a sidechain transcript.
 */
export function findSubagentTranscript(transcriptPath, agentId) {
  if (transcriptPath && agentId) {
    const base = transcriptPath.replace(/\.jsonl$/i, "");
    const p = path.join(base, "subagents", `agent-${agentId}.jsonl`);
    if (fs.existsSync(p)) return p;
  }
  // Fallback: transcript_path itself, only if it's a sidechain (subagent) transcript.
  if (transcriptPath && fs.existsSync(transcriptPath)) {
    try {
      const first = fs.readFileSync(transcriptPath, "utf8").split("\n").find((l) => l.trim());
      if (first) {
        const o = JSON.parse(first);
        if (o && (o.isSidechain === true || typeof o.agentId === "string")) return transcriptPath;
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Sum usage across a transcript's assistant turns and price it. Returns
 * { costUsd, model, inputTokens, outputTokens } or null when the file can't be read.
 */
export function parseTranscriptCost(transcriptPath) {
  let content;
  try {
    content = fs.readFileSync(transcriptPath, "utf8");
  } catch {
    return null;
  }
  let input = 0;
  let output = 0;
  let cacheWrite = 0;
  let cacheRead = 0;
  let model = "unknown";
  for (const line of content.split("\n")) {
    if (!line.trim()) continue;
    let e;
    try {
      e = JSON.parse(line);
    } catch {
      continue;
    }
    if (e.type !== "assistant") continue;
    const u = e.message?.usage;
    if (!u) continue;
    input += toNum(u.input_tokens);
    output += toNum(u.output_tokens);
    cacheWrite += toNum(u.cache_creation_input_tokens);
    cacheRead += toNum(u.cache_read_input_tokens);
    if (e.message?.model && e.message.model !== "unknown") model = e.message.model;
  }
  const r = ratesFor(model);
  const costUsd =
    Math.round(
      ((input / 1e6) * r.in +
        (output / 1e6) * r.out +
        (cacheWrite / 1e6) * r.cacheWrite +
        (cacheRead / 1e6) * r.cacheRead) *
        1e6
    ) / 1e6;
  return { costUsd, model, inputTokens: input, outputTokens: output };
}

// ── Ledger append ──────────────────────────────────────────────────────────────────

/**
 * Append one RunLedgerEntry to agents/<appId>/log/runs.jsonl — the SAME ledger the app's
 * dispatch path writes (Agent.recordRun) and the SAME file /api/agents health + /api/ops read.
 * Shape: { ts, model, task, costUsd?, ok }. This is the durable record (works with the daemon
 * down). Returns the entry, or null on a write failure.
 */
export function appendLedger(agentsDir, appId, entry) {
  try {
    const dir = path.join(agentsDir, appId, "log");
    fs.mkdirSync(dir, { recursive: true });
    const row = {
      ts: entry.ts,
      model: entry.model || "claude-code",
      task: entry.task || "(subagent run)",
      ok: entry.ok !== false,
    };
    if (typeof entry.costUsd === "number") row.costUsd = entry.costUsd;
    fs.appendFileSync(path.join(dir, "runs.jsonl"), JSON.stringify(row) + "\n");
    return row;
  } catch {
    return null;
  }
}

// ── Best-effort HTTP ──────────────────────────────────────────────────────────────────

/** POST JSON with a short timeout; never throws. Returns true on a 2xx response. */
export async function postJson(url, body, timeoutMs = 1500) {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
      return res.ok;
    } finally {
      clearTimeout(t);
    }
  } catch {
    return false;
  }
}

function mintRunId() {
  return `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}

function firstLine(s, n = 160) {
  return String(s ?? "")
    .split(/\r?\n/)[0]
    .slice(0, n);
}

// ── Event handlers ──────────────────────────────────────────────────────────────────

/**
 * PreToolUse(Task): record a run-start for a fleet subagent. Returns the correlation record
 * (or null when the type isn't a known fleet agent). POSTs run-start best-effort.
 */
export async function handlePreToolUse(payload, cfg) {
  if (payload?.tool_name !== "Task") return null;
  const input = payload.tool_input ?? {};
  const namesMap = loadNames(cfg.namesPath);
  const appId = resolveAgentId(input.subagent_type, namesMap);
  if (!appId) return null;

  const sid = String(payload.session_id ?? "");
  const task = firstLine(input.description || input.prompt || input.subagent_type, 200);
  const runId = mintRunId();
  const rec = { sid, type: String(input.subagent_type), appId, runId, task };
  appendPending(cfg.bridgeDir, rec);

  await postJson(`${cfg.serviceUrl}/api/agents/${appId}/activity/start`, { runId, task });
  return rec;
}

/**
 * SubagentStop: settle the run + write the durable ledger row. Returns the ledger entry it
 * wrote (or null when the type isn't a known fleet agent / nothing could be recorded).
 */
export async function handleSubagentStop(payload, cfg) {
  const sid = String(payload.session_id ?? "");
  // Modern CC carries agent_type/agent_id on SubagentStop; older builds may not. We correlate
  // by session (+ type when present) to the PreToolUse start, which is the authoritative source
  // of the app id (its tool_input.subagent_type mapped cleanly).
  const agentType = payload.agent_type ?? payload.agentType ?? null;
  const agentId = payload.agent_id ?? payload.agentId ?? null;

  const pending = popPending(cfg.bridgeDir, sid, agentType);
  const namesMap = loadNames(cfg.namesPath);
  const appId = pending?.appId ?? resolveAgentId(agentType, namesMap);
  if (!appId) return null; // not a fleet subagent → ignore

  const runId = pending?.runId ?? mintRunId();
  const ts = new Date().toISOString();

  // Cost from the subagent's OWN transcript (per-run, not whole session).
  const subTranscript = findSubagentTranscript(payload.transcript_path, agentId);
  const parsed = subTranscript ? parseTranscriptCost(subTranscript) : null;
  const model = parsed?.model && parsed.model !== "unknown" ? parsed.model : "claude-code";
  const costUsd = parsed ? parsed.costUsd : undefined;
  const task = pending?.task || firstLine(agentType || "subagent run", 160);

  // 1) Durable ledger row (ALWAYS — works with the daemon down). Drives /api/agents health.
  const entry = appendLedger(cfg.agentsDir, appId, { ts, model, task, costUsd, ok: true });

  // 2) Best-effort: settle the live run on the feed.
  await postJson(`${cfg.serviceUrl}/api/agents/${appId}/activity/end`, {
    runId,
    ok: true,
    costUsd,
    summary: task,
    task,
    model,
  });

  return entry;
}

// ── Main ──────────────────────────────────────────────────────────────────────────────

export async function main() {
  let raw = "";
  await new Promise((resolve) => {
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => {
      if (raw.length < MAX_STDIN) raw += c.substring(0, MAX_STDIN - raw.length);
    });
    process.stdin.on("end", resolve);
    process.stdin.on("error", resolve);
  });

  try {
    const payload = raw.trim() ? JSON.parse(raw) : {};
    const cfg = resolveConfig();
    const event = payload.hook_event_name;
    if (event === "PreToolUse") {
      await handlePreToolUse(payload, cfg);
    } else if (event === "SubagentStop") {
      await handleSubagentStop(payload, cfg);
    }
  } catch (err) {
    process.stderr.write(`[subagent-bridge] error: ${String(err)}\n`);
  }

  // PreToolUse passes through stdin unchanged so it never alters tool behavior.
  process.stdout.write(raw);
  process.exit(0);
}

// Only run main() when invoked as a script (not when imported by tests).
const invokedDirectly =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  void main();
}
