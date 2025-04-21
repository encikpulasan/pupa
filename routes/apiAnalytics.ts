// routes/apiAnalytics.ts - API Analytics Routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getKv, KV_COLLECTIONS } from "../db/kv.ts";
import {
  getApiErrorSummary,
  getApiUsageSummary,
  getEndpointMetrics,
} from "../services/apiAnalytics.ts";
import { verifyToken } from "../middleware/auth.ts";

// Public router - no authentication required for these routes
export const publicRouter = new Router();

// Admin router - authentication required for these routes
export const adminRouter = new Router();

// Apply authentication middleware to all admin routes
adminRouter.use(verifyToken);

// Get API usage summary (admin)
adminRouter.get("/summary", async (ctx) => {
  try {
    const timeframe = ctx.request.url.searchParams.get("timeframe") as
      | "hourly"
      | "daily"
      | "monthly"
      | "yearly"
      | null;

    const summary = await getApiUsageSummary(timeframe || "daily");
    ctx.response.body = summary;
  } catch (error) {
    console.error("Error getting API usage summary:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to get API usage summary",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Get endpoint metrics (admin)
adminRouter.get("/endpoints/:endpoint", async (ctx) => {
  try {
    const endpoint = ctx.params.endpoint;
    const timeframe = ctx.request.url.searchParams.get("timeframe") as
      | "hourly"
      | "daily"
      | "monthly"
      | "yearly"
      | null;

    if (!endpoint) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Endpoint parameter is required" };
      return;
    }

    const metrics = await getEndpointMetrics(endpoint, timeframe || "daily");
    ctx.response.body = metrics;
  } catch (error) {
    console.error("Error getting endpoint metrics:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to get endpoint metrics",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Get error summary (admin)
adminRouter.get("/errors", async (ctx) => {
  try {
    const timeframe = ctx.request.url.searchParams.get("timeframe") as
      | "hourly"
      | "daily"
      | "monthly"
      | "yearly"
      | null;

    const summary = await getApiErrorSummary(timeframe || "daily");
    ctx.response.body = summary;
  } catch (error) {
    console.error("Error getting API error summary:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to get API error summary",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// Get per-endpoint error summary (admin)
adminRouter.get("/errors/:endpoint", async (ctx) => {
  try {
    const endpoint = ctx.params.endpoint;

    if (!endpoint) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Endpoint parameter is required" };
      return;
    }

    // Fetch from API_ERROR_SUMMARY by endpoint
    const kv = getKv();
    const endpointKey = `error:endpoint:${endpoint}`;
    const errorData = await kv.get<any>([
      KV_COLLECTIONS.API_ERROR_SUMMARY,
      endpointKey,
    ]);

    if (!errorData.value) {
      ctx.response.body = {
        endpoint,
        totalErrors: 0,
        errorTypes: {},
        lastError: null,
      };
      return;
    }

    ctx.response.body = errorData.value;
  } catch (error) {
    console.error("Error getting endpoint error summary:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: "Failed to get endpoint error summary",
      details: error instanceof Error ? error.message : "Unknown error",
    };
  }
});
