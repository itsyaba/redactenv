export type Action = 'redact' | 'hash';

export type Confidence = 'high' | 'medium';

export interface BaseRule {
  name: string;
  action?: Action;
  confidence?: Confidence;
}

export interface PatternRule extends BaseRule {
  pattern: RegExp;
}

export interface LiteralRule extends BaseRule {
  values: string[];
}

export interface EnvRule extends BaseRule {
  source: 'process.env';
  minLength?: number;
}

export type Rule = PatternRule | LiteralRule | EnvRule;

export interface HashConfig {
  algo?: 'sha256';
  length?: number;
  prefix?: string;
  suffix?: string;
}

export interface RedactorConfig {
  rules: Rule[];
  defaultAction?: Action;
  allowEnvKeys?: string[];
  hash?: HashConfig;
  placeholder?: string;
  minSecretLength?: number;
}

export interface RedactionHit {
  rule: string;
  action: Action;
  start: number;
  end: number;
}

export interface Redactor {
  scanString(input: string): string;
  scanObject<T>(input: T): T;
  scanHeaders(headers: Headers | Record<string, string | string[] | undefined>): Headers | Record<string, string | string[] | undefined>;
  scanError(err: unknown): { name: string; message: string; stack?: string };
}

export function isPatternRule(r: Rule): r is PatternRule {
  return 'pattern' in r && r.pattern instanceof RegExp;
}

export function isLiteralRule(r: Rule): r is LiteralRule {
  return 'values' in r && Array.isArray(r.values);
}

export function isEnvRule(r: Rule): r is EnvRule {
  return 'source' in r && r.source === 'process.env';
}
