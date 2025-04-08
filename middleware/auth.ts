import { Context, Next } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

// Helper function to generate consistent JWT key
async function getJwtKey() {
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

export async function requireAuth(ctx: Context, next: Next) {
  try {
    const authHeader = ctx.request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      ctx.response.status = 401;
      ctx.response.body = { error: "No token provided" };
      return;
    }

    const token = authHeader.split(" ")[1];
    const key = await getJwtKey();
    const payload = await verify(token, key);

    // Add user info to context state
    ctx.state.user = payload;

    await next();
  } catch (error) {
    ctx.response.status = 401;
    ctx.response.body = { error: "Invalid token" };
  }
}
