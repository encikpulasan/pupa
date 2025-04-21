// init_db.ts - Initialize the database with an admin user

import { connect, getKv, KV_COLLECTIONS } from "./db/kv.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { load } from "https://deno.land/std@0.185.0/dotenv/mod.ts";

// Load environment variables
await load({ export: true });

// Connect to KV database
await connect();
const kv = getKv();

// Check if admin user already exists
const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.USERS] });
let adminExists = false;

for await (const entry of entries) {
  if (entry.value.email === "admin@example.com") {
    adminExists = true;
    console.log("Admin user already exists");
    break;
  }
}

if (!adminExists) {
  // Hash password
  const hashedPassword = await bcrypt.hash("password123");

  // Create admin user
  const adminUser = {
    id: crypto.randomUUID(),
    username: "admin",
    email: "admin@example.com",
    password: hashedPassword,
    role: "SuperAdmin",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to KV
  await kv.set([KV_COLLECTIONS.USERS, adminUser.id], adminUser);
  console.log("Admin user created successfully");

  // Create API key
  const apiKey = Deno.env.get("API_KEY") ||
    crypto.randomUUID().replace(/-/g, "");

  const apiKeyData = {
    key: apiKey,
    userId: adminUser.id,
    description: "Default Admin API Key",
    createdAt: new Date().toISOString(),
    lastUsed: null,
  };

  // Save API key to KV
  await kv.set([KV_COLLECTIONS.API_KEYS, apiKey], apiKeyData);
  console.log(`API key created: ${apiKey}`);

  if (apiKey !== Deno.env.get("API_KEY")) {
    console.log("Make sure to update your .env file with this API key");
  }
}

console.log("Database initialization complete");
