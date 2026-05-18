import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createRedactor } from '../src/redactor.js';

// Build fake Stripe-format string at runtime so GitHub secret scanning
// doesn't flag this file. Pattern is real; literal source bytes are not.
const FAKE_STRIPE = 'sk_' + 'live_' + 'abcdefghijklmnopqrstuvwx';
const FAKE_GH = 'gh' + 'p_' + 'abcdefghijklmnopqrstuvwxyz123';

describe('createRedactor', () => {
  const originalEnv = { ...process.env };
  beforeEach(() => {
    process.env.SECRET_KEY = FAKE_STRIPE;
    process.env.PUBLIC_THING = 'public_value_ok';
  });
  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('redacts env values in strings', () => {
    const r = createRedactor({
      rules: [{ name: 'env', source: 'process.env' }],
      allowEnvKeys: ['PUBLIC_*'],
    });
    const out = r.scanString(`token=${FAKE_STRIPE} end`);
    expect(out).toBe('token=[REDACTED] end');
  });

  it('hashes when action=hash', () => {
    const r = createRedactor({
      rules: [{ name: 'env', source: 'process.env', action: 'hash' }],
    });
    const out = r.scanString(FAKE_STRIPE);
    expect(out).toMatch(/^\[REDACTED:[0-9a-f]{8}\]$/);
  });

  it('redacts in nested objects', () => {
    const r = createRedactor({
      rules: [{ name: 'env', source: 'process.env' }],
    });
    const out = r.scanObject({ user: { token: FAKE_STRIPE }, list: ['plain', FAKE_STRIPE] });
    expect(out.user.token).toBe('[REDACTED]');
    expect(out.list[1]).toBe('[REDACTED]');
    expect(out.list[0]).toBe('plain');
  });

  it('redacts regex patterns', () => {
    const r = createRedactor({
      rules: [{ name: 'gh', pattern: /ghp_[A-Za-z0-9]{20,}/g }],
    });
    expect(r.scanString(`here: ${FAKE_GH}`)).toBe('here: [REDACTED]');
  });

  it('scrubs errors', () => {
    const r = createRedactor({
      rules: [{ name: 'env', source: 'process.env' }],
    });
    const err = new Error(`Failed with token ${FAKE_STRIPE} in call`);
    const out = r.scanError(err);
    expect(out.message).not.toContain(FAKE_STRIPE);
    expect(out.message).toContain('[REDACTED]');
  });

  it('handles cycles without infinite loop', () => {
    const r = createRedactor({
      rules: [{ name: 'env', source: 'process.env' }],
    });
    const a: Record<string, unknown> = { token: FAKE_STRIPE };
    a.self = a;
    const out = r.scanObject(a) as Record<string, unknown>;
    expect(out.token).toBe('[REDACTED]');
  });

  it('handles overlapping matches by taking first/longest', () => {
    const r = createRedactor({
      rules: [
        { name: 'long', values: ['abcdefghij'] },
        { name: 'short', values: ['cdefghi__'] },
      ],
      minSecretLength: 5,
    });
    expect(r.scanString('xx abcdefghij yy')).toBe('xx [REDACTED] yy');
  });
});
