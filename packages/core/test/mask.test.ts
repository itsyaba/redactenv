import { describe, it, expect } from 'vitest';
import { maskValue } from '../src/mask.js';

describe('maskValue', () => {
  it('reveals last 4 chars by default, masks the rest', () => {
    expect(maskValue('sk_live_abcd1234', {})).toBe('••••••••••••1234');
  });

  it('respects custom reveal count', () => {
    expect(maskValue('abcdef', { reveal: 2 })).toBe('••••ef');
  });

  it('reveals from the start when from=start', () => {
    expect(maskValue('abcdef', { reveal: 2, from: 'start' })).toBe('ab••••');
  });

  it('uses a custom mask character', () => {
    expect(maskValue('abcdef', { reveal: 2, char: '*' })).toBe('****ef');
  });

  it('masks the whole value when reveal >= length (no leak)', () => {
    expect(maskValue('abc', { reveal: 4 })).toBe('•••');
    expect(maskValue('abcd', { reveal: 4 })).toBe('••••');
  });

  it('handles empty input', () => {
    expect(maskValue('', {})).toBe('');
  });

  it('treats negative reveal as zero (full mask)', () => {
    expect(maskValue('abcdef', { reveal: -3 })).toBe('••••••');
  });
});
