export interface EnvEntry {
  key: string;
  value: string;
}

export function captureEnv(
  env: Record<string, string | undefined> = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>,
  opts: { allowKeys?: string[]; minLength?: number } = {}
): EnvEntry[] {
  const minLength = opts.minLength ?? 8;
  const allow = compileAllow(opts.allowKeys ?? []);
  const out: EnvEntry[] = [];
  for (const [key, value] of Object.entries(env)) {
    if (!value || value.length < minLength) continue;
    if (allow(key)) continue;
    out.push({ key, value });
  }
  // longest values first → avoid partial overshadow during scan
  out.sort((a, b) => b.value.length - a.value.length);
  return out;
}

function compileAllow(patterns: string[]): (key: string) => boolean {
  if (patterns.length === 0) return () => false;
  const regexes = patterns.map((p) => {
    const escaped = p.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
    return new RegExp(`^${escaped}$`);
  });
  return (key) => regexes.some((r) => r.test(key));
}
