import type { Redactor, RedactorConfig } from '@redactenv/core';
import { createRedactor } from '@redactenv/core';

export interface InstallOptions extends RedactorConfig {
  redactor?: Redactor;
  redactHeaders?: boolean;
  redactBody?: boolean;
  contentTypes?: RegExp;
}

let installed: { redactor: Redactor; uninstall: () => void } | null = null;

const DEFAULT_TEXT_CT = /^(?:application\/(?:json|.*\+json|xml|.*\+xml|graphql|x-www-form-urlencoded)|text\/|image\/svg\+xml)/i;

export function installNext(opts: InstallOptions = { rules: [] }): { redactor: Redactor; uninstall: () => void } {
  if (installed) return installed;
  const redactor = opts.redactor ?? createRedactor(opts);
  const redactHeaders = opts.redactHeaders ?? true;
  const redactBody = opts.redactBody ?? true;
  const ctRe = opts.contentTypes ?? DEFAULT_TEXT_CT;

  const OriginalResponse = globalThis.Response;
  if (typeof OriginalResponse !== 'function') {
    installed = { redactor, uninstall: () => {} };
    return installed;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const Patched: any = function PatchedResponse(this: unknown, body?: BodyInit | null, init?: ResponseInit) {
    const contentType = readHeader(init?.headers, 'content-type') ?? '';
    const shouldRedactBody = redactBody && isTextContent(contentType, ctRe);
    const newBody = shouldRedactBody ? redactBodyInit(body, redactor) : body;
    const newInit: ResponseInit | undefined = redactHeaders && init?.headers ? { ...init, headers: redactHeadersInit(init.headers, redactor) } : init;
    return Reflect.construct(OriginalResponse, [newBody, newInit], Patched);
  };
  Patched.prototype = OriginalResponse.prototype;
  Object.setPrototypeOf(Patched, OriginalResponse);
  Patched.json = (data: unknown, init?: ResponseInit) => {
    const scrubbed = redactor.scanObject(data);
    return Reflect.construct(OriginalResponse, [JSON.stringify(scrubbed), {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers as Record<string, string> | undefined) },
    }], Patched);
  };
  Patched.error = OriginalResponse.error.bind(OriginalResponse);
  Patched.redirect = OriginalResponse.redirect.bind(OriginalResponse);

  globalThis.Response = Patched;

  installed = {
    redactor,
    uninstall: () => {
      globalThis.Response = OriginalResponse;
      installed = null;
    },
  };
  return installed;
}

function isTextContent(ct: string, re: RegExp): boolean {
  return !ct || re.test(ct);
}

function readHeader(h: HeadersInit | undefined, name: string): string | undefined {
  if (!h) return undefined;
  if (h instanceof Headers) return h.get(name) ?? undefined;
  if (Array.isArray(h)) {
    for (const [k, v] of h) if (k.toLowerCase() === name.toLowerCase()) return v;
    return undefined;
  }
  for (const [k, v] of Object.entries(h)) if (k.toLowerCase() === name.toLowerCase()) return v as string;
  return undefined;
}

function redactBodyInit(body: BodyInit | null | undefined, redactor: Redactor): BodyInit | null | undefined {
  if (body == null) return body;
  if (typeof body === 'string') return redactor.scanString(body);
  return body; // streams/buffers: scanning handled by route or future stream-transform
}

function redactHeadersInit(h: HeadersInit, redactor: Redactor): HeadersInit {
  if (h instanceof Headers) {
    const out = new Headers();
    h.forEach((v, k) => out.set(k, redactor.scanString(v)));
    return out;
  }
  if (Array.isArray(h)) return h.map(([k, v]) => [k, redactor.scanString(v)]);
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(h)) out[k] = redactor.scanString(v as string);
  return out;
}

export { createRedactor } from '@redactenv/core';
