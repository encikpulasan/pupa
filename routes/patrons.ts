// routes/patrons.ts - Patron management routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { generateId, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import { verifyToken } from "../middleware/auth.ts";
import {
  requirePermission,
  requireUserType,
} from "../middleware/permissions.ts";
import { hashPassword } from "../utils/password.ts";
import {
  AccessLevel,
  PatronUser,
  ResourceType,
  UserType,
} from "../types/user.ts";

// Create two routers - one for public routes, one for admin routes
export const publicRouter = new Router();
export const adminRouter = new Router();

// Apply authentication middleware to admin routes
adminRouter.use(verifyToken);

// Register a new patron (public route)
publicRouter.post("/register", async (ctx) => {
  const userData = ctx.state.body;

  if (!userData || typeof userData !== "object") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid request body" };
    return;
  }

  // Validate required fields
  const requiredFields = [
    "username",
    "email",
    "password",
    "firstName",
    "lastName",
    "organizationName",
  ];

  for (const field of requiredFields) {
    if (!userData[field]) {
      ctx.response.status = 400;
      ctx.response.body = { error: `${field} is required` };
      return;
    }
  }

  // Check if user with the same email already exists
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.USERS] });

  for await (const entry of entries) {
    if (entry.value.email === userData.email) {
      ctx.response.status = 400;
      ctx.response.body = { error: "User with this email already exists" };
      return;
    }
  }

  // Hash password
  const hashedPassword = await hashPassword(userData.password);

  const id = generateId();
  const timestamp = new Date().toISOString();

  // Create new patron user
  const newPatron: PatronUser = {
    id,
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    userType: UserType.PATRON,
    roles: ["Patron"], // Default role for patrons
    firstName: userData.firstName,
    lastName: userData.lastName,
    phoneNumber: userData.phoneNumber || "",
    address: userData.address || "",
    organizationName: userData.organizationName,
    position: userData.position || "",
    bio: userData.bio || "",
    verificationStatus: "pending",
    contactPreference: userData.contactPreference || "email",
    notes: "",
    isActive: false, // Patrons need to be activated by admin
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Save to KV
  await kv.set([KV_COLLECTIONS.USERS, id], newPatron);

  // Log the registration
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: "PATRON_REGISTRATION",
    userId: id,
    timestamp,
    ip: ctx.request.ip,
  });

  // Don't include password in response
  const { password, ...patronWithoutPassword } = newPatron;

  ctx.response.status = 201;
  ctx.response.body = {
    ...patronWithoutPassword,
    message: "Registration successful. Your account is pending approval.",
  };
});

// Get all patrons (admin only)
adminRouter.get(
  "/",
  requirePermission(ResourceType.USERS, AccessLevel.READ_ONLY),
  async (ctx) => {
    const kv = getKv();
    const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.USERS] });

    const patrons = [];
    for await (const entry of entries) {
      // Only include patron users
      if (entry.value.userType === UserType.PATRON) {
        // Don't include password in response
        const { password, ...userWithoutPassword } = entry.value;
        patrons.push(userWithoutPassword);
      }
    }

    ctx.response.body = patrons;
  },
);

// Get patron by ID (admin only)
adminRouter.get(
  "/:id",
  requirePermission(ResourceType.USERS, AccessLevel.READ_ONLY),
  async (ctx) => {
    const { id } = ctx.params;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Patron ID is required" };
      return;
    }

    const kv = getKv();
    const patron = await kv.get<any>([KV_COLLECTIONS.USERS, id]);

    if (!patron.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Patron not found" };
      return;
    }

    // Ensure it's a patron
    if (patron.value.userType !== UserType.PATRON) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User is not a patron" };
      return;
    }

    // Don't include password in response
    const { password, ...patronWithoutPassword } = patron.value;
    ctx.response.body = patronWithoutPassword;
  },
);

