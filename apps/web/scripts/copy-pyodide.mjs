// Copies the Pyodide runtime from node_modules into public/pyodide so Python runs
// fully offline (no CDN). public/pyodide is gitignored; this runs before dev and build.
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const source = dirname(require.resolve('pyodide/package.json'));
const target = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'pyodide');
const files = ['pyodide.mjs', 'pyodide.asm.mjs', 'pyodide.asm.wasm', 'python_stdlib.zip', 'pyodide-lock.json'];

mkdirSync(target, { recursive: true });
let copied = 0;
for (const file of files) {
  const from = join(source, file);
  const to = join(target, file);
  if (existsSync(to) && statSync(to).size === statSync(from).size) continue;
  copyFileSync(from, to);
  copied++;
}
console.log(`pyodide: ${copied} file(s) copied to public/pyodide`);
