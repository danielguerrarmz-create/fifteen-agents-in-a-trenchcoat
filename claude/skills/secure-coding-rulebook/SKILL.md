---
name: secure-coding-rulebook
description: >-
  Rules and best practices for writing secure application code and thinking about threats.
  Use this whenever the work touches security-sensitive code — authentication, authorization,
  sessions/tokens, handling user input, SQL/queries, file paths or uploads, outbound requests
  (SSRF), rendering user content (XSS), cryptography, secrets/credentials, dependencies and
  supply chain, or security headers/TLS. Strongly prefer this skill any time you build a
  login/permissions system, accept untrusted input, or are asked "is this secure", "harden
  this", or "threat model this". Complements gitleaks (secret scanning) and the security role
  in team-orchestration; for reviewing an existing diff, the built-in /security-review is also
  available.
---

# Secure Coding Rulebook

Security is not a feature you add at the end — it's a property of how you handle untrusted
input, identity, and secrets throughout the code. The vast majority of breaches come from a
small set of well-understood mistakes. This rulebook covers the patterns that prevent them;
`references/owasp-and-threats.md` has the OWASP Top 10 detail and a STRIDE threat-modeling
checklist.

## The core mindset
- **Never trust input.** Anything from a client, a URL, a header, a file, another service,
  or even your own database (it might hold earlier bad input) is untrusted until validated.
- **Default deny, least privilege.** Grant the minimum access needed; deny by default and
  allow explicitly — for users, tokens, DB accounts, and service credentials alike.
- **Defense in depth.** Don't rely on one control (e.g. client-side validation); assume each
  layer can fail and add another behind it. Server-side checks are authoritative.
- **Fail securely.** On error, deny access and reveal nothing useful to an attacker (no stack
  traces, internal paths, or "user exists but wrong password" oracles).

## Authentication & authorization
- **Passwords:** store only a salted, slow hash (bcrypt/scrypt/argon2id) — never plaintext,
  never fast hashes (MD5/SHA-1/SHA-256 alone). Enforce length over arcane complexity rules.
- **Sessions/tokens:** use vetted libraries. Cookies: `HttpOnly`, `Secure`, `SameSite`. JWTs:
  verify signature and `exp`, pin the algorithm (reject `alg:none`), keep them short-lived,
  and have a revocation story. Don't put secrets/PII in a JWT payload (it's just base64).
- **Authorization on every privileged action — server-side.** The #1 modern bug class is
  *broken access control*: check that *this* user may act on *this* object every time
  (no IDOR — don't trust an ID in the request to be theirs). Hiding a button is not authz.
- **Re-authenticate** for sensitive changes (password, email, payment).

## Handling untrusted input
- **Injection (SQL/NoSQL/command/LDAP):** use parameterized queries / prepared statements /
  safe APIs. Never concatenate user input into a query or a shell command. Avoid shelling out;
  if unavoidable, pass args as a list, never through a shell string.
- **XSS:** contextually encode output; let your templating framework auto-escape; avoid
  `dangerouslySetInnerHTML`/`innerHTML` with user data; set a Content-Security-Policy.
- **SSRF:** validate and all&zwnj;list outbound URLs built from user input; block internal/metadata
  IP ranges. Assume any user-supplied URL is an attack on your internal network.
- **Path traversal / uploads:** canonicalize and confine paths to an intended directory;
  reject `..`; validate file type/size; store uploads outside the web root and serve them safely.
- **Mass assignment:** allowlist which fields a request may set; don't bind request bodies
  straight onto models (an attacker sets `is_admin=true`).

## Secrets & cryptography
- **No secrets in code or git history.** Use environment variables / a secret manager; scan
  with `gitleaks`. If one leaks, **rotate it** — removing the commit isn't enough.
- **Don't roll your own crypto.** Use standard libraries and high-level primitives
  (libsodium, AEAD like AES-GCM/ChaCha20-Poly1305). Generate keys/tokens with a CSPRNG.
- **TLS everywhere**; validate certificates; no plaintext transport of credentials/PII.

## Dependencies & supply chain
- Scan dependencies for known vulns (`npm audit`, `pip-audit`, `govulncheck`); keep them
  patched. Commit lockfiles; review what you pull in; watch for typosquats and abandoned packages.
- Prefer fewer, well-maintained dependencies. For higher assurance, pin versions and verify
  integrity (hashes / provenance, e.g. SLSA).

## Headers, errors, logging
- Set security headers: `Content-Security-Policy`, `Strict-Transport-Security`,
  `X-Content-Type-Options: nosniff`, sensible `Referrer-Policy`, and frame protection.
- Return generic error messages to clients; log the detail server-side.
- **Never log secrets, tokens, passwords, or full PII.** Redact. Logs leak.

## Before shipping (quick gate)
Threat-model the main data flows (STRIDE — see reference), confirm authz on every privileged
path, parameterize all queries, run a secret scan + dependency audit, and verify nothing
sensitive is logged. No high/critical issue ships unaccepted.
