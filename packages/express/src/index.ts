import type { Redactor, RedactorConfig } from '@redactenv/core';
import { createRedactor } from '@redactenv/core';

type ExpressLike = {
  send?: (body: unknown) => unknown;
  json?: (body: unknown) => unknown;
  write?: (chunk: unknown, ...rest: unknown[]) => boolean;
  end?: (chunk?: unknown, ...rest: unknown[]) => unknown;
  setHeader?: (name: string, value: number | string | readonly string[]) => unknown;
  getHeader?: (name: string) => unknown;
  getHeaderNames?: () => string[];
};

type ReqHandler = (req: unknown, res: ExpressLike, next: (err?: unknown) => void) => void;
type ErrHandler = (err: unknown, req: unknown, res: ExpressLike, next: (err?: unknown) => void) => void;

export interface ExpressOptions extends RedactorConfig {
  redactHeaders?: boolean;
  redactBody?: boolean;
}

export function redactenv(opts: ExpressOptions | { redactor: Redactor; redactHeaders?: boolean; redactBody?: boolean }): ReqHandler {
  const { redactor, redactHeaders, redactBody } = resolve(opts);

  return function redactenvMiddleware(_req, res, next) {
    if (redactHeaders) wrapHeaders(res, redactor);
    if (redactBody) wrapBody(res, redactor);
    next();
  };
}

redactenv.errorHandler = function errorHandler(
  opts: ExpressOptions | { redactor: Redactor }
): ErrHandler {
  const { redactor } = resolve(opts);
  return function redactenvErrorHandler(err, _req, res, _next) {
    const scrubbed = redactor.scanError(err);
    const status = (err as { status?: number; statusCode?: number })?.status ??
      (err as { statusCode?: number })?.statusCode ?? 500;
    const r = res as ExpressLike & { status?: (n: number) => unknown };
    if (typeof r.status === 'function') r.status(status);
    if (typeof r.json === 'function') {
      r.json({ error: scrubbed.name, message: scrubbed.message });
      return;
    }
    if (typeof r.end === 'function') r.end(JSON.stringify(scrubbed));
  };
};

function resolve(opts: ExpressOptions | { redactor: Redactor; redactHeaders?: boolean; redactBody?: boolean }): {
  redactor: Redactor;
  redactHeaders: boolean;
  redactBody: boolean;
} {
  const redactor = 'redactor' in opts && opts.redactor
    ? opts.redactor
    : createRedactor(opts as RedactorConfig);
  return {
    redactor,
    redactHeaders: (opts as ExpressOptions).redactHeaders ?? true,
    redactBody: (opts as ExpressOptions).redactBody ?? true,
  };
}

function wrapBody(res: ExpressLike, redactor: Redactor) {
  if (typeof res.json === 'function') {
    const orig = res.json.bind(res);
    res.json = (body: unknown) => orig(redactor.scanObject(body));
  }
  if (typeof res.send === 'function') {
    const orig = res.send.bind(res);
    res.send = (body: unknown) => {
      if (typeof body === 'string') return orig(redactor.scanString(body));
      if (Buffer.isBuffer(body)) return orig(body);
      if (body && typeof body === 'object') return orig(redactor.scanObject(body));
      return orig(body);
    };
  }
  if (typeof res.end === 'function') {
    const orig = res.end.bind(res);
    res.end = (chunk?: unknown, ...rest: unknown[]) => {
      if (typeof chunk === 'string') return orig(redactor.scanString(chunk), ...rest);
      return orig(chunk, ...rest);
    };
  }
}

function wrapHeaders(res: ExpressLike, redactor: Redactor) {
  if (typeof res.setHeader !== 'function') return;
  const orig = res.setHeader.bind(res);
  res.setHeader = (name: string, value: number | string | readonly string[]) => {
    if (typeof value === 'string') return orig(name, redactor.scanString(value));
    if (Array.isArray(value)) return orig(name, value.map((v) => redactor.scanString(v)));
    return orig(name, value);
  };
}

export { createRedactor } from '@redactenv/core';
