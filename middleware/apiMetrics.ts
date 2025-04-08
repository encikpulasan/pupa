// middleware/apiMetrics.ts - API metrics tracking middleware

import { Context, Next } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { trackApiCall } from "../services/apiAnalytics.ts";

/**
 * Middleware to track API metrics including response time, status codes, and errors
 */
export async function apiMetrics(ctx: Context, next: Next) {
  const startTime = Date.now();
  const requestPath = ctx.request.url.pathname;
  const requestMethod = ctx.request.method;
  const userAgent = ctx.request.headers.get("user-agent") || undefined;
  const ipAddress = ctx.request.ip;
  const apiKey = ctx.request.headers.get("x-api-key") || undefined;
  const queryParams = Object.fromEntries(
    ctx.request.url.searchParams.entries(),
  );

  try {
    // Capture request body size if available
    let requestSize = 0;
    if (ctx.request.hasBody) {
      const contentLength = ctx.request.headers.get("content-length");
      if (contentLength) {
        requestSize = parseInt(contentLength);
      }
    }

    // Wait for the request to complete
    await next();

    // Calculate request duration
    const duration = Date.now() - startTime;

    // Determine response size
    let responseSize = 0;
    const contentLength = ctx.response.headers.get("content-length");
    if (contentLength) {
      responseSize = parseInt(contentLength);
    }

    // Track the API call
    await trackApiCall({
      endpoint: requestPath,
      method: requestMethod,
      timestamp: new Date().toISOString(),
      duration,
      statusCode: ctx.response.status,
      userAgent,
      ipAddress,
      responseSize,
      queryParams,
      userId: ctx.state.user?.id,
      apiKey,
    });
  } catch (error) {
    // If there's an error, track it with error details
    const duration = Date.now() - startTime;
    const statusCode = error instanceof Error ? 500 : ctx.response.status;
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error";

    await trackApiCall({
      endpoint: requestPath,
      method: requestMethod,
      timestamp: new Date().toISOString(),
      duration,
      statusCode,
      userAgent,
      ipAddress,
      errorMessage,
      queryParams,
      userId: ctx.state.user?.id,
      apiKey,
    });

    throw error;
  }
}
