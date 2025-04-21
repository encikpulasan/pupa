// routes/api/admin.ts - Admin API routes
import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";

const router = new Router();

// Add admin routes later - placeholder for imports
router.get("/api/v1/admin", (ctx) => {
  ctx.response.body = {
    success: true,
    message: "Admin API endpoint",
  };
});

export default router;
