import type { CSSProperties } from 'react';

/** Longest `style` string used; the rest is ignored. */
export const MAX_STYLE = 2000;

/**
 * Values that could load something, hide a function name behind an escape (`\\75rl(`), or
 * smuggle a comment into the filter: any backslash or comment marker, and every CSS function
 * that takes a resource (`url`, `src`, `image-set`, `cross-fade`, `element`, `paint`) or runs code.
 */
const UNSAFE_VALUE = /\\|\/\*|@import|javascript:|-moz-binding|(?:url|src|image-set|cross-fade|element|paint|expression)\s*\(/i;

/**
 * Turn a snapshot's `style` attribute (`"color: red; font-size: 12px"`) into a React style
 * object (`{ color: 'red', fontSize: '12px' }`). Declarations that could reach outside the
 * page or load something are dropped: `url(...)` values, `@import`, and `position` (a fixed
 * element would sit over the app, not the page).
 */
export function stylePropsFrom(style: string): CSSProperties {
  const out: Record<string, string> = {};
  for (const declaration of style.slice(0, MAX_STYLE).split(';')) {
    const at = declaration.indexOf(':');
    if (at === -1) continue;
    const name = declaration.slice(0, at).trim().toLowerCase();
    const value = declaration.slice(at + 1).trim();
    if (!name || !value || !/^-{0,2}[a-z][a-z0-9-]*$/.test(name)) continue;
    if (UNSAFE_VALUE.test(value)) continue;
    if (name === 'position' || name === 'behavior') continue;
    // Custom properties keep their name; everything else goes camelCase (`-webkit-x` → `WebkitX`).
    out[name.startsWith('--') ? name : name.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return out as CSSProperties;
}
