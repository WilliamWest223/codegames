import express from 'express';
import cors from 'cors';
import { RUNNER_PORT, type RunRequest } from '@codegames/shared';
import { detectToolchains } from './toolchains';

const RUNNER_LANGUAGES = ['java', 'cpp'] as const;
const MAX_CODE_BYTES = 100_000;
const MAX_STDIN_BYTES = 10_000;
const MAX_TIMEOUT_MS = 10_000;

/** Only the web app's own dev (5173) and preview (4173) servers may call the runner. */
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173', 'http://127.0.0.1:4173'];
/** Host allowlist defeats DNS rebinding: a hostile page can't reach us through a name it controls. */
const ALLOWED_HOSTS = new Set([`127.0.0.1:${RUNNER_PORT}`, `localhost:${RUNNER_PORT}`]);

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const byteLength = (s: string) => Buffer.byteLength(s, 'utf8');
const isRunnerLanguage = (v: unknown): v is (typeof RUNNER_LANGUAGES)[number] =>
  typeof v === 'string' && (RUNNER_LANGUAGES as readonly string[]).includes(v);

/** Validates an untrusted request body. Returns the request, or a short reason it was rejected. */
export function parseRunRequest(body: unknown): RunRequest | { error: string } {
  if (!isRecord(body)) return { error: 'body must be a JSON object' };
  const allowed = new Set(['language', 'code', 'stdin', 'timeoutMs']);
  if (Object.keys(body).some((k) => !allowed.has(k))) return { error: 'unknown field' };
  const { language, code, stdin, timeoutMs } = body;
  if (!isRunnerLanguage(language)) return { error: 'language must be java or cpp' };
  if (typeof code !== 'string' || code.length === 0 || byteLength(code) > MAX_CODE_BYTES) return { error: 'code is missing or too large' };
  if (stdin !== undefined && (typeof stdin !== 'string' || byteLength(stdin) > MAX_STDIN_BYTES)) return { error: 'stdin is too large' };
  if (timeoutMs !== undefined && (typeof timeoutMs !== 'number' || !Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > MAX_TIMEOUT_MS)) {
    return { error: 'timeoutMs must be an integer from 1 to 10000' };
  }
  return { language, code, ...(stdin !== undefined ? { stdin } : {}), ...(typeof timeoutMs === 'number' ? { timeoutMs } : {}) };
}

const app = express();
app.use((req, res, next) => {
  if (!ALLOWED_HOSTS.has(req.headers.host ?? '')) {
    res.status(421).json({ error: 'unexpected host' });
    return;
  }
  next();
});
app.use(cors({ origin: ALLOWED_ORIGINS }));
app.use(express.json({ limit: '100kb', strict: true, type: 'application/json' }));

app.get('/health', async (_req, res) => {
  res.json({ ok: true, toolchains: await detectToolchains() });
});

app.post('/run', (req, res) => {
  if (!req.is('application/json')) {
    res.status(415).json({ error: 'expected application/json' });
    return;
  }
  const parsed = parseRunRequest(req.body);
  if ('error' in parsed) {
    res.status(400).json({ error: parsed.error });
    return;
  }
  // TODO: write code to a temp dir under tmp/, compile (javac / g++) with execFile (never a shell string),
  // run with timeout + output cap + a concurrency limit.
  res.status(501).json({ error: `Running ${parsed.language} is not implemented yet` });
});

// Bind to loopback only: this server executes arbitrary code and must never be reachable from the network.
app.listen(RUNNER_PORT, '127.0.0.1', () => {
  console.log(`CodeGames runner listening on http://127.0.0.1:${RUNNER_PORT}`);
});
