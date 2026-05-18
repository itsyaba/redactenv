import { describe, it, expect } from 'vitest';
import { captureEnv } from '../src/env-snapshot.js';

describe('captureEnv', () => {
  it('skips short values', () => {
    const out = captureEnv({ PORT: '3000', SECRET: 'sk_live_abcdefghij' });
    expect(out.map((e) => e.key)).toEqual(['SECRET']);
  });

  it('honors allowlist with glob', () => {
    const out = captureEnv(
      {
        NEXT_PUBLIC_FOO: 'public-value-1',
        NODE_ENV: 'production-mode',
        SECRET_KEY: 'sk_live_abcdefghij',
      },
      { allowKeys: ['NEXT_PUBLIC_*', 'NODE_ENV'] }
    );
    expect(out.map((e) => e.key)).toEqual(['SECRET_KEY']);
  });

  it('sorts by length desc', () => {
    const out = captureEnv({ A: 'short_value_abc', B: 'much_longer_secret_value_xyz' });
    expect(out[0]?.key).toBe('B');
  });
});
