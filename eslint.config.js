// ESLint flat config. Security rules only: this is the lint half of the sink ban
// (the other half is scripts/check-sinks.mjs). Do not add style rules here.
import react from 'eslint-plugin-react';
import tseslint from 'typescript-eslint';

// App source has `eslint-disable react-hooks/...` comments from before ESLint existed here.
// ESLint errors on directives naming an unknown rule, so register a no-op stand-in.
const reactHooksStub = { rules: { 'exhaustive-deps': { meta: { schema: [] }, create: () => ({}) } } };

const securityRules = {
  'no-eval': 'error',
  'no-implied-eval': 'error',
  'no-new-func': 'error',
  'react/no-danger': 'error',
  'no-restricted-syntax': [
    'error',
    {
      selector: "AssignmentExpression[left.type='MemberExpression'][left.property.name=/^(innerHTML|outerHTML)$/]",
      message: 'Assigning innerHTML/outerHTML is banned; build nodes with textContent/createElement.',
    },
    {
      selector: "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]",
      message: 'document.write is banned.',
    },
  ],
};

export default tseslint.config(
  {
    ignores: ['**/node_modules/**', '**/dist/**', 'apps/web/public/pyodide/**', 'test-results/**', 'playwright-report/**', '.claude/**'],
  },
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx,jsx}'],
    languageOptions: { parser: tseslint.parser },
    // Parser only: no recommended rule sets, so nothing but the security rules below fires.
    plugins: { react, 'react-hooks': reactHooksStub },
    linterOptions: { reportUnusedDisableDirectives: 'off' },
    rules: securityRules,
  },
  // Tests deliberately exercise the sandbox with eval and friends (check-sinks skips them too).
  {
    files: ['**/__tests__/**', '**/test/**', '**/*.{test,spec}.*', 'e2e/**'],
    rules: { 'no-eval': 'off', 'no-implied-eval': 'off', 'no-new-func': 'off', 'no-restricted-syntax': 'off' },
  },
  // Per-file overrides: keep in step with the allowlists in scripts/check-sinks.mjs.
  {
    files: ['apps/web/src/lib/markdown.tsx'],
    rules: { 'react/no-danger': 'off' },
  },
  {
    files: ['packages/runtime/src/javascript.ts', 'packages/runtime/src/sandbox.ts'],
    rules: { 'no-new-func': 'off', 'no-eval': 'off', 'no-implied-eval': 'off' },
  },
  {
    files: ['packages/runtime/src/dom.ts'],
    rules: { 'no-restricted-syntax': 'off' },
  },
);