// Update patron (admin only)
adminRouter.put(
  "/:id",
  requirePermission(ResourceType.USERS, AccessLevel.READ_WRITE),
  async (ctx) => {
    const { id } = ctx.params;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Patron ID is required" };
      return;
    }

    const updateData = ctx.state.body;

    if (!updateData || typeof updateData !== "object") {
      ctx.response.status = 400;
      ctx.response.body = { error: "Invalid request body" };
      return;
    }

    const kv = getKv();
    const existingPatron = await kv.get<any>([KV_COLLECTIONS.USERS, id]);

    if (!existingPatron.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Patron not found" };
      return;
    }

    // Ensure it's a patron
    if (existingPatron.value.userType !== UserType.PATRON) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User is not a patron" };
      return;
    }

    // Update patron data
    const updatedPatron = {
      ...existingPatron.value,
      username: updateData.username || existingPatron.value.username,
      email: updateData.email || existingPatron.value.email,
      firstName: updateData.firstName !== undefined
        ? updateData.firstName
        : existingPatron.value.firstName,
      lastName: updateData.lastName !== undefined
        ? updateData.lastName
        : existingPatron.value.lastName,
      organizationName: updateData.organizationName !== undefined
        ? updateData.organizationName
        : existingPatron.value.organizationName,
      position: updateData.position !== undefined
        ? updateData.position
        : existingPatron.value.position || "",
      phoneNumber: updateData.phoneNumber !== undefined
        ? updateData.phoneNumber
        : existingPatron.value.phoneNumber || "",
      address: updateData.address !== undefined
        ? updateData.address
        : existingPatron.value.address || "",
      bio: updateData.bio !== undefined
        ? updateData.bio
        : existingPatron.value.bio || "",
      verificationStatus: updateData.verificationStatus !== undefined
        ? updateData.verificationStatus
        : existingPatron.value.verificationStatus || "pending",
      contactPreference: updateData.contactPreference !== undefined
        ? updateData.contactPreference
        : existingPatron.value.contactPreference || "email",
      notes: updateData.notes !== undefined
        ? updateData.notes
        : existingPatron.value.notes || "",
      isActive: updateData.isActive !== undefined
        ? updateData.isActive
        : existingPatron.value.isActive,
      roles: updateData.roles !== undefined
        ? updateData.roles
        : existingPatron.value.roles || ["Patron"],
      updatedAt: new Date().toISOString(),
      updatedBy: ctx.state.user?.id || "unknown",
    };

    // Update password if provided
    if (updateData.password) {
      updatedPatron.password = await hashPassword(updateData.password);
    }

    // Save to KV
    await kv.set([KV_COLLECTIONS.USERS, id], updatedPatron);

    // Log the update
    await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
      action: "PATRON_UPDATED",
      userId: id,
      updatedBy: ctx.state.user?.id || "unknown",
      timestamp: new Date().toISOString(),
    });

    // Don't include password in response
    const { password, ...patronWithoutPassword } = updatedPatron;
    ctx.response.body = patronWithoutPassword;
  },
);

// Verify/approve a patron
adminRouter.post(
  "/:id/verify",
  requirePermission(ResourceType.USERS, AccessLevel.READ_WRITE),
  async (ctx) => {
    const { id } = ctx.params;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Patron ID is required" };
      return;
    }

    const { status, notes } = ctx.state.body;

    if (!status || !["verified", "rejected"].includes(status)) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Status must be 'verified' or 'rejected'" };
      return;
    }

    const kv = getKv();
    const existingPatron = await kv.get<any>([KV_COLLECTIONS.USERS, id]);

    if (!existingPatron.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Patron not found" };
      return;
    }

    // Ensure it's a patron
    if (existingPatron.value.userType !== UserType.PATRON) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User is not a patron" };
      return;
    }

    // Update patron verification status
    const updatedPatron = {
      ...existingPatron.value,
      verificationStatus: status,
      notes: notes || existingPatron.value.notes || "",
      isActive: status === "verified",
      updatedAt: new Date().toISOString(),
      updatedBy: ctx.state.user?.id || "unknown",
    };

    // Save to KV
    await kv.set([KV_COLLECTIONS.USERS, id], updatedPatron);

    // Log the verification
    await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
      action: `PATRON_${status.toUpperCase()}`,
      userId: id,
      verifiedBy: ctx.state.user?.id || "unknown",
      timestamp: new Date().toISOString(),
    });

    // Don't include password in response
    const { password, ...patronWithoutPassword } = updatedPatron;
    ctx.response.body = {
      ...patronWithoutPassword,
      message: `Patron ${
        status === "verified" ? "verified and activated" : "rejected"
      }`,
    };
  },
);

// Delete patron (admin only)
adminRouter.delete(
  "/:id",
  requirePermission(ResourceType.USERS, AccessLevel.FULL),
  async (ctx) => {
    const { id } = ctx.params;
    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Patron ID is required" };
      return;
    }

    const kv = getKv();
    const existingPatron = await kv.get<any>([KV_COLLECTIONS.USERS, id]);

    if (!existingPatron.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Patron not found" };
      return;
    }

    // Ensure it's a patron
    if (existingPatron.value.userType !== UserType.PATRON) {
      ctx.response.status = 404;
      ctx.response.body = { error: "User is not a patron" };
      return;
    }

    // Delete patron
    await kv.delete([KV_COLLECTIONS.USERS, id]);

    // Log the deletion
    await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
      action: "PATRON_DELETED",
      userId: id,
      deletedBy: ctx.state.user?.id || "unknown",
      timestamp: new Date().toISOString(),
    });

    ctx.response.status = 204; // No content
  },
);
