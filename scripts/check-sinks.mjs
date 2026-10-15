#!/usr/bin/env node
// CI sink ban: fails when an unsafe code sink appears outside its allowlisted files.
// Dependency-free on purpose. Usage:
//   node scripts/check-sinks.mjs              scan the repo (exit 1 on violations)
//   node scripts/check-sinks.mjs --self-test  verify the rules against planted fixtures
// Rules mirror the "Batch H2" table in the launch input-inventory. To allow a new file,
// add it to the rule's `allow` list below and justify it in the PR.

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

const WEB = 'apps/web/src/';
const RT = 'packages/runtime/src/';

// ---------------------------------------------------------------------------
// PHASE 3 ADDITIONS GO HERE. Phase 3 adds lib/supabase.ts and features/sync/**
// to the localStorage and fetch allowlists: fill in these two arrays.
// ---------------------------------------------------------------------------
const PHASE3_LOCAL_STORAGE_ALLOW = [
  WEB + 'lib/supabase.ts',
  WEB + 'features/sync/**',
  WEB + 'features/auth/**',
];
const PHASE3_FETCH_ALLOW = [
  WEB + 'lib/supabase.ts',
  WEB + 'features/sync/**',
  WEB + 'features/auth/**',
];

const EVAL_ALLOW = [RT + 'javascript.ts', RT + 'sandbox.ts', WEB + 'engine/lockdown.ts'];

/**
 * `mentions: false` rules ignore bare quoted names ('fetch') and `name: undefined` shadow
 * entries, which is how the sandbox and lockdown lists name globals in order to remove them.
 * @type {{ name: string, re: RegExp, allow: string[], mentions?: boolean }[]}
 */
