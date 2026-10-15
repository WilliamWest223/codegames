import type { LangCode } from '@codegames/shared';
import { code } from '../../helpers';

/** Join code parts with a blank line between them (each part already dedented). */
export function compose(...parts: LangCode[]): LangCode {
  const join = (lang: 'python' | 'javascript') => parts.map((p) => (p[lang] ?? '').trimEnd()).join('\n\n') + '\n';
  return { python: join('python'), javascript: join('javascript') };
}

/** The four heroes sorted in higher-order-functions-2 and -4. */
export const PARTY = code(
  `
  party = [
      {"name": "Ada", "hp": 12},
      {"name": "Bo", "hp": 30},
      {"name": "Cy", "hp": 7},
      {"name": "Di", "hp": 21},
  ]
  `,
  `
  const party = [
    { name: "Ada", hp: 12 },
    { name: "Bo", hp: 30 },
    { name: "Cy", hp: 7 },
    { name: "Di", hp: 21 },
  ];
  `,
);
