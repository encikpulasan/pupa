// middleware/auth.ts - Authentication middleware

import { Middleware } from "https://deno.land/x/oak@v12.5.0/middleware.ts";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { getKv, KV_COLLECTIONS } from "../db/kv.ts";

const JWT_SECRET = Deno.env.get("JWT_SECRET") || "your-secret-key";

// Create key for JWT verification
const key = await crypto.subtle.importKey(
  "raw",
  new TextEncoder().encode(JWT_SECRET),
  { name: "HMAC", hash: "SHA-256" },
  false,
  ["sign", "verify"],
);

/**
 * Middleware to verify JWT token for protected routes
 */
export const verifyToken: Middleware = async (ctx, next) => {
  try {
    const authHeader = ctx.request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Authentication required",
      };
      return;
    }

    const token = authHeader.split(" ")[1];

    // Check if token is blacklisted
    const kv = getKv();
    const blacklisted = await kv.get([
      KV_COLLECTIONS.BLACKLISTED_TOKENS,
      token,
    ]);

    if (blacklisted.value) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Token is invalid or expired",
      };
      return;
    }

    // Verify token
    try {
      const payload = await verify(token, key);

      if (!payload) {
        throw new Error("Invalid token");
      }

      // Store user data in context
      ctx.state.user = payload;

      await next();
    } catch (verifyError) {
      ctx.response.status = 401;
      ctx.response.body = {
        success: false,
        message: "Invalid token",
        error: verifyError instanceof Error
          ? verifyError.message
          : "Unknown error",
      };
    }
  } catch (error) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Authentication error",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
