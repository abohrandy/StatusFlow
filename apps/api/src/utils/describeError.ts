/**
 * Produces a genuinely useful log string for an unknown caught value. Plain `err.message`
 * is blank for some real error shapes Node itself throws — notably `AggregateError` (e.g.
 * from a failed `fetch`/undici network call, which nests the real per-attempt failures in
 * `.errors` rather than setting a top-level message) — which otherwise shows up in logs as
 * an unhelpful empty string with no way to tell what actually failed.
 */
export function describeError(err: unknown): string {
  if (err instanceof Error) {
    const parts = [`${err.name}: ${err.message || '(no message)'}`];
    const nested = (err as any).errors;
    if (Array.isArray(nested) && nested.length > 0) {
      parts.push(`causes: [${nested.map((e) => describeError(e)).join('; ')}]`);
    }
    if ((err as any).cause) {
      parts.push(`cause: ${describeError((err as any).cause)}`);
    }
    if ((err as any).code) {
      parts.push(`code: ${(err as any).code}`);
    }
    return parts.join(' | ');
  }
  try {
    return JSON.stringify(err);
  } catch {
    return String(err);
  }
}
