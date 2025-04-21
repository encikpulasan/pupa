#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-net

/**
 * This script wipes all KV data from your Deno KV store in the development environment.
 * This version skips the confirmation for easier use during development.
 * DO NOT USE IN PRODUCTION.
 */

// Only run in development environment
const ENV = Deno.env.get("ENVIRONMENT") || Deno.env.get("DENO_ENV") ||
  "development";
if (ENV !== "development") {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "⚠️  This script is intended for development use only!",
  );
  console.error("Current environment:", ENV);
  console.error(
    "For production, use the wipe-kv script with confirmation instead.",
  );
  Deno.exit(1);
}

console.log("\x1b[33m%s\x1b[0m", "🧹 Starting development KV data wipe...");

try {
  const kv = await Deno.openKv();

  // Get all keys - no prefix means everything
  const iter = kv.list({ prefix: [] });
  let count = 0;
  const batchSize = 100;
  let batch: Deno.KvKey[] = [];

  // Process keys in batches for better performance
  for await (const entry of iter) {
    batch.push(entry.key);
    count++;

    // Process in batches to avoid memory issues with large datasets
    if (batch.length >= batchSize) {
      const tx = kv.atomic();
      for (const key of batch) {
        tx.delete(key);
      }
      await tx.commit();
      console.log(`Deleted batch of ${batch.length} keys`);
      batch = [];
    }
  }

  // Process any remaining keys
  if (batch.length > 0) {
    const tx = kv.atomic();
    for (const key of batch) {
      tx.delete(key);
    }
    await tx.commit();
    console.log(`Deleted final batch of ${batch.length} keys`);
  }

  console.log(
    "\x1b[32m%s\x1b[0m",
    `✅ Successfully wiped ${count} keys from development KV store`,
  );
  kv.close();
} catch (error) {
  console.error("\x1b[31m%s\x1b[0m", "❌ Error wiping KV data:");
  console.error(error);
  Deno.exit(1);
}
