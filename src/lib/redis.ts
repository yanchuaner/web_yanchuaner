import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || '';

let redis: Redis | null = null;

function getRedisClient(): Redis | null {
  if (redis) return redis;
  if (!REDIS_URL) return null;
  try {
    redis = new Redis(REDIS_URL, { maxRetriesPerRequest: 2, lazyConnect: true });
  } catch {
    return null;
  }
  return redis;
}

export default getRedisClient;
