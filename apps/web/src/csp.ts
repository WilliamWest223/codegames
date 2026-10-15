// apps/web/build/csp.ts
// Single source of truth for Content-Security-Policy and isolation headers across Vite, SW, and Vercel.

export interface CspOptions {
  dev: boolean;
  supabaseUrl?: string;
  turnstile?: boolean;
  allowInsecureLocal?: boolean;
}

export const ISOLATION_HEADERS = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
} as const;

export function supabaseOrigins(url?: string, allowInsecureLocal = false): string[] {
  if (!url) return [];
  try {
    const parsed = new URL(url);
    const isLocal = parsed.hostname === '127.0.0.1' || parsed.hostname === 'localhost';
    if (!isLocal && parsed.protocol !== 'https:') {
      throw new Error(`Insecure Supabase URL rejected in production: ${url}`);
    }
    if (isLocal && !allowInsecureLocal && parsed.protocol !== 'https:') {
      // Local dev mode allows http/ws when explicitly permitted
      return [`http://${parsed.host}`, `ws://${parsed.host}`];
    }
    return [`https://${parsed.host}`, `wss://${parsed.host}`];
  } catch (err: unknown) {
    if (err instanceof Error) throw err;
    throw new Error(`Invalid Supabase URL: ${url}`);
  }
}

export function contentSecurityPolicy(opts: CspOptions): string {
  const connectSrc = ["'self'"];
  if (opts.dev) {
    connectSrc.push('ws:', 'wss:');
  }
  if (opts.supabaseUrl) {
    const origins = supabaseOrigins(opts.supabaseUrl, opts.dev || opts.allowInsecureLocal);
    connectSrc.push(...origins);
  }

  const scriptSrc = ["'self'", "'unsafe-eval'", "'wasm-unsafe-eval'"];
  const frameSrc: string[] = [];

  if (opts.dev) {
    scriptSrc.push("'unsafe-inline'");
  }

  if (opts.turnstile) {
    scriptSrc.push('https://challenges.cloudflare.com');
    frameSrc.push('https://challenges.cloudflare.com');
  }

  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': scriptSrc,
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'", 'data:'],
    'connect-src': connectSrc,
    'worker-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };

  if (frameSrc.length > 0) {
    directives['frame-src'] = frameSrc;
  }

  return Object.entries(directives)
    .map(([key, vals]) => `${key} ${vals.join(' ')}`)
    .join('; ');
}

export function securityHeaders(opts: CspOptions): Record<string, string> {
  return {
    ...ISOLATION_HEADERS,
    'Content-Security-Policy': contentSecurityPolicy(opts),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
  };
}
