# @redactenv/next

Next.js adapter. Two entry points: global `Response` patcher (via `instrumentation.ts`) and a middleware helper.

```bash
npm install @redactenv/next @redactenv/core
```

## Option 1: instrumentation hook (recommended)

Patches the global `Response` constructor at boot. Every `Response` and `Response.json()` returned from a route handler or page is scanned.

```ts
// instrumentation.ts (project root or src/)
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

Enable instrumentation in `next.config.js`:

```js
module.exports = { experimental: { instrumentationHook: true } };
```

(Next 15+: no flag needed.)

## Option 2: middleware helper

For per-route or middleware.ts use:

```ts
// middleware.ts
import { createMiddleware } from '@redactenv/next/middleware';

const redact = createMiddleware({
  rules: [{ name: 'env', source: 'process.env' }],
});

export async function middleware(req: Request) {
  return redact(req, async () => fetch(req));
}
```

## Options

```ts
interface InstallOptions extends RedactorConfig {
  redactor?: Redactor;          // reuse existing redactor
  redactHeaders?: boolean;      // default true
  redactBody?: boolean;         // default true
  contentTypes?: RegExp;        // which content-types to scan; default JSON/text/XML/SVG
}
```

## Caveats

- Edge runtime: current build uses `node:crypto`. For Edge, instantiate redactor without env rule, or wait for Edge variant in 0.2.
- Streams: `installNext` scans string `BodyInit` only. ReadableStream bodies pass through unchanged in 0.1.x.
- `Response.error()` / `Response.redirect()` pass through (no body).

License: MIT
