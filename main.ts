// main.ts - Entry point for the Charity Shelter API

import {
  Application,
  Context,
  isHttpError,
  Router,
  send,
} from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
import { Status } from "https://deno.land/std@0.185.0/http/http_status.ts";
import * as bcrypt from "https://deno.land/x/bcrypt@v0.4.1/mod.ts";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { load } from "https://deno.land/std@0.185.0/dotenv/mod.ts";
import { connect, getKv, KV_COLLECTIONS } from "./db/kv.ts";
import { logRequest, logSuspiciousActivity } from "./middleware/logging.ts";
import { rateLimiter } from "./middleware/rateLimiter.ts";
import { validateApiKey } from "./middleware/apiKey.ts";
import { securityHeaders } from "./middleware/securityHeaders.ts";
import { apiMetrics } from "./middleware/apiMetrics.ts";
import adminRoutes from "./routes/admin.ts";
import postRoutes from "./routes/posts.ts";
import organizationRoutes from "./routes/organization.ts";
// import analyticsRoutes from "./routes/analytics.ts";
// import auditRoutes from "./routes/audit.ts";
import authRoutes from "./routes/auth.ts";
import apiAnalyticsRoutes from "./routes/apiAnalytics.ts";
import swaggerRoutes from "./swagger.ts";
import dbViewerRoutes from "./db-viewer.ts";
import { initializeScheduler } from "./services/scheduler.ts";
import { getPostAnalytics, trackView } from "./services/analytics.ts";
import dashboardAnalyticsRoutes from "./routes/dashboardAnalytics.ts";

// Load environment variables
await load({ export: true });

const app = new Application();
const router = new Router();

// Connect to KV database
await connect();

// Initialize the scheduler for scheduled posts
await initializeScheduler();

// Middleware
app.use(async (ctx, next) => {
  // Skip security headers for documentation routes
  if (
    ctx.request.url.pathname === "/api-docs" ||
    ctx.request.url.pathname === "/api-docs.json" ||
    ctx.request.url.pathname.startsWith("/redoc/")
  ) {
    // Set CORS headers for documentation
    ctx.response.headers.set("Access-Control-Allow-Origin", "*");
    ctx.response.headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
    ctx.response.headers.set("Access-Control-Allow-Headers", "Content-Type");
    await next();
    return;
  }
  // Apply security headers for all other routes
  await securityHeaders(ctx, next);
});

