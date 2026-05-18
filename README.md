# redactenv

> Defense-in-depth secret redaction for Node.js servers.

Drop it into Express, Next.js, or your logging pipeline. It scrubs API keys, JWTs, and `process.env` values out of outgoing responses, error pages, headers, and logs — **before they leave your process**.

**Motivation.** CVEs like the Next.js middleware bypass (CVE-2025-29927) let attackers reach internal routes and exfiltrate environment variables. Firewalls and WAFs don't help once the attacker is inside. `redactenv` is the last layer: even if everything else fails, your `STRIPE_KEY` doesn't make it onto the wire.

> Status: **0.1.0 — alpha.** API may change.

---

## Contents

- [Packages](#packages)
- [Install](#install)
- [Quick start — Express](#quick-start--express)
- [Quick start — Next.js](#quick-start--nextjs)
- [Quick start — logging](#quick-start--logging)
- [Config reference](#config-reference)
- [Redact vs hash](#redact-vs-hash)
- [Threat model](#threat-model)
- [Performance](#performance)
- [Development](#development)
- [License](#license)

---

## Packages

| Package | Purpose | README |
|---|---|---|
| `@redactenv/core` | Detection + redaction engine. Zero deps. Framework-agnostic. | [docs](./packages/core/README.md) |
| `@redactenv/patterns` | Curated regex catalog (AWS, Stripe, GitHub, OpenAI, Anthropic, JWT, …). | [docs](./packages/patterns/README.md) |
| `@redactenv/express` | Express/Connect middleware + error handler. | [docs](./packages/express/README.md) |
| `@redactenv/next` | Next.js Response patcher + middleware helper. | [docs](./packages/next/README.md) |
| `@redactenv/logger` | `console` patcher + pino transform. | [docs](./packages/logger/README.md) |

---

## Install

Pick the adapter for your framework. Core comes along for the ride.

```bash
# Express
npm install @redactenv/express @redactenv/patterns

# Next.js
npm install @redactenv/next @redactenv/patterns

# logging only
npm install @redactenv/logger @redactenv/patterns
```

---

## Quick start — Express

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
  allowEnvKeys: ['NODE_ENV', 'PORT', 'NEXT_PUBLIC_*'],
}));

app.get('/oops', (_req, res) => res.json({ leaked: process.env }));

// Last middleware: scrubs error stack traces
app.use(redactenv.errorHandler({
  rules: [{ name: 'env', source: 'process.env' }],
}));
```

`/oops` returns env values replaced with `[REDACTED]`. Hardcoded `sk_live_…`, `ghp_…`, JWTs etc. become stable hash tags like `[REDACTED:a3f8b1c2]`.

Full per-package docs: [`packages/express`](./packages/express/README.md).

---

## Quick start — Next.js

`instrumentation.ts` at the project root:

```ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { installNext } = await import('@redactenv/next');
    const { highConfidencePatterns } = await import('@redactenv/patterns');

    installNext({
      rules: [
        { name: 'env', source: 'process.env', action: 'redact' },
        ...highConfidencePatterns.map(p => ({ ...p, action: 'hash' as const })),
      ],
      allowEnvKeys: ['NEXT_PUBLIC_*', 'NODE_ENV'],
    });
  }
}
```

Patches the global `Response` constructor so every JSON / text response is scanned before serialization. Per-package docs: [`packages/next`](./packages/next/README.md).

---

## Quick start — logging

```ts
import { createRedactor } from '@redactenv/core';
import { patchConsole } from '@redactenv/logger/console';

const r = createRedactor({ rules: [{ name: 'env', source: 'process.env' }] });
patchConsole(r);

console.log('token =', process.env.STRIPE_KEY);  // → token = [REDACTED]
```

Pino integration: [`packages/logger`](./packages/logger/README.md).

---

## Config reference

```ts
interface RedactorConfig {
  rules: Rule[];
  defaultAction?: 'redact' | 'hash';   // default 'redact'
  allowEnvKeys?: string[];             // supports * wildcards
  placeholder?: string;                // default '[REDACTED]'
  minSecretLength?: number;            // default 8
  hash?: {
    algo?: 'sha256';
    length?: number;                   // default 8 hex chars
    prefix?: string;                   // default '[REDACTED:'
    suffix?: string;                   // default ']'
  };
}

type Rule =
  | { name: string; source: 'process.env'; action?: Action; minLength?: number }
  | { name: string; pattern: RegExp;       action?: Action }
  | { name: string; values: string[];      action?: Action };
```

---

## Redact vs hash

| Action | Output | When to use |
|---|---|---|
| `redact` | `[REDACTED]` | Zero info leak. Default. |
| `hash` | `[REDACTED:a3f8b1c2]` | Same value → same tag. Lets ops correlate occurrences without exposing the secret. |

Set per-rule with `action`, or default for all rules via `defaultAction`.

---

## Threat model

### Mitigates

- Env exfiltration via response leaks (CVE-style auth bypass, debug endpoints, error pages).
- Accidental secret echo in JSON responses, logs, stack traces.
- Stale tokens left in error messages.
- Headers like `Authorization` or `Set-Cookie` echoed in responses.

### Does NOT mitigate

- **Arbitrary RCE.** Attacker can read your `.env` file directly.
- **Encoded secrets.** Base64-encoded or character-split secrets don't match literal / regex rules.
- **Out-of-band exfiltration.** DB dumps, file uploads, third-party SDK calls.
- **Custom secret formats** unknown to the pattern library. Add user-defined `values` / `pattern` rules.

This is defense-in-depth. **Not a substitute** for least-privilege secret access, network segmentation, or timely CVE patching.

---

## Performance

Scanning adds latency proportional to response body size. Rough numbers (single core, M-class CPU):

| Body size | Overhead |
|---|---|
| 1 KB | < 0.1 ms |
| 10 KB | ~ 0.5 ms |
| 100 KB | ~ 5 ms |
| 1 MB | ~ 50 ms |

Bypass for binary / streaming / high-throughput routes by gating the middleware on path or content-type.

Future: Aho-Corasick multi-pattern matcher when literal rule count grows past ~50.

---

## Development

```bash
npm install
npm run build    # tsc per package
npm test         # vitest across workspaces
```

Monorepo uses npm workspaces. Each package builds with `tsc` to its own `dist/`. Tests via vitest.

### Repository layout

```
packages/
  core/        engine
  patterns/    regex catalog
  express/     express adapter
  next/        next adapter
  logger/      console + pino
examples/
  express-app/ runnable demo with leak routes + integration tests
```

### Contributing

Issues and PRs welcome. Before opening a PR:

1. `npm test` passes (16 tests at 0.1.0).
2. New rule? Add to `@redactenv/patterns` with `confidence: 'high'` only if false-positive rate is negligible.
3. New adapter? Wrap a `Redactor` from `@redactenv/core` — never re-implement detection logic.

---

## License

MIT
