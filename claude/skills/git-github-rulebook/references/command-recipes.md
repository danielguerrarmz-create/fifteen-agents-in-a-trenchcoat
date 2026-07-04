# Git command recipes

Copy-pasteable sequences for the common tricky situations. Pick based on whether the
commits have been **pushed/shared** — if they have, prefer the non-history-rewriting
option (`revert`) and never force-push a shared branch.

## Undo the last commit
- **Keep the changes staged** (just un-commit): `git reset --soft HEAD~1`
- **Keep changes, unstage them:** `git reset --mixed HEAD~1` (default)
- **Discard the commit AND its changes** (destructive — confirm first):
  `git reset --hard HEAD~1`
- **Already pushed & shared?** Don't reset — make a new inverse commit:
  `git revert HEAD`

## Fix the most recent commit
- **Change the message:** `git commit --amend`
- **Add a forgotten file:** `git add path && git commit --amend --no-edit`
- **Fix the author:** `git commit --amend --author="Name <email>" --no-edit`
- Amend only if it hasn't been pushed (or it's a personal branch you'll
  `--force-with-lease`).

## Reword / squash / split earlier commits (personal branch only)
- Interactive rebase over the last N commits: `git rebase -i HEAD~N`
  - `reword` to edit a message, `squash`/`fixup` to combine, `edit` to stop and amend,
    `drop` to remove, reorder lines to reorder commits.
- **Split one commit:** mark it `edit`, then at the stop:
  `git reset HEAD~1` → stage pieces selectively (`git add -p`) → commit in parts →
  `git rebase --continue`.
- Note: interactive rebase is unavailable in non-interactive/automated shells.

## Resolve a merge conflict
1. `git status` shows conflicted files.
2. Open each, resolve the `<<<<<<< ======= >>>>>>>` markers, keep the intended result.
3. `git add <resolved-files>`
4. Finish: `git commit` (for merge) or `git rebase --continue` (for rebase).
- **Bail out:** `git merge --abort` or `git rebase --abort` returns to the pre-attempt state.
- Tools: `git mergetool`; for "take theirs/ours" on a file: `git checkout --theirs|--ours <file>` then `git add`.

## Recover "lost" work (the safety net)
- `git reflog` lists where HEAD has been, including after a bad reset/rebase.
- Restore to a known-good point: `git reset --hard <reflog-sha>` (or
  `git checkout -b recover <reflog-sha>` to be safe). Most "I deleted my commits" panics
  are solved here — commits linger in reflog for ~90 days before garbage collection.

## revert vs reset (know the difference)
- **`revert`** creates a NEW commit undoing a previous one. History-preserving, safe on
  shared branches. Use on `main`/anything pushed.
- **`reset`** moves the branch pointer (and optionally the working tree) backward.
  Rewrites history. Personal/un-pushed branches only.

## Update a feature branch with latest main
- Linear (personal branch): `git fetch origin && git rebase origin/main`
- Preserve merge (shared branch): `git fetch origin && git merge origin/main`

## Unstage / discard local changes
- Unstage a file (keep edits): `git restore --staged <file>`
- Discard working-tree edits (destructive): `git restore <file>`
- Nuke all untracked files/dirs (destructive — confirm): `git clean -fd`

## Stash work in progress
- `git stash push -m "wip: <note>"` → later `git stash pop` (apply+drop) or
  `git stash apply` (keep in stash). List with `git stash list`.

## Remove a committed secret (also ROTATE the secret first)
1. **Rotate/revoke the leaked credential immediately** — assume it's compromised.
2. Remove from history with `git filter-repo --invert-paths --path <file>` (preferred)
   or the BFG Repo-Cleaner. Plain `git rm` only removes it going forward, not from history.
3. Force-push the rewritten history (coordinate with the team — this rewrites shared
   history) and have everyone re-clone or reset.
4. Add the path to `.gitignore` so it can't recur; verify with `gitleaks detect`.

## Tag a release
- Annotated, semver tag: `git tag -a v1.4.0 -m "Release 1.4.0"` then `git push origin v1.4.0`
- Delete a bad tag: `git tag -d v1.4.0 && git push origin :refs/tags/v1.4.0`

## Inspect before acting
- What will I push? `git log @{u}..` and `git diff @{u}..`
- Who changed this line and why? `git blame <file>` then `git show <sha>`
- What did a command do? `git reflog` — your audit trail.
