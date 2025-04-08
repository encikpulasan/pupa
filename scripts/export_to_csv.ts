import { connect, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import * as path from "https://deno.land/std@0.185.0/path/mod.ts";

// Connect to KV database
await connect();
const kv = getKv();

// Directory to store exported CSV files
const EXPORT_DIR = "./backups";

// Create backup directory if it doesn't exist
try {
  await Deno.mkdir(EXPORT_DIR, { recursive: true });
  console.log(`Created backup directory: ${EXPORT_DIR}`);
} catch (error) {
  // Directory may already exist
  if (!(error instanceof Deno.errors.AlreadyExists)) {
    throw error;
  }
}

// Function to convert object to CSV row
function objectToCsvRow(obj: Record<string, any>, headers: string[]): string {
  return headers.map((header) => {
    const value = obj[header];

    // Handle different value types
    if (value === undefined || value === null) {
      return "";
    } else if (typeof value === "object") {
      return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
    } else {
      return `"${String(value).replace(/"/g, '""')}"`;
    }
  }).join(",");
}

// Function to export a collection to CSV
async function exportCollectionToCsv(collectionName: string): Promise<string> {
  const timestamp = new Date().toISOString().replace(/:/g, "-");
  const filename = `${collectionName}_${timestamp}.csv`;
  const filepath = path.join(EXPORT_DIR, filename);

  // Get all entries in the collection
  const entries = [];
  const entriesIterator = kv.list({ prefix: [collectionName] });

  for await (const entry of entriesIterator) {
    // Skip the entry if it's not a valid object
    if (!entry.value || typeof entry.value !== "object") {
      continue;
    }

    entries.push(entry.value);
  }

  // If no entries found, skip creating file
  if (entries.length === 0) {
    console.log(`No entries found for collection: ${collectionName}`);
    return "";
  }

  // Get headers from the first entry
  const headers = Object.keys(entries[0]);

  // Create CSV content
  let csvContent = headers.join(",") + "\n";

  // Add each entry as a row
  for (const entry of entries) {
    csvContent += objectToCsvRow(entry, headers) + "\n";
  }

  // Write to file
  await Deno.writeTextFile(filepath, csvContent);

  console.log(
    `Exported ${entries.length} entries from ${collectionName} to ${filepath}`,
  );
  return filepath;
}

// Function to export all collections to CSV
async function exportAllCollectionsToCsv(): Promise<string[]> {
  const exportedFiles: string[] = [];

  // Export each collection
  for (const collectionName of Object.values(KV_COLLECTIONS)) {
    const exportedFile = await exportCollectionToCsv(collectionName);
    if (exportedFile) {
      exportedFiles.push(exportedFile);
    }
  }

  return exportedFiles;
}

// Run the export function
try {
  console.log("Starting export to CSV...");
  const exportedFiles = await exportAllCollectionsToCsv();

  if (exportedFiles.length > 0) {
    console.log(`\nExport completed! CSV files saved to: ${EXPORT_DIR}`);
    console.log(`Total collections exported: ${exportedFiles.length}`);
  } else {
    console.log("No data was exported. Database may be empty.");
  }
} catch (error) {
  console.error("Error exporting data:", error);
}
