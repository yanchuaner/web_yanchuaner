import getRedisClient from './redis';

/**
 * Generic cache wrapper: checks Redis first, falls back to fetchFn, caches result.
 * If Redis is unavailable, just calls through to fetchFn directly.
 */
export async function getCachedOrFetch<T>(
  key: string,
  ttlSeconds: number,
  fetchFn: () => Promise<T>,
): Promise<T> {
  const redis = getRedisClient();

  if (redis) {
    try {
      const cached = await redis.get(key);
      if (cached) {
        return JSON.parse(cached) as T;
      }
    } catch { /* cache miss, fall through */ }
  }

  const data = await fetchFn();

  if (redis) {
    try {
      await redis.set(key, JSON.stringify(data), 'EX', ttlSeconds);
    } catch { /* cache set failed, non-critical */ }
  }

  return data;
}
