# Security Policy

## Reporting a Vulnerability

Please report vulnerabilities privately via GitHub Private Vulnerability Reporting:
navigate to the repository's **Security** tab and click **Report a vulnerability**.

Do not submit public issues or pull requests for suspected vulnerabilities. You will receive an initial response within **48 hours**.

## Security Architecture & Scope

### In Scope
- **Client Execution Sandbox:** Web Worker isolation for JavaScript and Pyodide WebAssembly for Python, memory boundaries, and interrupt handling.
- **Data & Persistence:** Offline IndexedDB / localStorage integrity, Supabase Row-Level Security (RLS) policies, passwordless authentication, and session handling.
- **Edge & Transport:** Content Security Policy (CSP), Cross-Origin Opener / Embedder Policies (COOP/COEP), and token storage.
- **API & RPC Layer:** Public and private PostgreSQL stored procedures, rate limiting, and administrative access controls.

### Out of Scope
- **Local Runner:** `apps/runner` is a development skeleton restricted strictly to `127.0.0.1`.
- **Educational Side Quests:** The curriculum's Security side quest intentionally features vulnerable toy ciphers, weak hashing demonstrations, and mock SQL targets. These are labeled as fictional teaching aids and do not constitute security defects in the platform.
