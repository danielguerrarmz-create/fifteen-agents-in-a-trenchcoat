#!/usr/bin/env node
/**
 * Axon cost-tracker hook (Stop / PostToolUse)
 *
 * Reads the hook event JSON from stdin, derives cumulative session token usage
 * by scanning the transcript file Claude Code provides, then appends one row to
 * ~/.claude-cost-tracker/usage.db using Node's built-in node:sqlite.
 *
 * DB path: ~/.claude-cost-tracker/usage.db
 * Schema:  timestamp TEXT, project TEXT, tool_name TEXT, input_tokens INTEGER,
 *          output_tokens INTEGER, cost_usd REAL, session_id TEXT, model TEXT
 *
 * Safe: the entire script is wrapped so it never throws in a way that blocks
 * Claude Code. Always exits 0. Stderr output is prefixed [cost-tracker].
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

// ── Constants ─────────────────────────────────────────────────────────────────

const DB_DIR  = path.join(os.homedir(), '.claude-cost-tracker');
const DB_PATH = path.join(DB_DIR, 'usage.db');
const MAX_STDIN = 64 * 1024; // 64 KiB — enough for any hook event JSON

// Approximate per-1M-token billing rates (USD). Cache write = 1.25x input.
// Cache read = 0.1x input. These are estimates; actual billing may differ.
const RATE_TABLE = {
  haiku:  { in: 0.80,  out: 4.0,  cacheWrite: 1.00,  cacheRead: 0.08 },
  sonnet: { in: 3.00,  out: 15.0, cacheWrite: 3.75,  cacheRead: 0.30 },
  opus:   { in: 15.00, out: 75.0, cacheWrite: 18.75, cacheRead: 1.50 },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function getRates(model) {
  const m = String(model ?? '').toLowerCase();
  if (m.includes('haiku')) return RATE_TABLE.haiku;
  if (m.includes('opus'))  return RATE_TABLE.opus;
  return RATE_TABLE.sonnet;
}

function toNumber(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/**
 * Scan a JSONL transcript and sum token usage across all assistant turns.
 * Returns { inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, model }
 * or null if the file cannot be read.
 */
function sumUsageFromTranscript(transcriptPath) {
  let content;
  try {
    content = fs.readFileSync(transcriptPath, 'utf8');
  } catch {
    return null;
  }

  let inputTokens      = 0;
  let outputTokens     = 0;
  let cacheWriteTokens = 0;
  let cacheReadTokens  = 0;
  let model            = 'unknown';

  for (const line of content.split('\n')) {
    if (!line.trim()) continue;
    let entry;
    try { entry = JSON.parse(line); } catch { continue; }

    if (entry.type !== 'assistant') continue;
    const msg = entry.message;
    if (!msg?.usage) continue;

    const u = msg.usage;
    inputTokens      += toNumber(u.input_tokens);
    outputTokens     += toNumber(u.output_tokens);
    cacheWriteTokens += toNumber(u.cache_creation_input_tokens);
    cacheReadTokens  += toNumber(u.cache_read_input_tokens);

    if (msg.model && msg.model !== 'unknown') model = msg.model;
  }

  return { inputTokens, outputTokens, cacheWriteTokens, cacheReadTokens, model };
}

/** Ensure DB directory and table exist; return an open DatabaseSync instance. */
function openDb() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec(`
    CREATE TABLE IF NOT EXISTS usage (
      timestamp    TEXT,
      project      TEXT,
      tool_name    TEXT,
      input_tokens  INTEGER,
      output_tokens INTEGER,
      cost_usd     REAL,
      session_id   TEXT,
      model        TEXT
    )
  `);
  return db;
}

// ── Main ──────────────────────────────────────────────────────────────────────

let raw = '';

process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  if (raw.length < MAX_STDIN) raw += chunk.substring(0, MAX_STDIN - raw.length);
});

process.stdin.on('end', () => {
  try {
    const input = raw.trim() ? JSON.parse(raw) : {};

    // Claude Code Stop hook provides transcript_path.
    const transcriptPath = (typeof input.transcript_path === 'string' && input.transcript_path)
      ? input.transcript_path
      : (process.env.CLAUDE_TRANSCRIPT_PATH ?? null);

    const sessionId = String(input.session_id ?? process.env.CLAUDE_SESSION_ID ?? 'default')
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 64);

    const project  = String(input.cwd ?? process.cwd() ?? '');
    const toolName = String(input.tool_name ?? input.hook_event_name ?? 'Stop');

    let usageTotals = null;
    if (transcriptPath && fs.existsSync(transcriptPath)) {
      usageTotals = sumUsageFromTranscript(transcriptPath);
    }

    const {
      inputTokens      = 0,
      outputTokens     = 0,
      cacheWriteTokens = 0,
      cacheReadTokens  = 0,
      model            = 'unknown',
    } = usageTotals ?? {};

    const rates     = getRates(model);
    const costUsd   = Math.round((
      (inputTokens      / 1e6) * rates.in +
      (outputTokens     / 1e6) * rates.out +
      (cacheWriteTokens / 1e6) * rates.cacheWrite +
      (cacheReadTokens  / 1e6) * rates.cacheRead
    ) * 1e6) / 1e6;

    const db = openDb();
    try {
      db.prepare(`
        INSERT INTO usage (timestamp, project, tool_name, input_tokens, output_tokens, cost_usd, session_id, model)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        new Date().toISOString(),
        project,
        toolName,
        inputTokens,
        outputTokens,
        costUsd,
        sessionId,
        model,
      );
    } finally {
      db.close();
    }
  } catch (err) {
    // Never block Claude Code — log to stderr and exit 0.
    process.stderr.write(`[cost-tracker] error: ${String(err)}\n`);
  }

  // Pass stdin through (Claude Code hook convention — required for Stop hooks).
  process.stdout.write(raw);
  process.exit(0);
});
