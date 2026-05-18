import type { RedactorConfig, Redactor } from './types.js';
import { compileRules, findMatches } from './detector.js';
import { shortHash } from './hash.js';
import { walkAndTransform } from './walk.js';

export function createRedactor(config: RedactorConfig): Redactor {
  const compiled = compileRules({
    rules: config.rules,
    defaultAction: config.defaultAction,
    allowEnvKeys: config.allowEnvKeys,
    minSecretLength: config.minSecretLength,
  });
  const placeholder = config.placeholder ?? '[REDACTED]';
  const hashOpts = config.hash ?? {};

  function applyAction(value: string, action: 'redact' | 'hash'): string {
    return action === 'hash' ? shortHash(value, hashOpts) : placeholder;
  }

  function scanString(input: string): string {
    if (!input) return input;
    const matches = findMatches(input, compiled);
    if (matches.length === 0) return input;
    let out = '';
    let cursor = 0;
    for (const m of matches) {
      out += input.slice(cursor, m.start);
      out += applyAction(m.value, m.action);
      cursor = m.end;
    }
    out += input.slice(cursor);
    return out;
  }

  function scanObject<T>(input: T): T {
    return walkAndTransform(input, scanString);
  }

  function scanHeaders(
    headers: Headers | Record<string, string | string[] | undefined>
  ): Headers | Record<string, string | string[] | undefined> {
    if (typeof Headers !== 'undefined' && headers instanceof Headers) {
      const out = new Headers();
      headers.forEach((v, k) => out.set(k, scanString(v)));
      return out;
    }
    const out: Record<string, string | string[] | undefined> = {};
    for (const [k, v] of Object.entries(headers)) {
      if (v == null) out[k] = v;
      else if (Array.isArray(v)) out[k] = v.map(scanString);
      else out[k] = scanString(v);
    }
    return out;
  }

  function scanError(err: unknown): { name: string; message: string; stack?: string } {
    if (err instanceof Error) {
      const result: { name: string; message: string; stack?: string } = {
        name: err.name,
        message: scanString(err.message),
      };
      if (err.stack) result.stack = scanString(err.stack);
      return result;
    }
    const message = typeof err === 'string' ? err : safeStringify(err);
    return { name: 'Error', message: scanString(message) };
  }

  return { scanString, scanObject, scanHeaders, scanError };
}

function safeStringify(v: unknown): string {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}
