import {
  type Rule,
  type PatternRule,
  type LiteralRule,
  type Action,
  isPatternRule,
  isLiteralRule,
  isEnvRule,
} from './types.js';
import { captureEnv } from './env-snapshot.js';

export interface CompiledRule {
  name: string;
  action: Action;
}

export interface CompiledLiteral extends CompiledRule {
  kind: 'literal';
  value: string;
}

export interface CompiledPattern extends CompiledRule {
  kind: 'pattern';
  pattern: RegExp;
}

export type Compiled = CompiledLiteral | CompiledPattern;

export interface DetectorConfig {
  rules: Rule[];
  defaultAction?: Action;
  allowEnvKeys?: string[];
  minSecretLength?: number;
}

export function compileRules(cfg: DetectorConfig): Compiled[] {
  const def = cfg.defaultAction ?? 'redact';
  const minLength = cfg.minSecretLength ?? 8;
  const out: Compiled[] = [];

  for (const r of cfg.rules) {
    const action = r.action ?? def;
    if (isEnvRule(r)) {
      const entries = captureEnv(undefined, {
        allowKeys: cfg.allowEnvKeys,
        minLength: r.minLength ?? minLength,
      });
      for (const e of entries) {
        out.push({ kind: 'literal', name: `${r.name}:${e.key}`, value: e.value, action });
      }
    } else if (isLiteralRule(r)) {
      for (const v of (r as LiteralRule).values) {
        if (v.length < minLength) continue;
        out.push({ kind: 'literal', name: r.name, value: v, action });
      }
    } else if (isPatternRule(r)) {
      out.push({
        kind: 'pattern',
        name: r.name,
        pattern: ensureGlobal((r as PatternRule).pattern),
        action,
      });
    }
  }

  // longest literals first so substrings don't pre-empt
  out.sort((a, b) => {
    if (a.kind === 'literal' && b.kind === 'literal') return b.value.length - a.value.length;
    if (a.kind === 'literal') return -1;
    if (b.kind === 'literal') return 1;
    return 0;
  });

  return out;
}

function ensureGlobal(re: RegExp): RegExp {
  return re.global ? re : new RegExp(re.source, re.flags + 'g');
}

export interface Match {
  start: number;
  end: number;
  rule: string;
  action: Action;
  value: string;
}

export function findMatches(input: string, compiled: Compiled[]): Match[] {
  if (!input) return [];
  const matches: Match[] = [];

  for (const c of compiled) {
    if (c.kind === 'literal') {
      let idx = input.indexOf(c.value);
      while (idx !== -1) {
        matches.push({ start: idx, end: idx + c.value.length, rule: c.name, action: c.action, value: c.value });
        idx = input.indexOf(c.value, idx + c.value.length);
      }
    } else {
      c.pattern.lastIndex = 0;
      let m: RegExpExecArray | null;
      while ((m = c.pattern.exec(input)) !== null) {
        matches.push({ start: m.index, end: m.index + m[0].length, rule: c.name, action: c.action, value: m[0] });
        if (m[0].length === 0) c.pattern.lastIndex++;
      }
    }
  }

  return resolveOverlaps(matches);
}

function resolveOverlaps(matches: Match[]): Match[] {
  if (matches.length <= 1) return matches;
  matches.sort((a, b) => a.start - b.start || b.end - a.end);
  const out: Match[] = [];
  let lastEnd = -1;
  for (const m of matches) {
    if (m.start >= lastEnd) {
      out.push(m);
      lastEnd = m.end;
    }
  }
  return out;
}
