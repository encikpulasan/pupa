// routes/roles.ts - Role management routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { generateId, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import { verifyToken } from "../middleware/auth.ts";
import { requirePermission } from "../middleware/permissions.ts";
import {
  AccessLevel,
  ResourceType,
  Role,
  SYSTEM_ROLES,
} from "../types/user.ts";

const router = new Router();

// Apply authentication middleware
router.use(verifyToken);

// Initialize system roles in the database
export async function initializeRoles(): Promise<void> {
  const kv = getKv();

  // Check if roles already exist
  const entries = kv.list({ prefix: [KV_COLLECTIONS.ROLES] });
  let rolesExist = false;

  for await (const entry of entries) {
    rolesExist = true;
    break;
  }

  // If no roles exist, initialize with system roles
  if (!rolesExist) {
    console.log("No roles found. Initializing system roles...");

    for (const role of SYSTEM_ROLES) {
      await kv.set([KV_COLLECTIONS.ROLES, role.name], role);
    }

    console.log(`${SYSTEM_ROLES.length} system roles initialized`);
  }
}

// Get all roles
router.get(
  "/",
  requirePermission(ResourceType.USERS, AccessLevel.READ_ONLY),
  async (ctx) => {
    const kv = getKv();
    const entries = kv.list<Role>({ prefix: [KV_COLLECTIONS.ROLES] });

    const roles: Role[] = [];
    for await (const entry of entries) {
      roles.push(entry.value);
    }

    ctx.response.body = roles;
  },
);

// Get role by name
router.get(
  "/:name",
  requirePermission(ResourceType.USERS, AccessLevel.READ_ONLY),
  async (ctx) => {
    const { name } = ctx.params;
    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Role name is required" };
      return;
    }

    const kv = getKv();
    const role = await kv.get<Role>([KV_COLLECTIONS.ROLES, name]);

    if (!role.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Role not found" };
      return;
    }

    ctx.response.body = role.value;
  },
);

// Create a new role
router.post(
  "/",
  requirePermission(ResourceType.USERS, AccessLevel.FULL),
  async (ctx) => {
    const roleData = ctx.state.body;

    if (!roleData || typeof roleData !== "object") {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid request body" };
      return;
    }

    if (!roleData.name || !roleData.description) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Role name and description are required" };
      return;
    }

    if (!roleData.permissions || !Array.isArray(roleData.permissions)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Permissions must be an array" };
      return;
    }

    // Check for duplicate role name
    const kv = getKv();
    const existingRole = await kv.get<Role>([
      KV_COLLECTIONS.ROLES,
      roleData.name,
    ]);

    if (existingRole.value) {
      ctx.response.status = 409;
      ctx.response.body = { error: "Role with this name already exists" };
      return;
    }

    // Validate permissions
    for (const permission of roleData.permissions) {
      if (!permission.resource || !permission.accessLevel) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Each permission must have resource and accessLevel",
        };
        return;
      }

      // Validate resource type
      if (
        !Object.values(ResourceType).includes(
          permission.resource as ResourceType,
        )
      ) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Invalid resource type",
          validResources: Object.values(ResourceType),
        };
        return;
      }

      // Validate access level
      if (
        !Object.values(AccessLevel).includes(
          permission.accessLevel as AccessLevel,
        )
      ) {
        ctx.response.status = 400;
        ctx.response.body = {
          error: "Invalid access level",
          validAccessLevels: Object.values(AccessLevel),
        };
        return;
      }
    }

    // Create the new role
    const newRole: Role = {
      name: roleData.name,
      description: roleData.description,
      permissions: roleData.permissions,
      isSystemRole: false,
    };

    // Save to KV
    await kv.set([KV_COLLECTIONS.ROLES, newRole.name], newRole);

    // Return the new role
    ctx.response.status = 201;
    ctx.response.body = newRole;
  },
);

// Update a role
router.put(
  "/:name",
  requirePermission(ResourceType.USERS, AccessLevel.FULL),
  async (ctx) => {
    const { name } = ctx.params;
    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Role name is required" };
      return;
    }

    const updateData = ctx.state.body;

    if (!updateData || typeof updateData !== "object") {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid request body" };
      return;
    }

    const kv = getKv();
    const existingRole = await kv.get<Role>([KV_COLLECTIONS.ROLES, name]);

    if (!existingRole.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Role not found" };
      return;
    }

    // Cannot modify system roles
    if (existingRole.value.isSystemRole) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Cannot modify system roles" };
      return;
    }

    // Validate permissions if provided
    if (updateData.permissions) {
      if (!Array.isArray(updateData.permissions)) {
        ctx.response.status = 400;
        ctx.response.body = { error: "Permissions must be an array" };
        return;
      }

      for (const permission of updateData.permissions) {
        if (!permission.resource || !permission.accessLevel) {
          ctx.response.status = 400;
          ctx.response.body = {
            error: "Each permission must have resource and accessLevel",
          };
          return;
        }

        // Validate resource type
        if (
          !Object.values(ResourceType).includes(
            permission.resource as ResourceType,
          )
        ) {
          ctx.response.status = 400;
          ctx.response.body = {
            error: "Invalid resource type",
            validResources: Object.values(ResourceType),
          };
          return;
        }

        // Validate access level
        if (
          !Object.values(AccessLevel).includes(
            permission.accessLevel as AccessLevel,
          )
        ) {
          ctx.response.status = 400;
          ctx.response.body = {
            error: "Invalid access level",
            validAccessLevels: Object.values(AccessLevel),
          };
          return;
        }
      }
    }

    // Update the role
    const updatedRole: Role = {
      ...existingRole.value,
      description: updateData.description ?? existingRole.value.description,
      permissions: updateData.permissions ?? existingRole.value.permissions,
    };

    // Save to KV
    await kv.set([KV_COLLECTIONS.ROLES, name], updatedRole);

    // Return the updated role
    ctx.response.body = updatedRole;
  },
);

// Delete a role
router.delete(
  "/:name",
  requirePermission(ResourceType.USERS, AccessLevel.FULL),
  async (ctx) => {
    const { name } = ctx.params;
    if (!name) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Role name is required" };
      return;
    }

    const kv = getKv();
    const existingRole = await kv.get<Role>([KV_COLLECTIONS.ROLES, name]);

    if (!existingRole.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Role not found" };
      return;
    }

    // Cannot delete system roles
    if (existingRole.value.isSystemRole) {
      ctx.response.status = 403;
      ctx.response.body = { error: "Cannot delete system roles" };
      return;
    }

    // Delete the role
    await kv.delete([KV_COLLECTIONS.ROLES, name]);

    // Return success
    ctx.response.status = 204;
  },
);

export default router;
