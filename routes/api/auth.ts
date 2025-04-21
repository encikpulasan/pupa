// routes/api/auth.ts - Authentication API routes
import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";

const router = new Router();

// Add auth routes later - placeholder for imports
router.get("/api/v1/auth", (ctx) => {
  ctx.response.body = {
    success: true,
    message: "Auth API endpoint",
  };
});

export default router;