app.use(
  oakCors({
    origin: [
      Deno.env.get("ADMIN_PANEL_URL") || "http://localhost:8001",
      "http://localhost:8001", // Add this for local development
      "http://127.0.0.1:8001", // Also add this for localhost alternative
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"], // Add OPTIONS for preflight requests
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    credentials: true,
  }),
);
app.use(logRequest);
app.use(apiMetrics);
app.use(rateLimiter);

// Body parser with size limits
app.use(async (ctx, next) => {
  if (ctx.request.hasBody) {
    const body = ctx.request.body();
    if (body.type === "json") {
      const value = await body.value;
      const size = JSON.stringify(value).length;
      if (size > 10 * 1024 * 1024) {
        // 10MB limit
        ctx.response.status = 413; // Payload Too Large
        ctx.response.body = { error: "Request entity too large" };
        return;
      }
      ctx.state.body = value;
    }
  }
  await next();
});

// Routes
router.get("/", (ctx) => {
  ctx.response.redirect("/api-docs");
});

router.get("/health", (ctx) => {
  ctx.response.headers.set("Content-Type", "application/json");
  ctx.response.body = {
    status: "healthy",
    version: "1.0.0",
    uptime: Math.floor(performance.now() / 1000),
  };
});

// Add a test route
router.get("/test-route", (ctx) => {
  ctx.response.body = { message: "Root router test route works!" };
});

// Mount the router
app.use(router.routes());
app.use(router.allowedMethods());

// Serve static files for ReDoc
app.use(async (ctx, next) => {
  if (ctx.request.url.pathname.startsWith("/redoc/")) {
    const path = ctx.request.url.pathname.replace("/redoc/", "");

    // Set correct MIME type for JavaScript files
    if (path.endsWith(".js")) {
      ctx.response.headers.set("Content-Type", "application/javascript");
    }

    try {
      await send(ctx, path, {
        root: `${Deno.cwd()}/public/redoc`,
      });
    } catch (error) {
      console.error(`Error serving static file: ${path}`, error);
      await next();
    }
    return;
  }
  await next();
});

// Mount Swagger documentation routes (before API key validation)
app.use(swaggerRoutes.routes());
app.use(swaggerRoutes.allowedMethods());

// Mount database viewer routes (before API key validation)
app.use(dbViewerRoutes.routes());
app.use(dbViewerRoutes.allowedMethods());

// Apply routes with API key validation
app.use(validateApiKey);

// API v1 routes
const v1Router = new Router({ prefix: "/api/v1" });

// Add a test route to v1Router
v1Router.get("/test", (ctx) => {
  ctx.response.body = { message: "V1 router test route works!" };
});

// Public routes
v1Router.use("/auth", authRoutes.routes());
v1Router.use("/organizations", organizationRoutes.publicRouter.routes());
v1Router.use("/posts", postRoutes.publicRouter.routes());

// Admin routes (protected)
v1Router.use("/admin", adminRoutes.routes());
v1Router.use("/admin/posts", postRoutes.adminRouter.routes());
v1Router.use("/admin/analytics", apiAnalyticsRoutes.routes());
v1Router.use("/admin/dashboard", dashboardAnalyticsRoutes.routes());
v1Router.use("/admin/organizations", organizationRoutes.adminRouter.routes());

// Also add a test admin route directly
v1Router.get("/admin/test", (ctx) => {
  ctx.response.body = { message: "V1 admin test route works!" };
});

// Direct test route for users
v1Router.get("/admin/direct-users", (ctx) => {
  ctx.response.body = { message: "Direct users route works!" };
});

// Debug logs
console.log("Available Routes:");
console.log("Admin routes prefix:", adminRoutes.prefix);
console.log("V1 Router prefix:", v1Router.prefix);
console.log("Auth routes prefix:", authRoutes.prefix);
console.log("Posts routes:", "Public and Admin routes configured");

// Mount v1 router
app.use(v1Router.routes());
app.use(v1Router.allowedMethods());

// Analytics routes
router.post("/api/analytics/view", async (ctx) => {
  const viewEvent = ctx.state.body;

  if (!viewEvent.postId || !viewEvent.sessionId) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Missing required fields" };
    return;
  }

  try {
    await trackView({
      ...viewEvent,
      timestamp: new Date().toISOString(),
    });
    ctx.response.status = 200;
  } catch (error: unknown) {
    ctx.response.status = 500;
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error occurred";
    ctx.response.body = { error: errorMessage };
  }
});

router.get("/api/analytics/posts/:id", async (ctx) => {
  const { id } = ctx.params;

  try {
    const analytics = await getPostAnalytics(id);
    ctx.response.body = analytics;
  } catch (error: unknown) {
    ctx.response.status = 500;
    const errorMessage = error instanceof Error
      ? error.message
      : "Unknown error occurred";
    ctx.response.body = { error: errorMessage };
  }
});

// Error handling
app.use(async (ctx, next) => {
  try {
    await next();
  } catch (err) {
    if (isHttpError(err)) {
      ctx.response.status = err.status;
      ctx.response.headers.set("Content-Type", "application/json");
      ctx.response.body = {
        error: err.message,
        status: err.status,
      };
    } else {
      const error = err as Error;
      console.error(error);
      ctx.response.status = 500;
      ctx.response.headers.set("Content-Type", "application/json");
      ctx.response.body = {
        error: "Internal Server Error",
        status: 500,
      };

      // Log critical errors
      logSuspiciousActivity({
        type: "ERROR",
        message: error.message,
        stack: error.stack,
        path: ctx.request.url.pathname,
        method: ctx.request.method,
        ip: ctx.request.ip,
      });
    }
  }
});

// 404 handler
app.use((ctx) => {
  ctx.response.status = 404;
  ctx.response.body = {
    error: "Not Found",
    status: 404,
  };
});

// Start the server with HTTP
const port = parseInt(Deno.env.get("PORT") || "8000");
console.log(`Server running on http://localhost:${port}`);

await app.listen({
  port,
});
