---
name: git-github-rulebook
description: >-
  Rules and best practices for using Git and GitHub correctly and safely. Use this
  whenever the work involves git or GitHub mechanics — committing, writing commit
  messages, branching, pull requests, code review, merging/rebasing, resolving merge
  conflicts, tagging/releases, branch protection, CODEOWNERS, .gitignore, undoing
  mistakes, or recovering lost work. Strongly prefer this skill any time you are about
  to run git commands or shape a GitHub workflow, even if the user just says things
  like "commit this", "open a PR", "I messed up my branch", "squash these", or "how
  should we structure branches" — it encodes the conventions and the safety rules that
  prevent destructive mistakes (force-pushing shared branches, committing secrets,
  rewriting public history).
---

# Git & GitHub Rulebook

Git is powerful and unforgiving — the same command can save the day or destroy a
colleague's work. This rulebook encodes conventions that keep history clean and a set
of **safety rules** that prevent the irreversible mistakes. When in doubt, prefer the
reversible operation and explain the tradeoff. Concrete command recipes for common
situations live in `references/command-recipes.md` — read it when you need the exact
steps for a scenario (undo a commit, fix a conflict, split a commit, recover lost work).

## Safety rules (the non-negotiables)

These exist because the alternative is data loss or leaked secrets. Hold them even
under time pressure.

1. **Never force-push a shared/protected branch** (`main`, `develop`, release branches,
   or anything others build on). If you must rewrite a *personal* feature branch, use
   `git push --force-with-lease` (not `--force`) so you don't clobber someone else's push.
2. **Never commit secrets.** No API keys, tokens, passwords, `.env`, or private keys.
   Scan before pushing (`gitleaks detect`). If a secret was committed, treat it as
   compromised — **rotate it**, then scrub history (`git filter-repo` / BFG). Removing
   it in a new commit is not enough; it's still in history.
3. **Don't rewrite public history.** Rebasing/amending is fine on un-pushed or personal
   branches; once others have pulled it, rewriting forces painful resets on them.
4. **Don't commit large binaries or generated artifacts.** Use Git LFS for genuinely
   large assets; everything build-generated belongs in `.gitignore`.
5. **Confirm before destructive commands.** `git reset --hard`, `git clean -fd`, branch
   deletion, and history rewrites can't be casually undone — state what will be lost first.
   `git reflog` is the safety net for most "I lost a commit" situations (see recipes).

## Commits

- **Atomic & focused:** one logical change per commit. It should build/test on its own
  and be revertable without dragging unrelated changes along.
- **Conventional Commits** message format (widely adopted, machine-parseable, drives
  semver and changelogs):
  ```
  <type>(<optional scope>): <imperative summary, ≤ ~72 chars>

  <optional body: what & why, not how — wrap ~72 cols>

  <optional footer: BREAKING CHANGE: …, Refs #123, Co-authored-by: …>
  ```
  Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`,
  `chore`, `revert`. A `feat` → minor bump, `fix` → patch, `BREAKING CHANGE` → major.
- **Imperative mood**: "add cache layer", not "added"/"adds". Reads like a command the
  commit applies.
- **Explain the why** in the body for anything non-obvious — the diff already shows the
  how. Link the issue/ticket.
- Commit early and often locally; tidy up with rebase before sharing if needed.

## Branching

- **Default to trunk-based development:** short-lived branches off `main`, merged within
  a day or two, behind feature flags if incomplete. Long-lived branches cause merge pain.
- **Branch naming:** `<type>/<short-desc>` or `<type>/<issue>-<desc>`, e.g.
  `feat/oauth-login`, `fix/1234-null-cart`. Be consistent.
- **Keep branches current:** regularly bring in `main` (`git pull --rebase origin main`
  on a personal branch, or merge if it's shared) to shrink the final integration diff.
- Heavier flows (git-flow with `develop`/`release`/`hotfix`) suit scheduled-release or
  versioned products — use only if the team already does; trunk-based is the simpler default.

## Pull requests

- **Small and reviewable.** A PR under ~400 lines gets a real review; a 2,000-line PR gets
  rubber-stamped. Split big work into stacked/sequential PRs.
- **Describe intent:** what changed, why, how to test, screenshots for UI, and `Closes #NN`
  to auto-close the issue. Use a PR template if the repo has one.
- **Open as draft** while in progress; mark ready when it's genuinely reviewable and CI is green.
- **Don't merge red.** CI (build, tests, lint, security scan) must pass; required reviews
  approved; conversations resolved.

## Code review etiquette

- Review promptly and in good faith; review the change, not the person.
- Distinguish blocking issues from nits (prefix nits as `nit:`). Explain *why*, suggest
  the fix, link references. Approve when good enough — don't gatekeep on taste.
- As author: respond to every comment, push fixups, re-request review; don't force-push
  over a branch mid-review without a heads-up (it scrambles reviewers' diffs).

## Merging into the main branch

Pick a strategy and apply it consistently:
- **Squash and merge** *(common default)*: collapses a messy PR into one clean commit on
  `main`. Best when intermediate commits are noise.
- **Rebase and merge**: linear history, preserves individual commits — use when each commit
  is meaningful and well-formed.
- **Merge commit**: preserves full branch context and the merge point — use for long-lived
  or release branches where the topology matters.
Match the repo's convention; don't mix arbitrarily.

## GitHub guardrails to set up

- **Branch protection** on `main`: require PR + passing status checks + ≥1 review, block
  force-push and deletion, optionally require linear history and signed commits.
- **CODEOWNERS** to auto-request the right reviewers for touched paths.
- **PR & issue templates** to standardize context.
- **Status-check gates** wire CI/security into the merge button (see the `github-actions-docs`
  skill for the workflow YAML itself).
- **Releases & tags:** annotated, semver tags (`vMAJOR.MINOR.PATCH`); generate release notes
  from Conventional Commits.

## Repo hygiene

- A real `.gitignore` from day one (language/framework-appropriate): deps, build output,
  env files, editor cruft, OS files.
- Protect the default branch; delete merged branches to reduce clutter.
- Keep `main` always-releasable.

## When unsure
Read `references/command-recipes.md` for exact, copy-pasteable sequences for the common
tricky situations: undoing the last commit (kept vs discarded), amending, splitting a
commit, resolving conflicts, recovering "lost" commits via reflog, `revert` vs `reset`,
and safely removing a committed secret.
