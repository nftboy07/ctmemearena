import Redis from "ioredis";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
let redis: Redis | null = null;

function getRedis() {
  if (!process.env.REDIS_URL) return null;
  if (!redis) redis = new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 2, enableReadyCheck: true, lazyConnect: true });
  return redis;
}

export async function rateLimit(key: string, limit = 20, windowMs = 60_000, failClosed = false) {
  const client = getRedis();
  if (client) {
    try {
      if (client.status === "wait") await client.connect();
      const bucket = `ctma:rl:${key}`;
      const count = await client.incr(bucket);
      if (count === 1) await client.pexpire(bucket, windowMs);
      const ttl = Math.max(0, await client.pttl(bucket));
      return { ok: count <= limit, remaining: Math.max(0, limit - count), retryAfter: count > limit ? Math.ceil(ttl / 1000) : 0 };
    } catch (error) {
      console.error("Redis rate limiter unavailable", error);
      if (failClosed) return { ok: false, remaining: 0, retryAfter: 30 };
    }
  }
  const now = Date.now();
  const current = buckets.get(key);
  if (!current || current.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }
  if (current.count >= limit) return { ok: false, remaining: 0, retryAfter: Math.ceil((current.resetAt - now) / 1000) };
  current.count += 1;
  return { ok: true, remaining: limit - current.count, retryAfter: 0 };
}

export function clientKey(request: Request, scope: string) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return `${scope}:${forwarded || "unknown"}`;
}
