// db/kv.ts - KV Database Connection

let kv: Deno.Kv | null = null;

/**
 * Connect to the KV database
 */
export async function connect(): Promise<Deno.Kv> {
  if (!kv) {
    try {
      kv = await Deno.openKv();
      console.log("Successfully connected to KV database");
    } catch (error) {
      console.error("Failed to connect to KV database:", error);
      throw error;
    }
  }
  return kv;
}

/**
 * Get the KV database instance
 */
export function getKv(): Deno.Kv {
  if (!kv) {
    throw new Error("KV database not connected");
  }
  return kv;
}

/**
 * Close the KV database connection
 */
export async function closeKv(): Promise<void> {
  if (kv) {
    await kv.close();
    kv = null;
    console.log("KV database connection closed");
  }
}

// Define collection prefixes for better organization
export const KV_COLLECTIONS = {
  USERS: "users",
  POSTS: "posts",
  ORGANIZATION: "organization",
  ORGANIZATIONS: "organizations",
  BRANCHES: "branches",
  AUDIT: "audit",
  API_KEYS: "api_keys",
  ANALYTICS: "analytics",
  SETTINGS: "settings",
  BLACKLISTED_TOKENS: "blacklisted_tokens",
  BOOKINGS: "bookings",
  ROLES: "roles",
  PERMISSIONS: "permissions",

  // Donation-related collections
  DONATIONS: "donations",
  DONATION_TRANSACTIONS: "donation_transactions",
  DONATION_ANALYTICS: "donation_analytics",

  // New simplified analytics collections
  API_EVENTS: "api_events",
  API_METRICS: "api_metrics",
  API_ERRORS: "api_errors",
  API_ERROR_SUMMARY: "api_error_summary",

  // Time-based metrics collections (we only need these four)
  API_METRICS_HOURLY: "api_metrics_hourly",
  API_METRICS_DAILY: "api_metrics_daily",
  API_METRICS_MONTHLY: "api_metrics_monthly",
  API_METRICS_YEARLY: "api_metrics_yearly",

  // Time-based error collections (we only need these four)
  API_ERRORS_HOURLY: "api_errors_hourly",
  API_ERRORS_DAILY: "api_errors_daily",
  API_ERRORS_MONTHLY: "api_errors_monthly",
  API_ERRORS_YEARLY: "api_errors_yearly",
} as const;

// Generate a unique ID
export function generateId(): string {
  return crypto.randomUUID();
}
