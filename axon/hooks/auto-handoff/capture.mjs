#!/usr/bin/env node
/**
 * Axon auto-handoff — SessionEnd hook.
 *
 * Project Pulse (a cross-project progress view; see integrations/repo-status.ts in the Axon
 * app) reads each tracked repo's LATEST docs/handoffs/ (or root handoffs/) doc and parses
 * `## What` + `## Left` into the cockpit. That only happens when you remember to run
 * /session-handoff, so Pulse goes stale between sessions. This hook writes a
 * Pulse-parseable handoff straight from git state whenever a Claude Code session ends in a
 * tracked repo — no LLM call, deterministic only.
 *
 * Resolution: walk up from the hook's `cwd` to the nearest `.git`, require that repo to be a
 * DIRECT CHILD of AXON_REPOS_ROOT (env, falls back to the home dir), optionally excluding
 * any repo names listed in AXON_EXCLUDED_REPOS (comma-separated, case-insensitive; empty by
 * default). Anything else → silent no-op.
 *
 * Session delta: session start = the first `timestamp` found in the transcript JSONL (falls back
 * to "6 hours ago" when the transcript is missing/unreadable), then `git log --since=<start>` on
 * HEAD for commits + changed files, plus the current `git status --porcelain` dirty count. Zero
 * commits AND a clean tree → nothing worth documenting, silent no-op.
 *
 * Output shape MUST parse through repo-status.ts's parseHandoffPulse(): an `## What` heading
 * followed immediately by a single paragraph (Pulse takes the first paragraph, capped ~220
 * chars), and a `## Left` heading with top-level `- ` bullets. Filename
 * `<repo-handoffs>/YYYY-MM-DD-auto.md` — distinct from a curated `/session-handoff` doc so you
 * can tell at a glance which one ran. Re-running the hook on the same day APPENDS a dated
 * session block under "### Sessions today" rather than clobbering, while the top
 * `## What`/`## Left` are regenerated from the MOST RECENT session so Pulse's single-shot read
 * always reflects "now".
 *
 * FAIL-SAFE: never blocks session exit. Everything is wrapped in try/catch; always exit 0; no
 * network calls; runtime is a handful of fast `git` shells, well under a second.
 *
 * Config (env overrides, for tests + non-default installs):
 *   AXON_REPOS_ROOT     -> the repos root (default: home dir, mirrors integrations/repo-status.ts)
 *   AXON_EXCLUDED_REPOS -> comma-separated repo names to never treat as tracked (default: none)
 */

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

const MAX_STDIN = 256 * 1024; // 256 KiB — hook events are small; cap defensively
const SESSION_START_FALLBACK_MS = 6 * 60 * 60 * 1000; // 6h, when the transcript timestamp is unavailable
const MAX_FILES_LISTED = 20;
const MAX_PROGRESS_ITEMS = 5;

// ── git ──────────────────────────────────────────────────────────────────────────────

function git(cwd, args) {
  try {
    return execFileSync("git", args, { cwd, encoding: "utf8" }).trim();
  } catch {
    return "";
  }
}

