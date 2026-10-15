import { defineConfig, type Plugin, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { contentSecurityPolicy, ISOLATION_HEADERS } from './src/csp';
export { contentSecurityPolicy, ISOLATION_HEADERS };

/** Long-lived vendor code in its own chunks, so it caches separately from the app. */
function manualChunks(id: string): string | undefined {
  if (id.includes('node_modules/@codemirror') || id.includes('node_modules/@lezer') || id.includes('node_modules/codemirror')) return 'editor';
  if (/node_modules\/(react|react-dom|react-router|scheduler)\//.test(id)) return 'react';
  if (id.includes('packages/curriculum/')) return 'curriculum';
  return undefined;
}

/** The CSP as a `<meta>` tag at the top of `<head>` (the header is the primary copy). */
function cspMeta(dev: boolean, supabaseUrl?: string): Plugin {
  return {
    name: 'codegames-csp-meta',
    transformIndexHtml: () => [
      {
        tag: 'meta',
        attrs: {
          'http-equiv': 'Content-Security-Policy',
          content: contentSecurityPolicy({ dev, supabaseUrl, allowInsecureLocal: dev }),
        },
        injectTo: 'head-prepend',
      },
    ],
  };
}

export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const isDev = command === 'serve';
  const supabaseUrl = env.VITE_SUPABASE_URL;

  const csp = contentSecurityPolicy({
    dev: isDev,
    supabaseUrl,
    allowInsecureLocal: isDev,
  });

  return {
    plugins: [react(), cspMeta(isDev, supabaseUrl)],
    server: {
      port: 5173,
      headers: {
        ...ISOLATION_HEADERS,
        'Content-Security-Policy': csp,
      },
    },
    preview: {
      port: 4173,
      headers: {
        ...ISOLATION_HEADERS,
        'Content-Security-Policy': csp,
      },
    },
    build: {
      rollupOptions: {
        output: { manualChunks },
      },
    },
  };
});
