import { describe, it, expect } from 'vitest';
import { shortHash } from '../src/hash.js';

describe('shortHash', () => {
  it('is deterministic', () => {
    expect(shortHash('sk_live_abc')).toBe(shortHash('sk_live_abc'));
  });

  it('honors prefix/suffix/length', () => {
    const out = shortHash('value', { prefix: '<', suffix: '>', length: 4 });
    expect(out).toMatch(/^<[0-9a-f]{4}>$/);
  });

  it('differs between values', () => {
    expect(shortHash('a')).not.toBe(shortHash('b'));
  });
});
