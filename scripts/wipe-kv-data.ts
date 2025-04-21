#!/usr/bin/env -S deno run --allow-env --allow-read --allow-write --allow-net

/**
 * This script wipes all KV data from your Deno KV store.
 * USE WITH CAUTION: This will permanently delete all data.
 */

// Safety confirmation is required through environment variable
const CONFIRM = Deno.env.get("CONFIRM_WIPE") === "yes_delete_all_data";

if (!CONFIRM) {
  console.error(
    "\x1b[31m%s\x1b[0m",
    "⚠️  DANGER: This will permanently delete ALL KV data!",
  );
  console.error("To confirm, run this command with:");
  console.error(
    "\x1b[33m%s\x1b[0m",
    "CONFIRM_WIPE=yes_delete_all_data deno task wipe-kv",
  );
  Deno.exit(1);
}

console.log("\x1b[33m%s\x1b[0m", "🧹 Starting KV data wipe...");

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
    `✅ Successfully wiped ${count} keys from KV store`,
  );
  kv.close();
} catch (error) {
  console.error("\x1b[31m%s\x1b[0m", "❌ Error wiping KV data:");
  console.error(error);
  Deno.exit(1);
}
