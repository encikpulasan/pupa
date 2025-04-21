// middleware/permissions.ts - Permission checking middleware

import { Context, Next } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getKv, KV_COLLECTIONS } from "../db/kv.ts";
import {
  AccessLevel,
  hasPermission,
  ResourceType,
  Role,
  SYSTEM_ROLES,
} from "../types/user.ts";

// Get all available roles from the database or use system defaults
async function getAllRoles(): Promise<Role[]> {
  const kv = getKv();
  const entries = kv.list<Role>({ prefix: [KV_COLLECTIONS.ROLES] });

  // Start with system roles
  const roles = [...SYSTEM_ROLES];

  // Add custom roles from database
  for await (const entry of entries) {
    // Don't add system roles that are already included
    if (!roles.some((r) => r.name === entry.value.name)) {
      roles.push(entry.value);
    }
  }

  return roles;
}

// Middleware that checks if the user has access to a specific resource
export function requirePermission(
  resource: ResourceType,
  accessLevel: AccessLevel,
) {
  return async (ctx: Context, next: Next) => {
    // User must be authenticated first
    if (!ctx.state.user) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Authentication required" };
      return;
    }

    // Get user info
    const userId = ctx.state.user.id;
    const kv = getKv();
    const userResult = await kv.get<any>([KV_COLLECTIONS.USERS, userId]);

    if (!userResult.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    const user = userResult.value;
    const allRoles = await getAllRoles();

    // Legacy compatibility - if user has role property but not roles array
    const userRoles = user.roles || [user.role];

    // Check if user has the required permission
    if (hasPermission(userRoles, allRoles, resource, accessLevel)) {
      await next();
    } else {
      ctx.response.status = 403;
      ctx.response.body = {
        error: "Insufficient permissions",
        required: {
          resource,
          accessLevel,
        },
      };
    }
  };
}

// Middleware that ensures user has a specific user type
export function requireUserType(...userTypes: string[]) {
  return async (ctx: Context, next: Next) => {
    // User must be authenticated first
    if (!ctx.state.user) {
      ctx.response.status = 401;
      ctx.response.body = { error: "Authentication required" };
      return;
    }

    // Get user info
    const userId = ctx.state.user.id;
    const kv = getKv();
    const userResult = await kv.get<any>([KV_COLLECTIONS.USERS, userId]);

    if (!userResult.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User not found" };
      return;
    }

    const user = userResult.value;

    // Check if user has one of the required user types
    if (userTypes.includes(user.userType)) {
      await next();
    } else {
      ctx.response.status = 403;
      ctx.response.body = {
        error: "Unauthorized user type",
        required: userTypes,
        current: user.userType,
      };
    }
  };
}
