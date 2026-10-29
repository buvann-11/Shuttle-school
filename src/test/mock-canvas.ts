/**
 * A stand-in 2D context that accepts every call and records method names and
 * any non-finite numeric arguments, so render code can be exercised in jsdom.
 */
export function createMockContext() {
  const calls: string[] = [];
  const badArgs: string[] = [];
  const state: Record<string | symbol, unknown> = {};
  const ctx = new Proxy(state, {
    get(target, prop) {
      if (prop in target) return target[prop];
      if (prop === 'createLinearGradient') return () => ({ addColorStop: () => undefined });
      return (...args: unknown[]) => {
        calls.push(String(prop));
        args.forEach((a) => {
          if (typeof a === 'number' && !Number.isFinite(a))
            badArgs.push(`${String(prop)}(${String(a)})`);
        });
      };
    },
    set(target, prop, value) {
      target[prop] = value;
      return true;
    },
  });
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, badArgs };
}
