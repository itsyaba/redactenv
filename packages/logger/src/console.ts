import type { Redactor } from '@redactenv/core';

const METHODS = ['log', 'info', 'warn', 'error', 'debug', 'trace'] as const;
type Method = typeof METHODS[number];

let active: { redactor: Redactor; originals: Partial<Record<Method, (...args: unknown[]) => void>> } | null = null;

export function patchConsole(redactor: Redactor): () => void {
  if (active) return unpatchConsole;
  const originals: Partial<Record<Method, (...args: unknown[]) => void>> = {};
  for (const m of METHODS) {
    const orig = (console as unknown as Record<Method, (...args: unknown[]) => void>)[m];
    if (typeof orig !== 'function') continue;
    originals[m] = orig.bind(console);
    (console as unknown as Record<Method, (...args: unknown[]) => void>)[m] = (...args: unknown[]) => {
      const scrubbed = args.map((a) => (typeof a === 'string' ? redactor.scanString(a) : redactor.scanObject(a)));
      originals[m]!(...scrubbed);
    };
  }
  active = { redactor, originals };
  return unpatchConsole;
}

export function unpatchConsole(): void {
  if (!active) return;
  for (const [m, fn] of Object.entries(active.originals)) {
    if (fn) (console as unknown as Record<string, unknown>)[m] = fn;
  }
  active = null;
}
