import { TRPCError } from "@trpc/server";
import type { TRPCContext } from "../trpc/context.js";

type Bucket = { minute: number[]; hour: number[] };

const store = new Map<string, Bucket>();

// Limits: 10 req / 60s, 300 req / hour
const MINUTE_WINDOW_MS = 60_000;
const HOUR_WINDOW_MS = 60 * 60_000;
const MINUTE_LIMIT = 10;
const HOUR_LIMIT = 300;

function getBucket(key: string): Bucket {
  const b = store.get(key);
  if (b) return b;
  const fresh = { minute: [], hour: [] } satisfies Bucket;
  store.set(key, fresh);
  return fresh;
}

function prune(now: number, b: Bucket) {
  b.minute = b.minute.filter((ts) => now - ts < MINUTE_WINDOW_MS);
  b.hour = b.hour.filter((ts) => now - ts < HOUR_WINDOW_MS);
}

function checkAndConsume(key: string) {
  const now = Date.now();
  const b = getBucket(key);
  prune(now, b);
  const minuteCount = b.minute.length;
  const hourCount = b.hour.length;
  const overMinute = minuteCount >= MINUTE_LIMIT;
  const overHour = hourCount >= HOUR_LIMIT;

  if (overMinute || overHour) {
    let retryAfterMs = 0;
    if (overMinute && b.minute.length > 0) {
      retryAfterMs = Math.max(
        retryAfterMs,
        MINUTE_WINDOW_MS - (now - b.minute[0])
      );
    }
    if (overHour && b.hour.length > 0) {
      retryAfterMs = Math.max(retryAfterMs, HOUR_WINDOW_MS - (now - b.hour[0]));
    }
    return {
      allowed: false,
      retryAfterSec: Math.max(1, Math.ceil(retryAfterMs / 1000)),
      remainingMinute: Math.max(0, MINUTE_LIMIT - minuteCount),
      remainingHour: Math.max(0, HOUR_LIMIT - hourCount),
    } as const;
  }

  b.minute.push(now);
  b.hour.push(now);
  return {
    allowed: true,
    retryAfterSec: 0,
    remainingMinute: MINUTE_LIMIT - (minuteCount + 1),
    remainingHour: HOUR_LIMIT - (hourCount + 1),
  } as const;
}

export function enforceLlmRateLimit(ctx: TRPCContext) {
  const userId = ctx.user?.id;
  const key = userId
    ? `user:${userId}`
    : `ip:${ctx.c.req.header("x-forwarded-for") ?? "unknown"}`;
  const result = checkAndConsume(key);

  // Basic rate-limit headers (best-effort; do not rely on client honoring them)
  ctx.c.header("X-RateLimit-Limit-Minute", String(MINUTE_LIMIT));
  ctx.c.header(
    "X-RateLimit-Remaining-Minute",
    String(Math.max(0, result.remainingMinute))
  );
  ctx.c.header("X-RateLimit-Limit-Hour", String(HOUR_LIMIT));
  ctx.c.header(
    "X-RateLimit-Remaining-Hour",
    String(Math.max(0, result.remainingHour))
  );

  if (!result.allowed) {
    ctx.c.header("Retry-After", String(result.retryAfterSec));
    throw new TRPCError({
      code: "TOO_MANY_REQUESTS",
      message: `Rate limit exceeded. Try again in ${result.retryAfterSec}s`,
    });
  }
}
