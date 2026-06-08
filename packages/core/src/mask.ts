export interface MaskOptions {
  /** How many characters to leave visible. Default 4. */
  reveal?: number;
  /** Which end to reveal. Default 'end' (e.g. show the last 4). */
  from?: 'start' | 'end';
  /** Character used for the masked portion. Default '•'. */
  char?: string;
}

/**
 * Partially mask a secret, leaving a few characters visible for correlation.
 * Reveals fewer-than-`reveal` chars only when the value is long enough;
 * short values are fully masked so nothing leaks.
 */
export function maskValue(input: string, opts: MaskOptions = {}): string {
  if (!input) return input;
  const char = opts.char ?? '•';
  const reveal = Math.max(0, opts.reveal ?? 4);

  // Never reveal the whole (or nearly whole) secret.
  if (reveal >= input.length) return char.repeat(input.length);

  const masked = char.repeat(input.length - reveal);
  if ((opts.from ?? 'end') === 'start') {
    return input.slice(0, reveal) + masked;
  }
  return masked + input.slice(input.length - reveal);
}
