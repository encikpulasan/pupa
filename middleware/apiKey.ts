// middleware/apiKey.ts - API Key validation

import { Context, Next } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getKv, KV_COLLECTIONS } from "../db/kv.ts";
import { logSuspiciousActivity } from "./logging.ts";

/**
 * Validate API key for all API requests
 */
export async function validateApiKey(ctx: Context, next: Next) {
  // Skip validation for public endpoints
  if (ctx.request.url.pathname.startsWith("/api/public")) {
    return await next();
  }

  const apiKey = ctx.request.headers.get("X-API-Key");

  // Health check requires API key but with a simpler validation
  if (ctx.request.url.pathname === "/health") {
    if (!apiKey) {
      ctx.response.status = 401;
      ctx.response.headers.set("Content-Type", "application/json");
      ctx.response.body = { error: "API Key required" };
      return;
    }
    return await next();
  }

  if (!apiKey) {
    ctx.response.status = 401;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = { error: "API Key required" };
    return;
  }

  // For development, accept the API key from .env file
  const envApiKey = Deno.env.get("API_KEY");
  if (envApiKey && apiKey === envApiKey) {
    // Create dummy API key data for context
    ctx.state.apiKeyData = {
      key: apiKey,
      userId: "dev-user",
      description: "Development API Key",
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
    };
    return await next();
  }

  const kv = getKv();
  const apiKeyData = await kv.get([KV_COLLECTIONS.API_KEYS, apiKey]);

  if (!apiKeyData.value) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid API Key" };

    // Log suspicious activity - invalid API key
    logSuspiciousActivity({
      type: "INVALID_API_KEY",
      ip: ctx.request.ip,
      path: ctx.request.url.pathname,
    });

    return;
  }

  // Store API key data in context state for later use
  ctx.state.apiKeyData = apiKeyData.value;

  await next();
}
