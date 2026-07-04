---
name: testing-rulebook
description: >-
  Rules and best practices for testing software effectively. Use this whenever the work
  involves writing, structuring, reviewing, or improving tests — unit tests, integration
  tests, end-to-end tests, test strategy, what to mock, test-driven development, fixtures,
  coverage, flaky tests, or regression tests for a bug. Strongly prefer this skill any
  time you're about to write a test, are asked "how should I test this", set up a test
  suite, or are fixing a bug (a fix isn't done without a regression test). It backs the
  qa role in team-orchestration and keeps tests fast, reliable, and meaningful rather than
  brittle and slow.
---

# Testing Rulebook

Tests exist to let you change code with confidence. A good suite catches real regressions,
runs fast, and rarely cries wolf. A bad suite is slow, flaky, and so coupled to
implementation that every refactor breaks it — so people stop trusting it. These rules
keep you on the good side.

## The test pyramid (and why)
Favor many small **unit** tests, fewer **integration** tests, and a thin layer of **E2E**
tests. Unit tests are fast and pinpoint failures; E2E tests are slow, flaky, and vague
about *what* broke — valuable but expensive, so reserve them for critical user journeys.
An inverted pyramid (mostly E2E) is slow and frustrating to maintain.

```
        /\      E2E         few — critical happy paths end-to-end
       /  \     Integration some — modules + real DB/HTTP boundaries
      /____\    Unit        many — fast, isolated logic
```

## What to test
- **Test behavior, not implementation.** Assert on observable outputs and effects, not
  private internals. Then refactors that preserve behavior keep tests green — which is the
  whole point.
- **Cover the contract and the edges:** happy path, boundaries (empty, one, many, max),
  invalid input, error paths, and known past bugs.
- **Don't test the framework or the language.** Test *your* logic.
- Coverage is a **signal, not a target.** 100% coverage of trivial getters proves nothing;
  thoughtful coverage of branching logic is what matters. Chasing a number invites useless tests.

## Qualities of a good test (FIRST)
- **Fast** — milliseconds for unit tests, so the suite runs constantly.
- **Isolated** — no dependence on other tests or on run order; no shared mutable state.
- **Repeatable** — deterministic. No reliance on real time, randomness, network, or
  timezone. Inject the clock; seed the RNG.
- **Self-validating** — asserts a clear pass/fail, no manual log-reading.
- **Timely** — written with the code (ideally just before).

Structure each test **Arrange → Act → Assert**, with a name that states the scenario and
expected outcome (`returns_409_when_email_already_exists`). One logical reason to fail per
test.

## Mocking — at the boundaries, sparingly
- **Mock what you don't own or can't control:** network calls, third-party APIs, the clock,
  randomness, the filesystem when incidental.
- **Don't mock what you're testing**, and avoid mocking your own internals — over-mocking
  produces tests that pass while the real thing is broken (they test the mocks, not the code).
- Prefer real objects and in-memory/ephemeral databases for integration tests; they catch
  wiring bugs mocks hide.
- Know your doubles: a **stub** returns canned data; a **mock** also asserts it was called a
  certain way; a **fake** is a working lightweight implementation (e.g. in-memory repo).

## Integration & E2E
- **Integration:** exercise real seams — your code against a real (test) database, a real
  HTTP route, a real queue. This is where most "but each unit passed!" bugs surface.
- **E2E:** a handful of critical journeys through the running system. Keep them stable:
  wait on conditions, not sleeps; use stable selectors; isolate test data.

## Flaky tests are a bug, not a nuisance
A test that passes sometimes erodes trust in the whole suite. Don't `retry` it into
submission — **find the nondeterminism** (timing/sleep, shared state, ordering, real
network, unseeded randomness, timezone) and remove it. Quarantine only as a temporary,
tracked measure.

## Fixing a bug? Write the regression test first
Reproduce the bug as a **failing** test, then fix until it's green. This proves you fixed
the real thing and locks the door so it can't silently return. A bug fix without a
regression test is half a fix.

## In CI
Run the suite on every change; a red suite blocks merge. Keep it fast enough that people
actually run it locally — parallelize, and split slow E2E into a separate stage if needed.
