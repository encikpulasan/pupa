// middleware/logging.ts - Logging middleware

import { Context, Next } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getKv, KV_COLLECTIONS, generateId } from "../db/kv.ts";

const suspicious_patterns = [
  /(\%27)|(\')|(--)|(%23)|(#)/i, // SQL injection attempts
  /((\%3C)|<)((\%2F)|\/)*[a-z0-9\%]+((\%3E)|>)/i, // XSS attempts
  /exec(\s|\+)+(s|x)p\w+/i, // SQL stored procedures
  /etc\/passwd/i, // Path traversal
  /\/\.\.\/|\.\.\/\.\.\//i, // Directory traversal
];

/**
 * Log all requests to the system
 */
export async function logRequest(ctx: Context, next: Next) {
  const start = Date.now();
  await next();
  const ms = Date.now() - start;
  
  const logEntry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    method: ctx.request.method,
    url: ctx.request.url.pathname,
    status: ctx.response.status,
    userAgent: ctx.request.headers.get("user-agent") || "unknown",
    ip: ctx.request.ip,
    responseTime: ms,
  };
  
  // Log to console
  console.log(`${logEntry.method} ${logEntry.url} - ${logEntry.status} - ${ms}ms`);
  
  // Store in KV for audit trail if it's an admin action
  if (ctx.request.url.pathname.startsWith("/api/admin") && 
      ["POST", "PUT", "DELETE"].includes(ctx.request.method)) {
    const kv = getKv();
    await kv.set([KV_COLLECTIONS.AUDIT, logEntry.id], logEntry);
  }
  
  // Check for suspicious patterns
  const requestUrl = ctx.request.url.toString();
  const requestBody = JSON.stringify(ctx.state.body || {});
  
  for (const pattern of suspicious_patterns) {
    if (pattern.test(requestUrl) || pattern.test(requestBody)) {
      logSuspiciousActivity({
        type: "SUSPICIOUS_PATTERN",
        pattern: pattern.toString(),
        url: requestUrl,
        body: requestBody,
        ip: ctx.request.ip,
      });
      break;
    }
  }
}

/**
 * Log suspicious activities for security monitoring
 */
export async function logSuspiciousActivity(data: any) {
  console.warn("SUSPICIOUS ACTIVITY:", data);
  
  // Store in KV for security monitoring
  const kv = getKv();
  const id = generateId();
  await kv.set([KV_COLLECTIONS.AUDIT, "suspicious", id], {
    id,
    timestamp: new Date().toISOString(),
    ...data
  });
  
  // In a real application, you might want to trigger alerts here
}