/** Walk up from `startDir` to the nearest directory holding a `.git` entry, or null. */
function findGitRoot(startDir) {
  let dir = path.resolve(startDir);
  while (true) {
    if (fs.existsSync(path.join(dir, ".git"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

/**
 * Resolve a hook `cwd` to a tracked repo dir, or null when it isn't one. "Tracked" mirrors
 * repo-status.ts's trackedRepos(): a direct child of AXON_REPOS_ROOT with a `.git`, excluding
 * anything named in AXON_EXCLUDED_REPOS.
 */
export function resolveTrackedRepo(cwd, env = process.env) {
  if (!cwd) return null;
  const repoDir = findGitRoot(cwd);
  if (!repoDir) return null;
  const root = path.resolve(env.AXON_REPOS_ROOT || os.homedir());
  const parent = path.resolve(path.dirname(repoDir));
  if (parent.toLowerCase() !== root.toLowerCase()) return null; // not a direct child of root
  const name = path.basename(repoDir);
  const excluded = String(env.AXON_EXCLUDED_REPOS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (excluded.includes(name.toLowerCase())) return null;
  return { dir: repoDir, name };
}

// ── session start time ──────────────────────────────────────────────────────────────────

/** First `timestamp` found in the first ~50 lines of a transcript JSONL, or null. */
export function sessionStartFromTranscript(transcriptPath) {
  if (!transcriptPath) return null;
  let content;
  try {
    content = fs.readFileSync(transcriptPath, "utf8");
  } catch {
    return null;
  }
  const lines = content.split("\n");
  for (let i = 0; i < Math.min(lines.length, 50); i++) {
    const line = lines[i].trim();
    if (!line) continue;
    let o;
    try {
      o = JSON.parse(line);
    } catch {
      continue;
    }
    if (o && typeof o.timestamp === "string" && !Number.isNaN(Date.parse(o.timestamp))) {
      return o.timestamp;
    }
  }
  return null;
}

// ── session git delta ──────────────────────────────────────────────────────────────────

/** Commits (newest first) + changed files since `sinceIso`, plus the current dirty count. */
export function sessionDelta(repoDir, sinceIso) {
  const logOut = git(repoDir, ["log", `--since=${sinceIso}`, "--pretty=%H%x1f%s", "HEAD"]);
  const commits = logOut
    ? logOut.split("\n").filter(Boolean).map((l) => {
        const [hash, subject] = l.split("\x1f");
        return { hash: hash ?? "", subject: subject ?? "" };
      })
    : [];

  const filesOut = git(repoDir, ["log", `--since=${sinceIso}`, "--name-only", "--pretty=format:", "HEAD"]);
  const changedFiles = filesOut
    ? [...new Set(filesOut.split("\n").map((l) => l.trim()).filter(Boolean))]
    : [];

  const statusOut = git(repoDir, ["status", "--porcelain"]);
  const dirtyFiles = statusOut ? statusOut.split("\n").filter(Boolean) : [];

  return { commits, changedFiles, dirtyCount: dirtyFiles.length };
}

// ── PROGRESS.md carry-over ──────────────────────────────────────────────────────────────

const OPEN_ITEM_RE = /^\s*[-*+]\s*☐\s*(.+)$/;

/** Top-level (- ☐ ...) open items from a repo's PROGRESS.md, capped. Mirrors repo-status.ts's reader. */
export function progressOpenItems(repoDir, max = MAX_PROGRESS_ITEMS) {
  const p = path.join(repoDir, "PROGRESS.md");
  let txt;
  try {
    txt = fs.readFileSync(p, "utf8");
  } catch {
    return [];
  }
  const out = [];
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(OPEN_ITEM_RE);
    if (m) {
      const text = m[1].replace(/☐/g, "").trim();
      if (text) out.push(text);
      if (out.length >= max) break;
    }
  }
  return out;
}

// ── handoff dir resolution ──────────────────────────────────────────────────────────────

/** docs/handoffs/ if it exists, else root handoffs/ if THAT exists, else create docs/handoffs/.
 * Mirrors latestHandoff()'s fallback order in repo-status.ts. */
export function handoffDir(repoDir) {
  const docsH = path.join(repoDir, "docs", "handoffs");
  const rootH = path.join(repoDir, "handoffs");
  if (fs.existsSync(docsH)) return docsH;
  if (fs.existsSync(rootH)) return rootH;
  fs.mkdirSync(docsH, { recursive: true });
  return docsH;
}

// ── content composition ──────────────────────────────────────────────────────────────────

function localDateStr(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function localTimeStr(d = new Date()) {
  const h = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${min}`;
}

/** The single-paragraph `## What` body — kept tight; Pulse caps it at 220 chars anyway. */
function whatParagraph(delta) {
  const { commits, dirtyCount } = delta;
  if (commits.length === 0) {
    return `No commits this session. ${dirtyCount} file${dirtyCount === 1 ? "" : "s"} uncommitted (working tree dirty, nothing committed).`;
  }
  const headline = commits.slice(0, 3).map((c) => c.subject).join("; ");
  const more = commits.length > 3 ? ` (+${commits.length - 3} more)` : "";
  let text = `${commits.length} commit${commits.length === 1 ? "" : "s"} this session: ${headline}${more}. ${dirtyCount} file${dirtyCount === 1 ? "" : "s"} uncommitted.`;
  if (text.length > 200) text = text.slice(0, 197).trimEnd() + "…";
  return text;
}

/** The `## Files` body — commit range + changed-file list, capped. */
function filesBlock(delta) {
  const { commits, changedFiles } = delta;
  const range =
    commits.length === 0
      ? "(no commits this session)"
      : commits.length === 1
        ? commits[0].hash.slice(0, 7)
        : `${commits[commits.length - 1].hash.slice(0, 7)}..${commits[0].hash.slice(0, 7)}`;
  const lines = [`Commit range: \`${range}\``, ""];
  if (changedFiles.length === 0) {
    lines.push("(no files changed this session)");
  } else {
    lines.push(`Changed files (${changedFiles.length}):`);
    for (const f of changedFiles.slice(0, MAX_FILES_LISTED)) lines.push(`- ${f}`);
    if (changedFiles.length > MAX_FILES_LISTED) {
      lines.push(`- (+${changedFiles.length - MAX_FILES_LISTED} more)`);
    }
  }
  return lines.join("\n");
}

/** `## Left` bullets — carried-over PROGRESS.md items + a standing review nudge. */
function leftBullets(repoDir) {
  const items = progressOpenItems(repoDir).map((t) => `- ${t}`);
  items.push("- [ ] Review & curate this auto-handoff (or run /session-handoff)");
  return items.join("\n");
}

const SESSIONS_MARKER = "\n### Sessions today\n";

/** Existing today's-sessions history block (the raw text after the marker), or "" if none. */
function existingHistory(filePath) {
  let raw;
  try {
    raw = fs.readFileSync(filePath, "utf8");
  } catch {
    return "";
  }
  const idx = raw.indexOf(SESSIONS_MARKER);
  if (idx === -1) return "";
  return raw.slice(idx + SESSIONS_MARKER.length).trim();
}

/**
 * Compose the full handoff file. Top `## What`/`## Files`/`## Left` always reflect THIS run (the
 * most recent session), so Pulse's single-paragraph read stays current; a "Sessions today" log at
 * the bottom keeps earlier same-day runs instead of clobbering them.
 */
export function composeHandoff(opts) {
  const { repoName, dateStr, timeStr, sessionShort, delta, repoDir, priorHistory } = opts;
  const what = whatParagraph(delta);
  const files = filesBlock(delta);
  const left = leftBullets(repoDir);

  const thisSession = `#### ${timeStr} (${sessionShort})\n\n${what}\n\n${files}`;
  const history = priorHistory ? `${priorHistory}\n\n${thisSession}` : thisSession;

  return `# Auto-handoff — ${repoName} — ${dateStr}

> _auto-generated by the SessionEnd hook; run /session-handoff for a curated version._

## What

${what}

## Files

${files}

## Left

${left}

---
### Sessions today

${history}
`;
}

// ── main ──────────────────────────────────────────────────────────────────────────────

function readStdin() {
  return new Promise((resolve) => {
    let raw = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => {
      if (raw.length < MAX_STDIN) raw += c.substring(0, MAX_STDIN - raw.length);
    });
    process.stdin.on("end", () => resolve(raw));
    process.stdin.on("error", () => resolve(raw));
  });
}

export async function main() {
  try {
    const raw = await readStdin();
    const payload = raw.trim() ? JSON.parse(raw) : {};

    const repo = resolveTrackedRepo(payload.cwd);
    if (!repo) return; // not a tracked repo — silent no-op

    const sessionStart =
      sessionStartFromTranscript(payload.transcript_path) ||
      new Date(Date.now() - SESSION_START_FALLBACK_MS).toISOString();

    const delta = sessionDelta(repo.dir, sessionStart);
    if (delta.commits.length === 0 && delta.dirtyCount === 0) return; // nothing to document

    const now = new Date();
    const dateStr = localDateStr(now);
    const hdir = handoffDir(repo.dir);
    const filePath = path.join(hdir, `${dateStr}-auto.md`);

    const content = composeHandoff({
      repoName: repo.name,
      dateStr,
      timeStr: localTimeStr(now),
      sessionShort: String(payload.session_id ?? "unknown").slice(0, 8),
      delta,
      repoDir: repo.dir,
      priorHistory: existingHistory(filePath),
    });

    fs.writeFileSync(filePath, content, "utf8");
  } catch (err) {
    try {
      process.stderr.write(`[auto-handoff] error: ${String(err)}\n`);
    } catch {
      /* ignore */
    }
  } finally {
    process.exit(0);
  }
}

// Only run main() when invoked as a script (not when imported by tests).
const invokedDirectly = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (invokedDirectly) {
  void main();
}
