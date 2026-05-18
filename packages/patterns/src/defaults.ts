import {
  createRedactor,
  captureEnv,
  DEFAULT_ALLOW_ENV_KEYS,
  DEFAULT_MIN_SECRET_LENGTH,
  type Redactor,
  type RedactorConfig,
  type Rule,
} from '@redactenv/core';
import { highConfidencePatterns } from './index.js';

export interface DefaultRedactorOverrides
  extends Partial<Omit<RedactorConfig, 'rules'>> {
  extraRules?: Rule[];
  extraAllowEnvKeys?: string[];
  banner?: boolean;
  bannerLogger?: (msg: string) => void;
}

export interface DefaultRedactorResult {
  redactor: Redactor;
  envCount: number;
  patternCount: number;
}

/**
 * Zero-config redactor: env snapshot (with sensible allowlist) + high-
 * confidence pattern catalog. Pattern matches default to `hash`, env
 * matches default to `redact`.
 */
export function createDefaultRedactor(
  overrides: DefaultRedactorOverrides = {}
): DefaultRedactorResult {
  const allowEnvKeys = [
    ...DEFAULT_ALLOW_ENV_KEYS,
    ...(overrides.extraAllowEnvKeys ?? []),
    ...(overrides.allowEnvKeys ?? []),
  ];
  const minSecretLength = overrides.minSecretLength ?? DEFAULT_MIN_SECRET_LENGTH;

  const envEntries = captureEnv(undefined, {
    allowKeys: allowEnvKeys,
    minLength: minSecretLength,
  });

  const rules: Rule[] = [
    { name: 'env', source: 'process.env', action: 'redact' },
    ...highConfidencePatterns.map((p) => ({ ...p, action: 'hash' as const })),
    ...(overrides.extraRules ?? []),
  ];

  const redactor = createRedactor({
    rules,
    allowEnvKeys,
    minSecretLength,
    defaultAction: overrides.defaultAction,
    placeholder: overrides.placeholder,
    hash: overrides.hash,
  });

  const result: DefaultRedactorResult = {
    redactor,
    envCount: envEntries.length,
    patternCount: highConfidencePatterns.length,
  };

  if (overrides.banner !== false) {
    const log = overrides.bannerLogger ?? defaultBannerLogger;
    log(formatBanner(result));
  }

  return result;
}

function formatBanner(r: DefaultRedactorResult): string {
  return `redactenv: monitoring ${r.envCount} env value${r.envCount === 1 ? '' : 's'} + ${r.patternCount} pattern${r.patternCount === 1 ? '' : 's'}`;
}

const ESC = String.fromCharCode(27);
const CYAN = `${ESC}[36m`;
const RESET = `${ESC}[0m`;

function defaultBannerLogger(msg: string): void {
  const isTTY =
    typeof process !== 'undefined' &&
    !!process.stderr &&
    (process.stderr as { isTTY?: boolean }).isTTY === true;
  const out = isTTY ? `${CYAN}${msg}${RESET}` : msg;
  // eslint-disable-next-line no-console
  console.info(out);
}
