---
name: debugging-playbook
description: >-
  A systematic method for debugging — finding the root cause of bugs, crashes, failing
  tests, and unexpected behavior. Use this whenever something is broken and you need to
  figure out WHY — error messages, stack traces, crashes, a test that fails, "it works on
  my machine", intermittent/flaky failures, race conditions, performance problems, or "this
  used to work". Strongly prefer this skill any time you're hunting down the cause of a
  defect rather than implementing a known change — including casual phrasing like "why is
  this happening", "this is broken", "it keeps crashing", or "I can't figure out what's
  wrong". It replaces random guess-and-check with reproduce → isolate → root-cause → fix →
  prevent.
---

# Debugging Playbook

Most time lost to bugs is lost to *unsystematic* debugging — changing things at random,
fixing symptoms, or assuming instead of checking. The cure is a disciplined loop. The
mindset: **you are a detective gathering evidence, not a guesser.** Don't change anything
until you understand what's actually happening.

## The loop

### 1. Reproduce it reliably
You can't fix what you can't reproduce. Find the exact, minimal steps/input that trigger
the bug, every time. If it's intermittent, that *is* a clue (see "Heisenbugs" below) — work
to make it deterministic. A reliable repro is also your eventual regression test.

### 2. Read the actual error — carefully
- Read the **whole** error and stack trace, top to bottom. The first line says *what*; the
  trace says *where*. Find the deepest frame in **your** code — that's usually the place to start.
- Take the message literally. "undefined is not a function", "connection refused",
  "null reference" each point somewhere specific. Don't skim past it to a guess.
- Note what changed: a recent commit, a dependency bump, a config/env difference. `git log`
  and `git bisect` find the offending change fast when "it used to work".

### 3. Isolate — narrow the search space
- **Form a hypothesis**, then design the cheapest test that would confirm or *refute* it.
  Try to disprove it, not just confirm it (confirmation bias hides bugs).
- **Binary-search the problem:** does it fail before or after this point? Halve the suspect
  region repeatedly — by adding a log/breakpoint at the midpoint, commenting out half,
  or `git bisect` across commits. This turns a huge search into a few steps.
- **Observe real values**, don't assume them. Print/log/inspect the actual variables, types,
  and control flow at the boundary. The bug is almost always in the gap between what you
  *think* is true and what *is* true. Check your assumptions explicitly.
- **Change one thing at a time** and re-test. Changing several at once means you won't know
  which mattered — and can mask the bug with a second one.

### 4. Find the root cause, not the symptom
Ask "why" until you hit the real cause. A `null` crash is a symptom; *why* was it null —
an unhandled API error? a race? a wrong default? Fixing the symptom (`if (x) …`) often just
moves the bug. The "five whys" habit gets you to the actual defect.

### 5. Fix it — and prove the fix
- Make the **smallest correct change** at the root cause.
- **Write a failing test that reproduces the bug, then make it pass** (regression test) so it
  can't silently return. See testing-rulebook.
- Re-run the original repro and the surrounding tests to confirm — and that you didn't break
  something adjacent.

### 6. Reflect
If it was subtle, note what made it hard to find: a missing log, a confusing API, a fragile
pattern. Often the real fix is improving observability so the next one is obvious in seconds.

## Tools of the trade
- **A debugger / breakpoints** beat scattered prints for stepping through state — but a
  well-placed log is fast and fine. Use what gets you the values quickest.
- **`git bisect`** to pinpoint the commit that introduced a regression.
- **Logging with context** (the request ID, the inputs) so production bugs are diagnosable.
- **A minimal reproduction** stripped of everything irrelevant — often the act of minimizing
  reveals the cause (and it's what you'd share to get help).
- **Rubber-ducking:** explain the code line by line out loud; the wrong assumption usually
  surfaces mid-sentence.

## Special cases
- **Heisenbugs / flaky / race conditions:** nondeterminism points at timing, shared mutable
  state, ordering, uninitialized memory, or reliance on real time/network. Add logging around
  the suspect interleaving; stress/repeat to amplify; look for missing synchronization.
- **"Works on my machine":** the difference is environment — versions, env vars, OS, locale,
  data, clock, network. Diff the two environments explicitly.
- **Performance bugs:** measure before you optimize. Profile to find the real hotspot (it's
  rarely where you'd guess); look for N+1 queries, accidental O(n²), missing indexes, and
  unnecessary work in a loop.

## Anti-patterns
- Guess-and-check edits with no hypothesis. Random changes can hide a bug without fixing it.
- "Fixing" by adding a try/catch or null-check that swallows the symptom and the evidence.
- Assuming instead of verifying — most stuck debugging is a false assumption held too long.
- Declaring it fixed without a regression test or without re-running the original repro.
