// middleware/apiKey.ts - API key validation middleware

import { Middleware } from "https://deno.land/x/oak@v12.5.0/middleware.ts";
import { getKv, KV_COLLECTIONS } from "../db/kv.ts";

// Define the API key data interface
interface ApiKeyData {
  key: string;
  userId: string;
  description: string;
  createdAt: string;
  lastUsed: string | null;
}

/**
 * Middleware to validate API key
 * Verifies the API key is valid and updates last used timestamp
 */
export const validateApiKey: Middleware = async (ctx, next) => {
  try {
    const apiKey = ctx.request.headers.get("X-API-Key");

    if (!apiKey) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "API key is required",
      };
      return;
    }

    const kv = getKv();
    const result = await kv.get<ApiKeyData>([KV_COLLECTIONS.API_KEYS, apiKey]);

    if (!result.value) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Invalid API key",
      };
      return;
    }

    // Update last used timestamp
    const apiKeyData = { ...result.value };
    apiKeyData.lastUsed = new Date().toISOString();
    await kv.set([KV_COLLECTIONS.API_KEYS, apiKey], apiKeyData);

    // Store API key in context for later use
    ctx.state.apiKey = apiKeyData;

    await next();
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error validating API key",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};

/**
 * Middleware to verify API key for routes that require it
 * Similar to validateApiKey but specifically for the donation routes
 */
export const verifyApiKey: Middleware = async (ctx, next) => {
  try {
    const apiKey = ctx.request.headers.get("X-API-Key");

    if (!apiKey) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "API key is required",
      };
      return;
    }

    const kv = getKv();
    const result = await kv.get<ApiKeyData>([KV_COLLECTIONS.API_KEYS, apiKey]);

    if (!result.value) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Invalid API key",
      };
      return;
    }

    // Store API key data in context
    ctx.state.apiKey = result.value;

    await next();
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Error verifying API key",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
