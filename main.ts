// main.ts - Entry point for the Charity Shelter API

import {
  Application,
  // Context,
  isHttpError,
  Router,
  send,
} from "https://deno.land/x/oak@v12.5.0/mod.ts";
// import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";
import { oakCors } from "https://deno.land/x/cors@v1.2.2/mod.ts";
// import { Status } from "https://deno.land/std@0.185.0/http/http_status.ts";
import { load } from "https://deno.land/std@0.185.0/dotenv/mod.ts";

// API routers
import adminRouter from "./routes/api/admin.ts";
import authRouter from "./routes/api/auth.ts";
import * as donationRoutes from "./routes/donations.ts";
import organizationRouter from "./routes/api/organization.ts";
import postRouter from "./routes/api/post.ts";

// Core routes
import * as adminRoutes from "./routes/admin.ts";
import * as apiAnalyticsRoutes from "./routes/apiAnalytics.ts";
import authRoutes from "./routes/auth.ts";
import * as dashboardAnalyticsRoutes from "./routes/dashboardAnalytics.ts";
import dbViewerRoutes from "./db-viewer.ts";
import * as bookingRoutes from "./routes/bookings.ts";
import * as patronRoutes from "./routes/patrons.ts";
import organizationRoutes from "./routes/organization.ts";
import postRoutes from "./routes/posts.ts";
import rolesRoutes, { initializeRoles } from "./routes/roles.ts";
import * as analyticsRoutes from "./routes/analytics.ts";
import { swaggerRouter } from "./swagger.ts";

// Services
import { connect, getKv, KV_COLLECTIONS } from "./db/kv.ts";
import { getPostAnalytics, trackView } from "./services/analytics.ts";
import { initializeScheduler } from "./services/scheduler.ts";

// Middleware
import { apiMetrics } from "./middleware/apiMetrics.ts";
import { logRequest, logSuspiciousActivity } from "./middleware/logging.ts";
import { rateLimiter } from "./middleware/rateLimiter.ts";
import { securityHeaders } from "./middleware/securityHeaders.ts";
import { validateApiKey } from "./middleware/apiKey.ts";
import { rbac } from "./middleware/rbac.ts";

// Utilities
import { hashPassword } from "./utils/password.ts";

// Types
import { User, UserType } from "./types/user.ts";

// Load environment variables
await load({ export: true });

const app = new Application();
const router = new Router();

// Connect to KV database
await connect();

// Initialize admin user if no users exist
await initAdminUser();

// Initialize system roles if they don't exist
await initializeRoles();

// Initialize the scheduler for scheduled posts
await initializeScheduler();

// Function to initialize admin user if none exists
async function initAdminUser() {
  const kv = getKv();
  const entries = kv.list<User>({ prefix: [KV_COLLECTIONS.USERS] });
  let userExists = false;

  for await (const _entry of entries) {
    userExists = true;
    break;
  }

  if (!userExists) {
    console.log("No users found. Creating default admin user...");

    // Hash password with native crypto
    const hashedPassword = await hashPassword("admin123");

    // Create admin user
    const adminUser = {
      id: crypto.randomUUID(),
      username: "admin",
      email: "admin@charityshelter.org",
      password: hashedPassword,
      userType: UserType.ADMIN,
      roles: ["SuperAdmin"], // Use SuperAdmin role from our roles system
      firstName: "Admin",
      lastName: "User",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true,
    };

    // Save to KV
    await kv.set([KV_COLLECTIONS.USERS, adminUser.id], adminUser);
    console.log("Admin user created successfully");

    // Create API key
    const apiKey = Deno.env.get("API_KEY") ||
      crypto.randomUUID().replace(/-/g, "");

    const apiKeyData = {
      key: apiKey,
      userId: adminUser.id,
      description: "Default Admin API Key",
      createdAt: new Date().toISOString(),
      lastUsed: null,
    };

    // Save API key to KV
    await kv.set([KV_COLLECTIONS.API_KEYS, apiKey], apiKeyData);
    console.log(`API key created: ${apiKey}`);
    console.log(
      `Default admin credentials: admin@charityshelter.org / admin123`,
    );
  }
}

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

// Apply RBAC middleware to all requests
app.use(rbac);

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
app.use(swaggerRouter.routes());
app.use(swaggerRouter.allowedMethods());

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
v1Router.use("/bookings", bookingRoutes.publicRouter.routes());
v1Router.use("/patrons", patronRoutes.publicRouter.routes());
v1Router.use("/donations", donationRoutes.publicRouter.routes());

// Admin routes (protected)
v1Router.use("/admin", adminRoutes.adminRouter.routes());
v1Router.use("/admin/posts", postRoutes.adminRouter.routes());
v1Router.use("/admin/analytics", analyticsRoutes.adminRouter.routes());
v1Router.use("/admin/analytics/api", apiAnalyticsRoutes.adminRouter.routes());
v1Router.use("/admin/dashboard", dashboardAnalyticsRoutes.adminRouter.routes());
v1Router.use("/admin/organizations", organizationRoutes.adminRouter.routes());
v1Router.use("/admin/bookings", bookingRoutes.adminRouter.routes());
v1Router.use("/admin/roles", rolesRoutes.routes());
v1Router.use("/admin/patrons", patronRoutes.adminRouter.routes());
v1Router.use("/admin/donations", donationRoutes.adminRouter.routes());

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

// Apply API routers
app.use(authRouter.routes());
app.use(authRouter.allowedMethods());
app.use(postRouter.routes());
app.use(postRouter.allowedMethods());
app.use(organizationRouter.routes());
app.use(organizationRouter.allowedMethods());
app.use(adminRouter.routes());
app.use(adminRouter.allowedMethods());

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
