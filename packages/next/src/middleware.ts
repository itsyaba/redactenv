import type { Redactor, RedactorConfig } from '@redactenv/core';
import { createRedactor } from '@redactenv/core';

export interface MiddlewareOptions extends RedactorConfig {
  redactor?: Redactor;
}

export function createMiddleware(opts: MiddlewareOptions = { rules: [] }) {
  const redactor = opts.redactor ?? createRedactor(opts);

  return async function redactMiddleware(_req: Request, next: () => Promise<Response>): Promise<Response> {
    const res = await next();
    const contentType = res.headers.get('content-type') ?? '';
    if (!/^(?:application\/(?:json|.*\+json)|text\/)/i.test(contentType)) return res;
    const text = await res.text();
    const scrubbed = redactor.scanString(text);
    const newHeaders = new Headers();
    res.headers.forEach((v, k) => newHeaders.set(k, redactor.scanString(v)));
    return new Response(scrubbed, { status: res.status, statusText: res.statusText, headers: newHeaders });
  };
}
