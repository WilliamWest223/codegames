import type { Level } from '@codegames/shared';
import { code } from '../../helpers';
import { lang } from '../../localize';
import { receipt } from './shared';

/** boss-1 levels, in play order. */
export const boss1Levels: Level[] = [
  {
    id: 'boss-1',
    conceptId: 'boss-1',
    title: 'Receipt Printer',
    role: 'boss',
    game: 'build-it',
    mode: 'freeform',
    prompt: `The shop needs a receipt printer! Read three lines: the **item name**, its **price** (may have decimals), and the **quantity**. Tax is **10%**. Orders with a subtotal of **20 or more** get free shipping. Print:\n\n\`\`\`\nItem: Potion\nSubtotal: $7.50\nTax: $0.75\nTotal: $8.25\nFree shipping: ${lang('False', 'false')}\n\`\`\`\n\nAll money must show 2 decimal places. A hidden test checks a different order.`,
    reinforces: ['input', 'type-conversion', 'operators', 'string-formatting', 'booleans', 'variables', 'output'],
    hints: [lang('Prices can have decimals, so use `float()` for the price.', 'Prices can have decimals; `Number()` handles them.'), 'Tax = subtotal × 0.1, total = subtotal + tax.', lang('Format money with `{value:.2f}`.', 'Format money with `value.toFixed(2)`.')],
    starterCode: code('# Read item, price, quantity\n', '// Read item, price, quantity\n'),
    solution: code(
      `
      item = input()
      price = float(input())
      qty = int(input())
      subtotal = price * qty
      tax = subtotal * 0.1
      print(f"Item: {item}")
      print(f"Subtotal: \${subtotal:.2f}")
      print(f"Tax: \${tax:.2f}")
      print(f"Total: \${subtotal + tax:.2f}")
      print(f"Free shipping: {subtotal >= 20}")
      `,
      `
      const item = prompt();
      const price = Number(prompt());
      const qty = Number(prompt());
      const subtotal = price * qty;
      const tax = subtotal * 0.1;
      console.log(\`Item: \${item}\`);
      console.log(\`Subtotal: $\${subtotal.toFixed(2)}\`);
      console.log(\`Tax: $\${tax.toFixed(2)}\`);
      console.log(\`Total: $\${(subtotal + tax).toFixed(2)}\`);
      console.log(\`Free shipping: \${subtotal >= 20}\`);
      `,
    ),
    tests: [
      { name: '3 potions', phase: '1 · First customer', input: 'Potion\n2.5\n3', expectedOutput: receipt('Item: Potion\nSubtotal: $7.50\nTax: $0.75\nTotal: $8.25', false) },
      { name: '2 swords', phase: '2 · Big spender', input: 'Sword\n12\n2', expectedOutput: receipt('Item: Sword\nSubtotal: $24.00\nTax: $2.40\nTotal: $26.40', true) },
      { name: 'exactly 20', phase: '3 · The edge case', input: 'Map\n5\n4', expectedOutput: receipt('Item: Map\nSubtotal: $20.00\nTax: $2.00\nTotal: $22.00', true), hidden: true },
      { name: 'hidden order', phase: '3 · The edge case', input: 'Shield\n7.25\n2', expectedOutput: receipt('Item: Shield\nSubtotal: $14.50\nTax: $1.45\nTotal: $15.95', false), hidden: true },
    ],
    takeaway: 'A real program: input, conversion, math, formatting and a boolean, all working together. This is the shape of most programs: read, compute, report.',
  },
];
