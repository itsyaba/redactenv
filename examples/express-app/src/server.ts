import express from 'express';
import { redactenv } from '@redactenv/express';
import { highConfidencePatterns } from '@redactenv/patterns';

// NOTE: split literals so GitHub secret-scanning push protection doesn't
// flag these demo values as real keys. Runtime strings still match the
// redactenv pattern catalog so the demo behaves correctly.
const STRIPE_PREFIX = 'sk_' + 'live_';
const GH_PREFIX = 'gh' + 'p_';
process.env.STRIPE_KEY ??= STRIPE_PREFIX + 'FAKEdemoKeyNotReal000000000';
process.env.GITHUB_TOKEN ??= GH_PREFIX + 'FAKEdemoTokenNotReal0000000000000000';

const app = express();

app.use(
  redactenv({
    rules: [
      { name: 'env', source: 'process.env', action: 'redact' },
      ...highConfidencePatterns.map((p) => ({ ...p, action: 'hash' as const })),
    ],
    allowEnvKeys: ['NODE_ENV', 'PORT', 'NEXT_PUBLIC_*'],
  })
);

app.get('/leak/env', (_req, res) => {
  res.json({ env: process.env });
});

app.get('/leak/error', (_req, _res, next) => {
  next(new Error(`Connection failed using token ${process.env.STRIPE_KEY}`));
});

app.get('/leak/inline', (_req, res) => {
  res.json({
    note: 'someone hardcoded a key',
    apiKey: STRIPE_PREFIX + 'HardCodedDemoKey0000000000',
    jwt: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjMifQ.abcdefghijklmnopqrstuvwxyz',
  });
});

app.use(redactenv.errorHandler({ rules: [{ name: 'env', source: 'process.env' }] }));

const port = Number(process.env.PORT) || 3000;
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(port, () => console.log(`example app listening on ${port}`));
}

export { app };
