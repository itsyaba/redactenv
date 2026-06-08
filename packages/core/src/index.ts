export { createRedactor } from './redactor.js';
export type {
  Redactor,
  RedactorConfig,
  Rule,
  PatternRule,
  LiteralRule,
  EnvRule,
  Action,
  Confidence,
  HashConfig,
  MaskConfig,
  RedactionHit,
} from './types.js';
export { captureEnv } from './env-snapshot.js';
export { shortHash } from './hash.js';
export { maskValue } from './mask.js';
export { DEFAULT_ALLOW_ENV_KEYS, DEFAULT_MIN_SECRET_LENGTH } from './defaults.js';
