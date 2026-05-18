# @redactenv/logger

Logger adapters. `console` patcher + `pino` helpers.

```bash
npm install @redactenv/logger @redactenv/core
```

## console patcher

Replaces `console.log/info/warn/error/debug/trace`. Strings scanned. Objects deep-walked.

```ts
import { createRedactor } from '@redactenv/core';
import { patchConsole, unpatchConsole } from '@redactenv/logger/console';

const r = createRedactor({ rules: [{ name: 'env', source: 'process.env' }] });
patchConsole(r);

console.log('token', process.env.STRIPE_KEY);
// stdout: token [REDACTED]

// later, for tests:
unpatchConsole();
```

Opt-in only. Patches at point of call, not at import.

## pino integration

Two helpers:

### `createPinoRedactor` — `redact.censor` function

```ts
import pino from 'pino';
import { createRedactor } from '@redactenv/core';
import { createPinoRedactor } from '@redactenv/logger/pino';

const r = createRedactor({ rules: [...] });
const { censor } = createPinoRedactor(r);

const logger = pino({
  redact: { paths: ['*'], censor },
});
```

### `createPinoTransform` — newline-delimited JSON transform

For use in a transport / stream sink:

```ts
import { createPinoTransform } from '@redactenv/logger/pino';

const transform = createPinoTransform(redactor);
// pipe pino output through transform before writing to file / network
```

License: MIT
