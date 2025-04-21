// init_deploy.ts - Run this script on deployment to ensure initial data

import { connect, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import { load } from "https://deno.land/std@0.185.0/dotenv/mod.ts";
import { hashPassword } from "../utils/password.ts";

// Load environment variables
await load({ export: true });

// Connect to KV database
await connect();
const kv = getKv();

// Function to initialize admin user
async function initializeDeployment() {
  console.log("Starting deployment initialization...");

  // Check if users exist
  const userEntries = kv.list<any>({ prefix: [KV_COLLECTIONS.USERS] });
  let userExists = false;

  for await (const entry of userEntries) {
    userExists = true;
    break;
  }

  // Create default admin if no users exist
  if (!userExists) {
    console.log("No users found. Creating default admin user...");

    // Hash password
    const defaultPassword = Deno.env.get("DEFAULT_ADMIN_PASSWORD") ||
      "admin123";
    const hashedPassword = await hashPassword(defaultPassword);

    // Create admin user
    const adminUser = {
      id: crypto.randomUUID(),
      username: "admin",
      email: "admin@charityshelter.org",
      password: hashedPassword,
      role: "SuperAdmin",
      firstName: "Admin",
      lastName: "User",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
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

    // Show credentials
    console.log("-----------------------------------------------------");
    console.log("DEFAULT ADMIN CREDENTIALS (CHANGE AFTER FIRST LOGIN):");
    console.log(`Email: admin@charityshelter.org`);
    console.log(`Password: ${defaultPassword}`);
    console.log(`API Key: ${apiKey}`);
    console.log("-----------------------------------------------------");
  } else {
    console.log(
      "Users already exist in the database. Skipping admin creation.",
    );
  }

  // Add more initialization logic as needed (org setup, etc.)

  console.log("Deployment initialization completed.");
}

// Run the initialization
await initializeDeployment();
