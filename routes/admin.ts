// routes/admin.ts - Admin routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { generateId, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import { userSchema, validateInput } from "../middleware/validation.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";

const router = new Router();

// Get all admin users
router.get("/users", async (ctx) => {
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.USERS] });

  const users = [];
  for await (const entry of entries) {
    // Don't include password in response
    const { password, ...userWithoutPassword } = entry.value;
    users.push(userWithoutPassword);
  }

  ctx.response.body = users;
});

// Get admin user by ID
router.get("/users/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "User ID is required" };
    return;
  }

  const kv = getKv();
  const user = await kv.get<any>([KV_COLLECTIONS.USERS, id]);

  if (!user.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "User not found" };
    return;
  }

  // Don't include password in response
  const { password, ...userWithoutPassword } = user.value;
  ctx.response.body = userWithoutPassword;
});

// Create new admin user
router.post("/users", validateInput(userSchema), async (ctx) => {
  const userData = ctx.state.body;

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
  const hashedPassword = await bcrypt.hash(userData.password);

  const id = generateId();
  const newUser = {
    id,
    username: userData.username,
    email: userData.email,
    password: hashedPassword,
    role: userData.role,
    firstName: userData.firstName || "",
    lastName: userData.lastName || "",
    phoneNumber: userData.phoneNumber || "",
    address: userData.address || "",
    bio: userData.bio || "",
    profilePicture: userData.profilePicture || "",
    dateOfBirth: userData.dateOfBirth || "",
    interests: userData.interests || "",
    skills: userData.skills || "",
    isActive: userData.isActive !== undefined ? userData.isActive : true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to KV
  await kv.set([KV_COLLECTIONS.USERS, id], newUser);

  // Don't include password in response
  const { password, ...userWithoutPassword } = newUser;
  ctx.response.body = userWithoutPassword;
});

// Update admin user
router.put("/users/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "User ID is required" };
    return;
  }

  const userData = ctx.state.body;
  const kv = getKv();
  const existingUser = await kv.get<any>([KV_COLLECTIONS.USERS, id]);

  if (!existingUser.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "User not found" };
    return;
  }

  // Update user data
  const updatedUser = {
    ...existingUser.value,
    username: userData.username || existingUser.value.username,
    email: userData.email || existingUser.value.email,
    role: userData.role || existingUser.value.role,
    firstName: userData.firstName !== undefined
      ? userData.firstName
      : existingUser.value.firstName || "",
    lastName: userData.lastName !== undefined
      ? userData.lastName
      : existingUser.value.lastName || "",
    phoneNumber: userData.phoneNumber !== undefined
      ? userData.phoneNumber
      : existingUser.value.phoneNumber || "",
    address: userData.address !== undefined
      ? userData.address
      : existingUser.value.address || "",
    bio: userData.bio !== undefined
      ? userData.bio
      : existingUser.value.bio || "",
    profilePicture: userData.profilePicture !== undefined
      ? userData.profilePicture
      : existingUser.value.profilePicture || "",
    dateOfBirth: userData.dateOfBirth !== undefined
      ? userData.dateOfBirth
      : existingUser.value.dateOfBirth || "",
    interests: userData.interests !== undefined
      ? userData.interests
      : existingUser.value.interests || "",
    skills: userData.skills !== undefined
      ? userData.skills
      : existingUser.value.skills || "",
    isActive: userData.isActive !== undefined
      ? userData.isActive
      : existingUser.value.isActive !== undefined
      ? existingUser.value.isActive
      : true,
    updatedAt: new Date().toISOString(),
  };

  // Update password if provided
  if (userData.password) {
    updatedUser.password = await bcrypt.hash(userData.password);
  }

  // Save to KV
  await kv.set([KV_COLLECTIONS.USERS, id], updatedUser);

  // Don't include password in response
  const { password, ...userWithoutPassword } = updatedUser;
  ctx.response.body = userWithoutPassword;
});

// Delete admin user
router.delete("/users/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "User ID is required" };
    return;
  }

  const kv = getKv();
  const existingUser = await kv.get([KV_COLLECTIONS.USERS, id]);

  if (!existingUser.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "User not found" };
    return;
  }

  // Delete from KV
  await kv.delete([KV_COLLECTIONS.USERS, id]);

  ctx.response.status = 204; // No Content
});

// Generate API key for admin
router.post("/api-keys", async (ctx) => {
  const { userId, description } = ctx.state.body;

  if (!userId || !description) {
    ctx.response.status = 400;
    ctx.response.body = { error: "User ID and description are required" };
    return;
  }

  const kv = getKv();

  // Check if user exists
  const user = await kv.get<any>([KV_COLLECTIONS.USERS, userId]);
  if (!user.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "User not found" };
    return;
  }

  // Generate API key
  const apiKey = crypto.randomUUID().replace(/-/g, "");

  const apiKeyData = {
    key: apiKey,
    userId,
    description,
    createdAt: new Date().toISOString(),
    lastUsed: null,
  };

  // Save to KV
  await kv.set([KV_COLLECTIONS.API_KEYS, apiKey], apiKeyData);

  ctx.response.body = apiKeyData;
});

// Get all API keys
router.get("/api-keys", async (ctx) => {
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.API_KEYS] });

  const apiKeys = [];
  for await (const entry of entries) {
    apiKeys.push(entry.value);
  }

  ctx.response.body = apiKeys;
});

// Revoke API key
router.delete("/api-keys/:key", async (ctx) => {
  const { key } = ctx.params;
  if (!key) {
    ctx.response.status = 400;
    ctx.response.body = { error: "API key is required" };
    return;
  }

  const kv = getKv();
  const apiKey = await kv.get([KV_COLLECTIONS.API_KEYS, key]);

  if (!apiKey.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "API key not found" };
    return;
  }

  // Delete from KV
  await kv.delete([KV_COLLECTIONS.API_KEYS, key]);

  ctx.response.status = 204; // No Content
});

export default router;
