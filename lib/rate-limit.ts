type RateLimitEntry = {
  count: number;
  resetAt: number;
};

type RateLimitOptions = {
  key: string;
  limit: number;
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
};

const globalForRateLimit = globalThis as typeof globalThis & {
  __foocapsRateLimitStore?: Map<string, RateLimitEntry>;
};

const rateLimitStore =
  globalForRateLimit.__foocapsRateLimitStore ??
  (globalForRateLimit.__foocapsRateLimitStore = new Map<string, RateLimitEntry>());

function pruneExpiredEntries(now: number) {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt <= now) {
      rateLimitStore.delete(key);
    }
  }
}

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  pruneExpiredEntries(now);
  const current = rateLimitStore.get(key);

  if (!current || current.resetAt <= now) {
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });

    return {
      allowed: true,
      remaining: Math.max(limit - 1, 0),
      resetAt: now + windowMs,
    };
  }

  if (current.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: current.resetAt,
    };
  }

  current.count += 1;
  rateLimitStore.set(key, current);

  return {
    allowed: true,
    remaining: Math.max(limit - current.count, 0),
    resetAt: current.resetAt,
  };
}

export function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
}
