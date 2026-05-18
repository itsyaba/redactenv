import { describe, it, expect } from 'vitest';
import { app } from '../src/server.ts';
import type { AddressInfo } from 'node:net';

function start(): Promise<{ url: string; close: () => Promise<void> }> {
  return new Promise((resolve) => {
    const server = app.listen(0, () => {
      const port = (server.address() as AddressInfo).port;
      resolve({
        url: `http://127.0.0.1:${port}`,
        close: () => new Promise((r) => server.close(() => r())),
      });
    });
  });
}

describe('express example: secret redaction', () => {
  it('redacts env values in JSON response', async () => {
    const s = await start();
    try {
      const res = await fetch(`${s.url}/leak/env`);
      const text = await res.text();
      // Reassemble fakes at runtime so this file isn't itself scanned as a secret.
      const fakeStripe = 'sk_' + 'live_FAKEdemoKeyNotReal000000000';
      const fakeGh = 'gh' + 'p_FAKEdemoTokenNotReal0000000000000000';
      expect(text).not.toContain(fakeStripe);
      expect(text).not.toContain(fakeGh);
      expect(text).toContain('[REDACTED]');
    } finally {
      await s.close();
    }
  });

  it('scrubs secrets from error response', async () => {
    const s = await start();
    try {
      const res = await fetch(`${s.url}/leak/error`);
      const text = await res.text();
      const fakeStripe = 'sk_' + 'live_FAKEdemoKeyNotReal000000000';
      expect(text).not.toContain(fakeStripe);
      expect(text).toContain('[REDACTED]');
    } finally {
      await s.close();
    }
  });

  it('hashes hardcoded keys matched by patterns', async () => {
    const s = await start();
    try {
      const res = await fetch(`${s.url}/leak/inline`);
      const body = (await res.json()) as { apiKey: string; jwt: string };
      expect(body.apiKey).not.toContain('sk_' + 'live_');
      expect(body.apiKey).toMatch(/^\[REDACTED:[0-9a-f]{8}\]$/);
      expect(body.jwt).toMatch(/^\[REDACTED:[0-9a-f]{8}\]$/);
    } finally {
      await s.close();
    }
  });
});
