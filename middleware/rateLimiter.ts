// middleware/rateLimiter.ts - Rate limiting middleware

import { Context, Next } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getKv } from "../db/kv.ts";
import { logSuspiciousActivity } from "./logging.ts";

interface RateLimitInfo {
  count: number;
  resetAt: number;
}

/**
 * Rate limiting middleware to prevent abuse
 */
export async function rateLimiter(ctx: Context, next: Next) {
  const ip = ctx.request.ip;
  const path = ctx.request.url.pathname;
  const kv = getKv();

  // Define rate limits
  // Higher limits for normal endpoints, stricter for sensitive ones
  const maxRequests = path.startsWith("/api/admin") ? 100 : 300;
  const windowMs = 60 * 1000; // 1 minute

  const rateLimitKey = ["rate_limit", ip, path.split("/")[2] || "general"];
  const now = Date.now();

  // Get current rate limit info
  const rateInfo = await kv.get<RateLimitInfo>(rateLimitKey);
  let limitInfo: RateLimitInfo;

  if (!rateInfo.value || rateInfo.value.resetAt < now) {
    // First request or window expired
    limitInfo = {
      count: 1,
      resetAt: now + windowMs,
    };
  } else {
    // Increment counter
    limitInfo = {
      count: rateInfo.value.count + 1,
      resetAt: rateInfo.value.resetAt,
    };
  }

  // Store updated rate limit info
  await kv.set(rateLimitKey, limitInfo, { expireIn: windowMs });

  // Set rate limit headers
  ctx.response.headers.set("X-RateLimit-Limit", maxRequests.toString());
  ctx.response.headers.set(
    "X-RateLimit-Remaining",
    (maxRequests - limitInfo.count).toString()
  );
  ctx.response.headers.set(
    "X-RateLimit-Reset",
    Math.ceil(limitInfo.resetAt / 1000).toString()
  );

  // Check if rate limit exceeded
  if (limitInfo.count > maxRequests) {
    ctx.response.status = 429; // Too Many Requests
    ctx.response.body = {
      error: "Rate limit exceeded",
      message: "Too many requests, please try again later",
    };

    // Log rate limit violation
    logSuspiciousActivity({
      type: "RATE_LIMIT_EXCEEDED",
      ip,
      path,
      count: limitInfo.count,
    });

    return;
  }

  await next();
}
