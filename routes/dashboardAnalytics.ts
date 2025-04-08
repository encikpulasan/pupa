import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getDashboardAnalytics } from "../services/dashboardAnalytics.ts";
import { requireAuth } from "../middleware/auth.ts";

const router = new Router();

// Get all dashboard analytics
router.get("/", requireAuth, async (ctx) => {
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

export default router;
