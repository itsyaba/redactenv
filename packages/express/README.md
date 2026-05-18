# @redactenv/express

Express / Connect middleware. Wraps `res.send`, `res.json`, `res.end`, `res.setHeader`. Plus error handler that scrubs stack traces.

```bash
npm install @redactenv/express @redactenv/core
```

## Usage

```ts
import express from 'express';
import { redactenv } from '@redactenv/express';
import { highConfidencePatterns } from '@redactenv/patterns';

const app = express();

app.use(redactenv({
  rules: [
    { name: 'env', source: 'process.env', action: 'redact' },
    ...highConfidencePatterns.map(p => ({ ...p, action: 'hash' as const })),
  ],
  allowEnvKeys: ['NODE_ENV', 'PORT'],
}));

// ... routes here ...

// Error handler MUST be registered last
app.use(redactenv.errorHandler({
  rules: [{ name: 'env', source: 'process.env' }],
}));
```

## Options

Extends `RedactorConfig` from `@redactenv/core` plus:

| Field | Default | Notes |
|---|---|---|
| `redactHeaders` | `true` | Wrap `res.setHeader` |
| `redactBody` | `true` | Wrap `res.send` / `res.json` / `res.end` |

## Reuse a redactor

```ts
import { createRedactor } from '@redactenv/core';

const redactor = createRedactor({ rules: [...] });
app.use(redactenv({ redactor }));
app.use(redactenv.errorHandler({ redactor }));
```

## What gets scrubbed

- `res.json(obj)` — deep-walked, every string scanned
- `res.send(string)` — scanned. Buffer / stream passes through
- `res.send(obj)` — same as `json`
- `res.end(chunk)` — scanned if string
- `res.setHeader(name, value)` — string + array values scanned
- Errors via `redactenv.errorHandler` — `name`, `message`, `stack` all scrubbed

## Caveats

- Streaming responses (`res.write`) NOT chunk-scanned in 0.1.x. Pre-scan content before writing.
- Buffer bodies skip scanning (assumed binary).

License: MIT
