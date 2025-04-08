import { connect, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import * as path from "https://deno.land/std@0.185.0/path/mod.ts";

// Connect to KV database
await connect();
const kv = getKv();

// Directory containing CSV backup files
const IMPORT_DIR = "./backups";

// Function to parse CSV content into objects
function parseCSV(csvContent: string): Record<string, any>[] {
  const lines = csvContent.split("\n").filter((line) => line.trim());
  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0].split(",");
  const records: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i]);
    if (values.length !== headers.length) {
      console.warn(`Skipping row ${i + 1}: column count mismatch`);
      continue;
    }

    const record: Record<string, any> = {};
    for (let j = 0; j < headers.length; j++) {
      const parsedValue = parseValue(values[j]);
      record[headers[j]] = parsedValue;
    }

    records.push(record);
  }

  return records;
}

// Parse a CSV row, handling quoted fields correctly
function parseCsvRow(row: string): string[] {
  const result: string[] = [];
  let inQuotes = false;
  let currentField = "";

  for (let i = 0; i < row.length; i++) {
    const char = row[i];

    if (char === '"') {
      if (i < row.length - 1 && row[i + 1] === '"') {
        // Handle escaped quotes
        currentField += '"';
        i++; // Skip the next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // End of field
      result.push(currentField);
      currentField = "";
    } else {
      currentField += char;
    }
  }

  // Add the last field
  result.push(currentField);
  return result;
}

// Parse string value to the appropriate type
function parseValue(value: string): any {
  // Remove quotes if present
  value = value.trim();
  if (value === "") {
    return null;
  }

  if (value.startsWith('"') && value.endsWith('"')) {
    value = value.substring(1, value.length - 1).replace(/""/g, '"');
  }

  // Try to parse as JSON if it looks like an object or array
  if (
    (value.startsWith("{") && value.endsWith("}")) ||
    (value.startsWith("[") && value.endsWith("]"))
  ) {
    try {
      return JSON.parse(value);
    } catch (e) {
      // If parsing fails, return as string
    }
  }

  // Try to parse as number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return Number(value);
  }

  // Try to parse as boolean
  if (value.toLowerCase() === "true") return true;
  if (value.toLowerCase() === "false") return false;

  // Return as string for everything else
  return value;
}

// Function to import data from a CSV file into a collection
async function importCsvToCollection(filePath: string): Promise<number> {
  try {
    const csvContent = await Deno.readTextFile(filePath);
    const records = parseCSV(csvContent);

    if (records.length === 0) {
      console.log(`No valid records found in ${filePath}`);
      return 0;
    }

    // Determine collection name from filename
    const fileName = path.basename(filePath);
    const collectionName = fileName.split("_")[0];

    // Check if collection name is valid
    const validCollections = Object.values(KV_COLLECTIONS);
    if (!validCollections.includes(collectionName)) {
      console.error(`Unknown collection: ${collectionName}`);
      return 0;
    }

    // Import records
    let importedCount = 0;
    for (const record of records) {
      // Determine the key (usually id or similar)
      let idField = "id";
      if (!record[idField]) {
        // Try to find an id-like field
        idField = Object.keys(record).find((key) =>
          key === "key" || key === "token" || key.endsWith("Id")
        ) || "";

        if (!idField || !record[idField]) {
          console.warn(
            `Cannot determine ID field for record in ${collectionName}, skipping`,
          );
          continue;
        }
      }

      // Store in KV
      await kv.set([collectionName, record[idField]], record);
      importedCount++;
    }

    console.log(
      `Imported ${importedCount} records into collection: ${collectionName}`,
    );
    return importedCount;
  } catch (error) {
    console.error(`Error importing from ${filePath}:`, error);
    return 0;
  }
}

// Function to import all CSV files in the import directory
async function importAllCsvFiles(): Promise<void> {
  try {
    const entries = [];
    for await (const entry of Deno.readDir(IMPORT_DIR)) {
      if (entry.isFile && entry.name.endsWith(".csv")) {
        entries.push(entry.name);
      }
    }

    if (entries.length === 0) {
      console.log(`No CSV files found in ${IMPORT_DIR}`);
      return;
    }

    console.log(`Found ${entries.length} CSV files to import`);

    let totalImported = 0;
    for (const fileName of entries) {
      const filePath = path.join(IMPORT_DIR, fileName);
      const importedCount = await importCsvToCollection(filePath);
      totalImported += importedCount;
    }

    console.log(`\nImport completed! Total records imported: ${totalImported}`);
  } catch (error) {
    console.error("Error during import:", error);
  }
}

// Function to import a specific file
async function importSpecificFile(filePath: string): Promise<void> {
  try {
    const importedCount = await importCsvToCollection(filePath);
    console.log(`\nImport completed! Total records imported: ${importedCount}`);
  } catch (error) {
    console.error("Error during import:", error);
  }
}

// Parse command line arguments
const args = Deno.args;
if (args.length > 0) {
  // If a specific file is provided, import only that file
  await importSpecificFile(args[0]);
} else {
  // Otherwise import all CSV files in the import directory
  await importAllCsvFiles();
}
