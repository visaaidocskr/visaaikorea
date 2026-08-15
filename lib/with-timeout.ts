// Race a promise against a timeout and return a fallback if it is too slow.
// Used to keep pages responsive when Supabase is slow or unreachable: instead
// of hanging on a ~7s connection timeout, the caller falls back quickly.
// The underlying promise is not cancelled (it just becomes a no-op on resolve).
export async function withTimeout<T>(
  promise: PromiseLike<T>,
  ms: number,
  fallback: T
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    return await Promise.race([promise, timeout]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}
