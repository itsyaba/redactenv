import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createDefaultRedactor } from '../src/defaults.js';

describe('createDefaultRedactor', () => {
  const originalEnv = process.env;
  let logs: string[];
  const logger = (m: string) => { logs.push(m); };

  beforeEach(() => {
    logs = [];
    // Replace with empty env to keep snapshot deterministic across tests.
    process.env = {} as NodeJS.ProcessEnv;
  });
  afterEach(() => {
    process.env = originalEnv;
  });

  it('skips common non-secret env keys via default allowlist', () => {
    process.env.NODE_ENV = 'production';
    process.env.PORT = '3000';
    process.env.LOG_LEVEL = 'debug-trace';
    process.env.NEXT_PUBLIC_API_URL = 'https://api.example.com';

    const { redactor, envCount } = createDefaultRedactor({ bannerLogger: logger });
    expect(envCount).toBe(0);
    expect(redactor.scanString('env=production port=3000 url=https://api.example.com')).toBe(
      'env=production port=3000 url=https://api.example.com'
    );
  });

  it('redacts real-looking env values', () => {
    process.env.MY_SECRET = 'super-secret-value-shhh';
    const { redactor, envCount } = createDefaultRedactor({ bannerLogger: logger });
    expect(envCount).toBe(1);
    expect(redactor.scanString('token=super-secret-value-shhh')).toBe('token=[REDACTED]');
  });

  it('hashes high-confidence pattern matches', () => {
    const { redactor } = createDefaultRedactor({ bannerLogger: logger });
    const fake = 'sk_' + 'live_HardCodedDemoKey0000000000';
    expect(redactor.scanString(fake)).toMatch(/^\[REDACTED:[0-9a-f]{8}\]$/);
  });

  it('skips short env values below DEFAULT_MIN_SECRET_LENGTH', () => {
    process.env.MY_FLAG = 'on';
    process.env.MY_TINY = 'abc';
    const { envCount } = createDefaultRedactor({ bannerLogger: logger });
    expect(envCount).toBe(0);
  });

  it('emits boot banner with env + pattern counts', () => {
    process.env.MY_SECRET = 'super-secret-value-shhh';
    createDefaultRedactor({ bannerLogger: logger });
    expect(logs[0]).toMatch(/^redactenv: monitoring 1 env value \+ \d+ patterns$/);
  });

  it('suppresses banner when banner:false', () => {
    const spy = vi.spyOn(console, 'info').mockImplementation(() => {});
    try {
      createDefaultRedactor({ banner: false });
      expect(spy).not.toHaveBeenCalled();
    } finally {
      spy.mockRestore();
    }
  });

  it('honors extraAllowEnvKeys', () => {
    process.env.MY_NON_SECRET_CONFIG = 'value-that-looks-secret-but-isnt';
    const { envCount } = createDefaultRedactor({
      extraAllowEnvKeys: ['MY_NON_SECRET_CONFIG'],
      bannerLogger: logger,
    });
    expect(envCount).toBe(0);
  });

  it('merges extraRules', () => {
    const { redactor } = createDefaultRedactor({
      extraRules: [{ name: 'custom', values: ['internal-marker-token'] }],
      bannerLogger: logger,
    });
    expect(redactor.scanString('see internal-marker-token here')).toBe('see [REDACTED] here');
  });
});
