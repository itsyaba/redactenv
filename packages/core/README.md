# @redactenv/core

Detection + redaction engine. Zero deps. Framework-agnostic.

```bash
npm install @redactenv/core
```

## API

```ts
import { createRedactor } from '@redactenv/core';

const r = createRedactor({
  rules: [
    { name: 'env',    source: 'process.env',                 action: 'redact' },
    { name: 'stripe', pattern: /sk_live_[A-Za-z0-9]{24,}/g,  action: 'hash'   },
    { name: 'custom', values: ['my-internal-token'],         action: 'redact' },
  ],
  allowEnvKeys: ['NODE_ENV', 'PORT', 'NEXT_PUBLIC_*'],
  placeholder: '[REDACTED]',
  hash: { length: 8, prefix: '[REDACTED:', suffix: ']' },
});

r.scanString('token=sk_live_abc...');     // → 'token=[REDACTED:a3f8b1c2]'
r.scanObject({ key: 'sk_live_abc...' });  // → { key: '[REDACTED:...]' }
r.scanHeaders(headers);                   // Headers or plain object
r.scanError(err);                         // { name, message, stack? }
```

## Config

| Field | Default | Notes |
|---|---|---|
| `rules` | required | Mix of env / pattern / literal rules |
| `defaultAction` | `'redact'` | Used when rule omits `action` |
| `allowEnvKeys` | `[]` | Glob (`*`) supported. Skipped during env capture |
| `placeholder` | `'[REDACTED]'` | Replacement for `redact` action |
| `minSecretLength` | `8` | Env values shorter than this ignored |
| `hash.length` | `8` | Hex chars of SHA-256 prefix |
| `hash.prefix` / `hash.suffix` | `'[REDACTED:'` / `']'` | Wrap hash |

## Rule kinds

```ts
// Env snapshot: captures process.env at compile-time
{ name: 'env',    source: 'process.env', action?: 'redact'|'hash', minLength?: number }

// Regex pattern (must be /g or will be made global)
{ name: 'stripe', pattern: /sk_live_[A-Za-z0-9]{24,}/g, action?: 'redact'|'hash' }

// Literal value list
{ name: 'custom', values: ['exact-string'], action?: 'redact'|'hash' }
```

## Behavior

- Literal matches resolved longest-first so substrings don't preempt.
- Overlapping matches collapse — first match wins, rest dropped.
- Object walker handles arrays, Maps, Sets, cycles. Skips Date / RegExp.
- Hash cached up to 10K entries per process.

License: MIT
