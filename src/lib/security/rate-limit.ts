type Bucket = {
  hits: number[];
  blockedUntil: number;
};

type CheckRateLimitOptions = {
  key: string;
  maxRequests: number;
  windowMs: number;
  blockMs?: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
};

type GlobalStore = {
  buckets: Map<string, Bucket>;
};

declare global {
  var __rateLimitStore__: GlobalStore | undefined;
}

function getStore() {
  if (!globalThis.__rateLimitStore__) {
    globalThis.__rateLimitStore__ = { buckets: new Map() };
  }
  return globalThis.__rateLimitStore__;
}

export function checkRateLimit(options: CheckRateLimitOptions): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  const bucket = store.buckets.get(options.key) ?? { hits: [], blockedUntil: 0 };
  const windowStart = now - options.windowMs;

  bucket.hits = bucket.hits.filter((timestamp) => timestamp >= windowStart);

  if (bucket.blockedUntil > now) {
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000))
    };
  }

  bucket.hits.push(now);

  if (bucket.hits.length > options.maxRequests) {
    bucket.blockedUntil = now + (options.blockMs ?? options.windowMs);
    store.buckets.set(options.key, bucket);

    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.max(1, Math.ceil((bucket.blockedUntil - now) / 1000))
    };
  }

  store.buckets.set(options.key, bucket);
  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - bucket.hits.length),
    retryAfterSec: 0
  };
}
