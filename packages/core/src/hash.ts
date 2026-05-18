import { createHash } from 'node:crypto';

export interface HashOptions {
  algo?: 'sha256';
  length?: number;
  prefix?: string;
  suffix?: string;
}

const cache = new Map<string, string>();

export function shortHash(input: string, opts: HashOptions = {}): string {
  const length = opts.length ?? 8;
  const prefix = opts.prefix ?? '[REDACTED:';
  const suffix = opts.suffix ?? ']';
  const cacheKey = `${length}|${input}`;
  let hex = cache.get(cacheKey);
  if (!hex) {
    hex = createHash('sha256').update(input).digest('hex').slice(0, length);
    if (cache.size > 10_000) cache.clear();
    cache.set(cacheKey, hex);
  }
  return `${prefix}${hex}${suffix}`;
}