export const RULES = [
  { name: 'dangerouslySetInnerHTML', re: /dangerouslySetInnerHTML/, allow: [WEB + 'lib/markdown.tsx'] },
  {
    name: 'innerHTML/outerHTML assignment',
    re: /\b(?:inner|outer)HTML\s*=(?!=)/,
    // Level content (hint/lesson text and starter code) teaches this API as data; it never runs here.
    allow: [RT + 'dom.ts', 'packages/curriculum/src/levels/**'],
  },
  { name: 'insertAdjacentHTML', re: /insertAdjacentHTML/, allow: [RT + 'dom.ts'] },
  { name: 'document.write', re: /document\s*\.\s*write(?:ln)?\s*\(/, allow: [RT + 'dom.ts'] },
  { name: 'eval(', re: /\beval\s*\(/, allow: EVAL_ALLOW },
  { name: 'new Function', re: /\bnew\s+Function\b/, allow: EVAL_ALLOW },
  { name: 'Function(', re: /(?<![\w$.[])Function\s*\(/, allow: EVAL_ALLOW },
  { name: 'window.open', re: /\bwindow\s*\.\s*open\s*\(/, allow: [] },
  { name: 'srcdoc', re: /\bsrcdoc\b/i, allow: [] },
  { name: '<iframe', re: /<iframe\b/i, allow: [] },
  { name: '<object', re: /<object\s+[\w:-]+\s*=/i, allow: [] },
  { name: '<embed', re: /<embed\b/i, allow: [] },
  { name: 'href/src/action/formAction={...} (needs a safeHref() helper)', re: /\b(?:href|src|action|formAction)=\{/, allow: [] },
  // Assigning a constant string literal is safe, so it is not flagged.
  { name: '.href = / .src =', re: /\.(?:href|src)\s*=(?!=)(?!\s*(['"])[^'"]*\1)/, allow: [WEB + 'lib/download.ts'] },
  {
    name: 'localStorage/sessionStorage',
    re: /\b(?:localStorage|sessionStorage)\b/,
    allow: [WEB + 'features/progress/store.ts', WEB + 'features/progress/backup.ts', ...PHASE3_LOCAL_STORAGE_ALLOW],
  },
  {
    name: "addEventListener('message'|'storage')",
    re: /addEventListener\(\s*['"`](?:message|storage)['"`]/,
    allow: [WEB + 'engine/host.ts', WEB + 'engine/js.worker.ts', WEB + 'engine/py.worker.ts', WEB + 'features/progress/store.ts'],
  },
  { name: 'postMessage', re: /\bpostMessage\b/, allow: [WEB + 'engine/**', WEB + 'lib/swClient.ts'], mentions: false },
  { name: 'new Worker', re: /\bnew\s+(?:Shared)?Worker\b/, allow: [WEB + 'engine/**'] },
  { name: 'importScripts', re: /\bimportScripts\b/, allow: [WEB + 'engine/**'], mentions: false },
  {
    name: 'JSON.parse (must be followed by a validator)',
    re: /\bJSON\s*\.\s*parse\b/,
    allow: [WEB + 'features/progress/backup.ts', RT + 'python.ts', WEB + 'features/sync/**'],
  },
  {
    name: 'fetch(/XMLHttpRequest/WebSocket/sendBeacon',
    re: /\bfetch\s*\(|\bXMLHttpRequest\b|\bWebSocket\b|\bsendBeacon\b/,
    allow: [WEB + 'engine/runner.ts', ...PHASE3_FETCH_ALLOW],
    mentions: false,
  },
  {
    name: 'type="file"',
    re: /type=(?:"file"|'file'|\{['"]file['"]\})/,
    allow: [WEB + 'components/AppShell.tsx', WEB + 'features/games/CreatorWorkshop.tsx'],
  },
  { name: 'child_process', re: /\bchild_process\b/, allow: ['apps/runner/src/**'] },
  { name: 'exec(', re: /(?<![\w$.])exec\s*\(/, allow: ['apps/runner/src/**'] },
  { name: 'spawn(', re: /\bspawn\s*\(/, allow: ['apps/runner/src/**'] },
  { name: 'req.body as', re: /\breq\.body\s+as\b/, allow: [] },
  { name: 'as RunRequest (parse with a schema instead)', re: /\bas\s+RunRequest\b/, allow: [] },
];

const EXCLUDED_DIRS = new Set(['node_modules', '__tests__', 'e2e', 'dist']);
const SOURCE_EXT = /\.[cm]?[jt]sx?$/;
const TEST_FILE = /\.(?:test|spec)\.[cm]?[jt]sx?$/;

function listPackageSrcDirs() {
  const base = join(ROOT, 'packages');
  try {
    return readdirSync(base)
      .filter((d) => statSync(join(base, d, 'src'), { throwIfNoEntry: false })?.isDirectory())
      .map((d) => `packages/${d}/src`);
  } catch {
    return [];
  }
}

const SCAN_ROOTS = ['apps/web/src', 'apps/runner/src', ...listPackageSrcDirs()];

function isExcludedPath(rel) {
  return (
    rel.includes('apps/web/public/pyodide') ||
    rel.split('/').some((p) => EXCLUDED_DIRS.has(p)) ||
    TEST_FILE.test(rel)
  );
}

function matchesAllow(rel, pattern) {
  return pattern.endsWith('/**') ? rel.startsWith(pattern.slice(0, -2)) : rel === pattern;
}

const MENTION = /(['"`])[A-Za-z_$][\w$]*\1|\b[A-Za-z_$][\w$]*\s*:\s*undefined\b/g;

/** Whole-line comments are skipped so docs can mention a banned API by name. */
function isCommentLine(line) {
  const t = line.trim();
  return t.startsWith('//') || t.startsWith('*') || t.startsWith('/*');
}

/** Scan source text for one repo-relative path; returns violation strings. */
export function scanText(rel, text) {
  const out = [];
  text.split('\n').forEach((line, i) => {
    if (isCommentLine(line)) return;
    const stripped = line.replace(MENTION, '');
    for (const rule of RULES) {
      if (!rule.re.test(rule.mentions === false ? stripped : line)) continue;
      if (rule.allow.some((a) => matchesAllow(rel, a))) continue;
      const allowed = rule.allow.length ? rule.allow.join(', ') : 'none';
      out.push(`${rel}:${i + 1}: ${rule.name} (allowed only in ${allowed})`);
    }
  });
  return out;
}

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const rel = relative(ROOT, full).split(sep).join('/');
    if (isExcludedPath(rel)) continue;
    if (statSync(full).isDirectory()) yield* walk(full);
    else if (SOURCE_EXT.test(name)) yield { full, rel };
  }
}

function scanRepo() {
  const violations = [];
  for (const root of SCAN_ROOTS) {
    const abs = join(ROOT, root);
    if (!statSync(abs, { throwIfNoEntry: false })?.isDirectory()) continue;
    for (const { full, rel } of walk(abs)) violations.push(...scanText(rel, readFileSync(full, 'utf8')));
  }
  return violations;
}

function selfTest() {
  /** [description, path, source, expectedViolationCount] */
  const cases = [
    ['dangerouslySetInnerHTML planted', WEB + 'components/X.tsx', '<div dangerouslySetInnerHTML={{ __html: h }} />', 1],
    ['dangerouslySetInnerHTML allowlisted', WEB + 'lib/markdown.tsx', '<div dangerouslySetInnerHTML={{ __html: h }} />', 0],
    ['innerHTML assignment planted', WEB + 'components/X.tsx', 'el.innerHTML = x;', 1],
    ['innerHTML comparison ok', WEB + 'components/X.tsx', 'if (el.innerHTML == x) {}', 0],
    ['innerHTML allowlisted', RT + 'dom.ts', 'el.innerHTML = x;', 0],
    ['insertAdjacentHTML planted', WEB + 'components/X.tsx', "el.insertAdjacentHTML('beforeend', x)", 1],
    ['document.write planted', WEB + 'components/X.tsx', 'document.write(x)', 1],
    ['eval planted', WEB + 'components/X.tsx', 'eval(code)', 1],
    ['new Function planted', RT + 'grade.ts', 'const f = new Function("a", code)', 2],
    ['new Function allowlisted', RT + 'javascript.ts', 'const f = new Function("a", code)', 0],
    ['Function( allowlisted lockdown', WEB + 'engine/lockdown.ts', 'Function("return 1")', 0],
    ['window.open planted', WEB + 'components/X.tsx', 'window.open(u)', 1],
    ['srcdoc + iframe planted', WEB + 'components/X.tsx', '<iframe srcDoc={h} />', 2],
    ['<object planted', WEB + 'components/X.tsx', '<object data="x" />', 1],
    ['<embed planted', WEB + 'components/X.tsx', '<embed src="x" />', 1],
    ['href={ planted', WEB + 'components/X.tsx', '<a href={url}>x</a>', 1],
    ['literal href ok', WEB + 'components/X.tsx', '<a href="#top">x</a>', 0],
    ['.href = planted', WEB + 'components/X.tsx', 'a.href = url', 1],
    ['.href = allowlisted', WEB + 'lib/download.ts', 'a.href = url', 0],
    ['localStorage planted', WEB + 'components/X.tsx', 'localStorage.getItem("k")', 1],
    ['sessionStorage planted', WEB + 'components/X.tsx', 'sessionStorage.clear()', 1],
    ['localStorage allowlisted', WEB + 'features/progress/store.ts', 'localStorage.getItem("k")', 0],
    ["addEventListener('message') planted", WEB + 'components/X.tsx', "window.addEventListener('message', h)", 1],
    ["addEventListener('message') allowlisted", WEB + 'engine/host.ts', "worker.addEventListener('message', h)", 0],
    ['postMessage planted', WEB + 'components/X.tsx', 'w.postMessage(1)', 1],
    ['postMessage engine/** allowed', WEB + 'engine/anything.ts', 'w.postMessage(1)', 0],
    ['new Worker planted', WEB + 'features/games/X.tsx', 'new Worker(u)', 1],
    ['importScripts planted', WEB + 'components/X.tsx', 'importScripts(u)', 1],
    ['JSON.parse planted', WEB + 'components/X.tsx', 'JSON.parse(s)', 1],
    ['JSON.parse allowlisted', RT + 'python.ts', 'JSON.parse(s)', 0],
    ['fetch planted', WEB + 'components/X.tsx', 'await fetch(u)', 1],
    ['fetch allowlisted', WEB + 'engine/runner.ts', 'await fetch(u)', 0],
    ['XMLHttpRequest planted', WEB + 'components/X.tsx', 'new XMLHttpRequest()', 1],
    ['WebSocket planted', WEB + 'components/X.tsx', 'new WebSocket(u)', 1],
    ['sendBeacon planted', WEB + 'components/X.tsx', 'navigator.sendBeacon(u)', 1],
    ['type="file" planted', WEB + 'components/X.tsx', '<input type="file" />', 1],
    ['type="file" allowlisted', WEB + 'components/AppShell.tsx', '<input type="file" />', 0],
    ['child_process planted in web', WEB + 'components/X.tsx', "import 'node:child_process'", 1],
    ['exec( planted in web', WEB + 'components/X.tsx', 'exec(cmd)', 1],
    ['execFile is not exec(', WEB + 'components/X.tsx', 'execFile(cmd)', 0],
    ['spawn allowed in runner', 'apps/runner/src/index.ts', 'spawn(cmd)', 0],
    ['req.body as planted', 'apps/runner/src/index.ts', 'const b = req.body as Foo', 1],
    ['as RunRequest planted', 'apps/runner/src/index.ts', 'const b = x as RunRequest', 1],
    ['quoted name in a block list is a mention', WEB + 'engine/x.ts', "const B = ['fetch', 'XMLHttpRequest', 'WebSocket'];", 0],
    ['quoted name outside engine, postMessage', WEB + 'components/X.tsx', "const B = ['postMessage'];", 0],
    ['shadow entry ok', RT + 'grade.ts', 'importScripts: undefined,', 0],
    ['href = constant literal ok', WEB + 'components/X.tsx', "props.href = '#';", 0],
    ['regex .exec ok', RT + 'grade.ts', 're.exec(text)', 0],
    ['generic <object> ok', RT + 'grade.ts', 'new WeakMap<object, object>()', 0],
    ['[Function (anonymous)] string ok', RT + 'grade.ts', "'[Function (anonymous)]'", 0],
    ['innerHTML in curriculum data ok', 'packages/curriculum/src/levels/region8/x.ts', "'el.innerHTML = x'", 0],
    ['comment lines skipped', WEB + 'components/X.tsx', '// never call eval(x) here', 0],
    ['block comment lines skipped', WEB + 'components/X.tsx', ' * uses dangerouslySetInnerHTML', 0],
    ['features/sync not yet allowlisted for fetch', WEB + 'features/sync/x.ts', 'await fetch(u)', PHASE3_FETCH_ALLOW.length ? 0 : 1],
  ];
  let failed = 0;
  for (const [desc, path, src, expected] of cases) {
    const got = scanText(path, src).length;
    if (got !== expected) {
      failed++;
      console.error(`FAIL: ${desc}: expected ${expected} violation(s), got ${got}`);
    }
  }
  const excluded = [
    'apps/web/src/lib/__tests__/a.ts',
    'apps/web/src/lib/a.test.ts',
    'apps/web/public/pyodide/x.js',
    'e2e/a.ts',
    'packages/runtime/node_modules/x/index.js',
  ];
  for (const p of excluded) {
    if (!isExcludedPath(p)) {
      failed++;
      console.error(`FAIL: ${p} should be excluded`);
    }
  }
  if (failed) {
    console.error(`self-test: ${failed} failure(s)`);
    process.exit(1);
  }
  console.log(`self-test: ${cases.length} cases + ${excluded.length} exclusions OK`);
}

if (process.argv.includes('--self-test')) {
  selfTest();
} else if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const violations = scanRepo();
  if (violations.length) {
    console.error(violations.join('\n'));
    console.error(`\ncheck-sinks: ${violations.length} violation(s). Do not widen the allowlist to hide them; fix the code.`);
    process.exit(1);
  }
  console.log('check-sinks: OK');
}
