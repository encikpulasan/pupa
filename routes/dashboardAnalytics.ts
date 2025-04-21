import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getDashboardAnalytics } from "../services/dashboardAnalytics.ts";
import { verifyToken } from "../middleware/auth.ts";

// Public router - no authentication required for these routes
export const publicRouter = new Router();

// Admin router - authentication required for these routes
export const adminRouter = new Router();

// Apply authentication middleware to all admin routes
adminRouter.use(verifyToken);

// Get all dashboard analytics (admin)
adminRouter.get("/", async (ctx) => {
  try {
    const analytics = await getDashboardAnalytics();
    ctx.response.body = analytics;
  } catch (error: unknown) {
    console.error("Error fetching dashboard analytics:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});
