# CodeGames

Learn to code from the ground up by playing games.

CodeGames teaches **Python** and **JavaScript** from "Hello, World!" through data structures, algorithms, and defensive security, through interactive games where **the code is the game**. Everything runs directly in your browser with zero server lag, works 100% offline by default, and preserves your progress locally with optional cross-device cloud sync.

> **Status:** Python & JavaScript, Regions 0–7 (238 levels per language, Green & Blue belts), plus the **Web Pages side quest** (13 levels manipulating a live DOM in JS), the **Security side quest** (13 levels on defensive fundamentals, hashing, ciphers, and The Vault boss), and two **Creator Workshops** (custom Hangman word lists and Text Adventure engines).

## Key Features

- **Read Before You Write (PRIMM):** Predict outputs, investigate logic, arrange lines (Parsons puzzles), fill in blanks, and complete guided builds before freeform coding.
- **Client-Side Sandboxing:** JavaScript executes inside isolated Web Workers; Python runs via Pyodide WebAssembly with per-run memory isolation and an interrupt buffer for runaway loops.
- **Offline-First with Optional Cloud Sync:** Progress saves locally in your browser by default. Sign in with passwordless magic link / OTP at any time to sync seamlessly to Supabase across devices.
- **Spaced Retrieval & Belts:** Spaced warm-ups resurface older concepts based on mastery. Earn belt ranks (White → Yellow → Orange → Green → Blue) by building boss projects independently.
- **Admin Information Center:** Built-in telemetry console for authorized operators featuring live Supabase roundtrip latency monitors, database counters, an in-browser WebAssembly sandbox benchmark runner, storage cache cleanup, and system-wide announcements (MOTD).

## Getting Started

Requirements: **Node.js 20+**.

```bash
npm install
npm run dev          # Start web app → http://localhost:5173
npm run typecheck    # Typecheck all workspaces strictly
npm test             # Run unit & curriculum tests (1,700+ tests)
npm run test:e2e     # Run Playwright end-to-end suite
npm run check:sinks  # Verify secure storage and DOM sink invariants
npm run build        # Production build
```

## Project Structure

```
apps/
  web/          React + TypeScript + Vite front end
  runner/       Local server skeleton for future Java & C++ (127.0.0.1 only)
packages/
  shared/       Core TypeScript types, level definitions, and contracts
  runtime/      Sandboxed code execution (JS Web Worker, Pyodide WASM, robot simulation)
  curriculum/   Concept map, levels, mastery progression, and validation tests
e2e/            Playwright end-to-end integration and security test suites
scripts/        Verification tools (sink invariants, screenshots, export scripts)
```

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Start web development server |
| `npm run typecheck` | Run TypeScript compiler verification across all packages |
| `npm test` | Run all unit tests and verify every level solution in both languages |
| `npm run test:e2e` | Run Playwright end-to-end browser tests |
| `npm run check:sinks` | Verify no forbidden storage or DOM sinks exist in source files |
| `npm run build` | Compile optimized production build with bundled fonts & workers |

## Privacy & Security

CodeGames enforces a strict privacy posture:
- **No Third-Party Trackers or Ads.**
- **Local by Default:** Guest learners generate zero cloud footprint.
- **Hardened Sandbox:** Isolated worker execution boundaries, strict Content Security Policy (CSP), Cross-Origin Embedder/Opener Policies (COOP/COEP), and zero client secrets.
- **Role-Based Access Control:** Administrative operations require cryptographic token verification and Row-Level Security (RLS) enforcement in Supabase.
