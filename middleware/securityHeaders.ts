// middleware/securityHeaders.ts - Security headers middleware

import { Context, Next } from "https://deno.land/x/oak@v12.5.0/mod.ts";

/**
 * Add security headers to all responses
 */
export async function securityHeaders(ctx: Context, next: Next) {
  await next();

  // Set security headers
  ctx.response.headers.set("X-Content-Type-Options", "nosniff");
  ctx.response.headers.set("X-Frame-Options", "DENY");
  ctx.response.headers.set("X-XSS-Protection", "1; mode=block");
  // Commented out HSTS header to disable forcing HTTPS
  // ctx.response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  ctx.response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'",
  );
  ctx.response.headers.set(
    "Referrer-Policy",
    "strict-origin-when-cross-origin",
  );
  ctx.response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=()",
  );
}
