// routes/api/post.ts - Post API routes
import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";

const router = new Router();

// Add post routes later - placeholder for imports
router.get("/api/v1/posts", (ctx) => {
  ctx.response.body = {
    success: true,
    message: "Posts API endpoint",
  };
});

export default router;
