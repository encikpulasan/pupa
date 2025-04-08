// routes/auth.ts - Authentication routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getKv, KV_COLLECTIONS } from "../db/kv.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { logSuspiciousActivity } from "../middleware/logging.ts";

const router = new Router();

// Helper function to generate consistent JWT key
async function getJwtKey() {
  // For consistent key generation across the application
  const encoder = new TextEncoder();
  const secretKey = encoder.encode(
    Deno.env.get("JWT_SECRET") || "default_secret",
  );

  return await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-512" },
    false,
    ["sign", "verify"],
  );
}

// Helper function to check if token is blacklisted
async function isTokenBlacklisted(token: string): Promise<boolean> {
  const kv = getKv();
  const blacklistedToken = await kv.get([
    KV_COLLECTIONS.BLACKLISTED_TOKENS,
    token,
  ]);
  return blacklistedToken.value !== null;
}

// Login route
router.post("/login", async (ctx) => {
  const { email, password } = ctx.state.body;

  if (!email || !password) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Email and password are required" };
    return;
  }

  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.USERS] });

  let user = null;
  for await (const entry of entries) {
    if (entry.value.email === email) {
      user = entry.value;
      break;
    }
  }

  if (!user) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid credentials" };

    // Log failed login attempt
    logSuspiciousActivity({
      type: "FAILED_LOGIN",
      email,
      ip: ctx.request.ip,
      reason: "User not found",
    });

    return;
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid credentials" };

    // Log failed login attempt
    logSuspiciousActivity({
      type: "FAILED_LOGIN",
      email,
      ip: ctx.request.ip,
      userId: user.id,
      reason: "Invalid password",
    });

    return;
  }

  // Generate JWT token
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // 24 hours
    iat: Math.floor(Date.now() / 1000), // issued at time
    jti: crypto.randomUUID(), // unique token ID for blacklisting
  };

  const key = await getJwtKey();
  const token = await create({ alg: "HS512", typ: "JWT" }, payload, key);

  // Log successful login
  await kv.set([KV_COLLECTIONS.AUDIT, "auth", crypto.randomUUID()], {
    action: "LOGIN",
    userId: user.id,
    timestamp: new Date().toISOString(),
    ip: ctx.request.ip,
  });

  // Don't include password in response
  const { password: _, ...userWithoutPassword } = user;

  ctx.response.body = {
    user: userWithoutPassword,
    token,
  };
});

// Verify token route
router.post("/verify", async (ctx) => {
  const { token } = ctx.state.body;

  if (!token) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Token is required" };
    return;
  }

  try {
    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      ctx.response.status = 401;
      ctx.response.body = { valid: false, error: "Token has been revoked" };
      return;
    }

    const key = await getJwtKey();
    const payload = await verify(token, key);

    // Check if user still exists and has the same role
    const kv = getKv();
    const user = await kv.get<any>([KV_COLLECTIONS.USERS, payload.id]);

    if (!user.value || user.value.role !== payload.role) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Invalid token" };
      return;
    }

    ctx.response.body = { valid: true, user: payload };
  } catch (err) {
    ctx.response.status = 401;
    ctx.response.body = { valid: false, error: "Invalid token" };
  }
});

// Logout route
router.post("/logout", async (ctx) => {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const token = authHeader.substring(7);
  try {
    const key = await getJwtKey();
    const payload = await verify(token, key);

    const kv = getKv();

    // Blacklist the token
    await kv.set([KV_COLLECTIONS.BLACKLISTED_TOKENS, token], {
      userId: payload.id,
      jti: payload.jti,
      expiresAt: new Date(payload.exp * 1000).toISOString(),
      revokedAt: new Date().toISOString(),
    });

    // Log logout
    await kv.set([KV_COLLECTIONS.AUDIT, "auth", crypto.randomUUID()], {
      action: "LOGOUT",
      userId: payload.id,
      timestamp: new Date().toISOString(),
      ip: ctx.request.ip,
    });

    ctx.response.body = { success: true, message: "Successfully logged out" };
  } catch (err) {
    ctx.response.status = 200;
    ctx.response.body = { success: true, message: "Token was already invalid" };
  }
});

// Change password route
router.post("/change-password", async (ctx) => {
  const authHeader = ctx.request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Unauthorized" };
    return;
  }

  const { currentPassword, newPassword } = ctx.state.body;

  if (!currentPassword || !newPassword) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: "Current password and new password are required",
    };
    return;
  }

  if (newPassword.length < 8) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: "New password must be at least 8 characters long",
    };
    return;
  }

  const token = authHeader.substring(7);
  try {
    // Check if token is blacklisted
    if (await isTokenBlacklisted(token)) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Token has been revoked" };
      return;
    }

    const key = await getJwtKey();
    const payload = await verify(token, key);

    // Get user from KV
    const kv = getKv();
    const user = await kv.get<any>([KV_COLLECTIONS.USERS, payload.id]);

    if (!user.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.value.password,
    );
    if (!isPasswordValid) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Current password is incorrect" };
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword);

    // Update user
    const updatedUser = {
      ...user.value,
      password: hashedPassword,
      updatedAt: new Date().toISOString(),
    };

    await kv.set([KV_COLLECTIONS.USERS, payload.id], updatedUser);

    // Log password change
    await kv.set([KV_COLLECTIONS.AUDIT, "auth", crypto.randomUUID()], {
      action: "CHANGE_PASSWORD",
      userId: payload.id,
      timestamp: new Date().toISOString(),
      ip: ctx.request.ip,
    });

    ctx.response.body = { success: true };
  } catch (err) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid token" };
  }
});

export default router;
