export function walkAndTransform<T>(input: T, transform: (s: string) => string): T {
  return walk(input, transform, new WeakMap()) as T;
}

function walk(node: unknown, fn: (s: string) => string, seen: WeakMap<object, unknown>): unknown {
  if (node == null) return node;
  if (typeof node === 'string') return fn(node);
  if (typeof node !== 'object') return node;

  const obj = node as object;
  if (seen.has(obj)) return seen.get(obj);

  if (Array.isArray(node)) {
    const arr: unknown[] = [];
    seen.set(obj, arr);
    for (const item of node) arr.push(walk(item, fn, seen));
    return arr;
  }

  if (node instanceof Date || node instanceof RegExp) return node;
  if (node instanceof Map) {
    const m = new Map();
    seen.set(obj, m);
    for (const [k, v] of node) m.set(walk(k, fn, seen), walk(v, fn, seen));
    return m;
  }
  if (node instanceof Set) {
    const s = new Set();
    seen.set(obj, s);
    for (const v of node) s.add(walk(v, fn, seen));
    return s;
  }

  const out: Record<string, unknown> = {};
  seen.set(obj, out);
  for (const [k, v] of Object.entries(node as Record<string, unknown>)) {
    out[k] = walk(v, fn, seen);
  }
  return out;
}
