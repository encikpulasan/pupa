// middleware/rbac.ts - Role-based access control middleware for all routes

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

// Maps HTTP methods to required access levels
function getRequiredAccessLevelForMethod(method: string): AccessLevel {
  switch (method.toUpperCase()) {
    case "GET":
      return AccessLevel.READ_ONLY;
    case "POST":
      return AccessLevel.READ_WRITE;
    case "PUT":
    case "PATCH":
      return AccessLevel.READ_WRITE;
    case "DELETE":
      return AccessLevel.FULL;
    default:
      return AccessLevel.READ_ONLY;
  }
}

// Maps URL paths to resource types
function getResourceTypeFromPath(path: string): ResourceType {
  if (path.includes("/users")) {
    return ResourceType.USERS;
  } else if (path.includes("/posts")) {
    return ResourceType.POSTS;
  } else if (path.includes("/organizations")) {
    return ResourceType.ORGANIZATIONS;
  } else if (path.includes("/bookings")) {
    return ResourceType.BOOKINGS;
  } else if (path.includes("/analytics")) {
    return ResourceType.ANALYTICS;
  } else if (path.includes("/settings")) {
    return ResourceType.SETTINGS;
  } else if (path.includes("/donations")) {
    return ResourceType.DONATIONS;
  } else if (path.includes("/admin")) {
    // Default for admin routes without specific resource
    return ResourceType.USERS;
  } else if (path.includes("/patrons")) {
    return ResourceType.USERS;
  } else if (path.includes("/roles")) {
    return ResourceType.USERS;
  } else {
    // Default to posts for public routes
    return ResourceType.POSTS;
  }
}

// RBAC middleware function
export async function rbac(ctx: Context, next: Next) {
  // Skip for public endpoints like login/register
  if (
    ctx.request.url.pathname.includes("/auth") ||
    ctx.request.url.pathname === "/health" ||
    ctx.request.url.pathname === "/api-docs" ||
    ctx.request.url.pathname.startsWith("/redoc/") ||
    ctx.request.url.pathname === "/"
  ) {
    await next();
    return;
  }

  // For non-public endpoints, ensure user is authenticated
  if (!ctx.state.user) {
    // Let auth middleware handle this later - don't block here
    await next();
    return;
  }

  // If this is an admin route, apply RBAC
  if (ctx.request.url.pathname.includes("/admin")) {
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

    // Determine resource and required access level
    const resource = getResourceTypeFromPath(ctx.request.url.pathname);
    const requiredAccess = getRequiredAccessLevelForMethod(ctx.request.method);

    // Super admin bypass - always allow
    if (userRoles.includes("SuperAdmin")) {
      await next();
      return;
    }

    // Check if user has the required permission
    if (hasPermission(userRoles, allRoles, resource, requiredAccess)) {
      await next();
    } else {
      ctx.response.status = 403;
      ctx.response.body = {
        error: "Insufficient permissions",
        required: {
          resource,
          accessLevel: requiredAccess,
        },
        userRoles: userRoles,
      };
    }
  } else {
    // For non-admin routes, continue without RBAC
    await next();
  }
}
