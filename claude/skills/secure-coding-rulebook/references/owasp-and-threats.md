# OWASP Top 10 + STRIDE threat modeling

## OWASP Top 10 (2021) — what each is and the core mitigation
1. **Broken Access Control** — users acting outside intended permissions (IDOR, missing
   server-side authz, forced browsing). *Fix:* default-deny, check authorization on every
   object/action server-side, deny by default.
2. **Cryptographic Failures** — sensitive data exposed via weak/absent crypto or plaintext.
   *Fix:* TLS in transit, strong encryption at rest, modern algorithms, proper key management.
3. **Injection** (SQL, NoSQL, command, LDAP, XSS as a form) — untrusted input interpreted as
   code/query. *Fix:* parameterized queries, safe APIs, contextual output encoding, validation.
4. **Insecure Design** — missing security controls by design. *Fix:* threat model early,
   secure design patterns, abuse-case thinking.
5. **Security Misconfiguration** — default creds, verbose errors, open cloud buckets, missing
   headers. *Fix:* hardened defaults, least privilege, disable unused features, review config.
6. **Vulnerable & Outdated Components** — known-CVE dependencies. *Fix:* SCA scanning, patch
   cadence, remove unused deps, lockfiles.
7. **Identification & Authentication Failures** — weak auth, credential stuffing, bad session
   handling. *Fix:* strong password hashing, MFA, secure session/token handling, rate limiting.
8. **Software & Data Integrity Failures** — untrusted updates/deserialization, CI/CD tampering.
   *Fix:* verify integrity/signatures, avoid unsafe deserialization, secure the pipeline (SLSA).
9. **Security Logging & Monitoring Failures** — can't detect/respond to attacks. *Fix:* log
   security events (authz failures, logins), monitor/alert, retain — without logging secrets.
10. **Server-Side Request Forgery (SSRF)** — server fetches an attacker-controlled URL. *Fix:*
    allowlist destinations, block internal/metadata ranges, validate and don't follow blindly.

## STRIDE threat modeling
For each major data flow / trust boundary, ask what could go wrong in each category and what
control mitigates it:

| Threat | Question | Property it violates | Typical mitigation |
|---|---|---|---|
| **S**poofing | Can someone pretend to be another identity? | Authentication | strong auth, MFA, signed tokens |
| **T**ampering | Can data be modified in transit or at rest? | Integrity | TLS, signatures, hashes, access control |
| **R**epudiation | Can someone deny doing an action? | Non-repudiation | audit logs, signed records |
| **I**nformation disclosure | Can data leak to the wrong party? | Confidentiality | encryption, authz, redaction |
| **D**enial of service | Can it be made unavailable? | Availability | rate limits, quotas, timeouts, autoscale |
| **E**levation of privilege | Can someone gain rights they shouldn't? | Authorization | least privilege, default-deny, server-side checks |

### How to run a quick threat model
1. **Diagram** the system: components, data stores, and the flows between them.
2. **Mark trust boundaries** (where data crosses from less- to more-trusted, e.g. internet →
   API, API → DB).
3. For each boundary, **walk STRIDE** and note plausible threats.
4. **Decide** per threat: mitigate (add a control), accept (with written rationale), or
   transfer. Track the mitigations as tasks.
5. Revisit when the design changes.
