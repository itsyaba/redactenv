import type { Redactor } from '@redactenv/core';

export function createPinoRedactor(redactor: Redactor) {
  return {
    censor: (value: unknown) => (typeof value === 'string' ? redactor.scanString(value) : redactor.scanObject(value)),
  };
}

export function createPinoTransform(redactor: Redactor) {
  return function transform(chunk: string): string {
    try {
      const obj = JSON.parse(chunk) as Record<string, unknown>;
      return JSON.stringify(redactor.scanObject(obj)) + '\n';
    } catch {
      return redactor.scanString(chunk);
    }
  };
}
