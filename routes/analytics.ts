// routes/analytics.ts - Analytics routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { getKv, KV_COLLECTIONS } from "../db/kv.ts";
import {
  getAnalyticsSummary,
  getPostAnalytics,
  getTrendingPosts,
} from "../services/analytics.ts";
import { verifyToken } from "../middleware/auth.ts";

// Public router - no authentication required for these routes
export const publicRouter = new Router();

// Admin router - authentication required for these routes
export const adminRouter = new Router();

// Apply authentication middleware to all admin routes
adminRouter.use(verifyToken);

// Get dashboard analytics (admin)
adminRouter.get("/dashboard", async (ctx) => {
  try {
    const summary = await getAnalyticsSummary();
    const trending = await getTrendingPosts(5);

    ctx.response.body = {
      summary,
      trending,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error: unknown) {
    console.error("Error fetching dashboard analytics:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});

// Get analytics for a specific post (admin)
adminRouter.get("/posts/:id", async (ctx) => {
  const { id } = ctx.params;

  try {
    const analytics = await getPostAnalytics(id);
    ctx.response.body = analytics;
  } catch (error: unknown) {
    console.error("Error fetching post analytics:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});

// Get trending posts (admin)
adminRouter.get("/trending", async (ctx) => {
  try {
    const limit = ctx.request.url.searchParams.get("limit");
    const trending = await getTrendingPosts(limit ? parseInt(limit) : 5);
    ctx.response.body = trending;
  } catch (error: unknown) {
    console.error("Error fetching trending posts:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});

// Get post analytics over time (admin)
adminRouter.get("/posts/:id/timeline", async (ctx) => {
  const { id } = ctx.params;
  const kv = getKv();
  const post = await kv.get<any>([KV_COLLECTIONS.POSTS, id]);

  if (!post.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Post not found" };
    return;
  }

  const viewHistory = post.value.viewHistory
    ? JSON.parse(post.value.viewHistory)
    : [];

  // Group views by day
  const timelineData = viewHistory.reduce(
    (acc: Record<string, any>, view: any) => {
      const date = new Date(view.timestamp).toISOString().split("T")[0];

      if (!acc[date]) {
        acc[date] = {
          date,
          views: 0,
          uniqueSessions: new Set(),
          totalReadTime: 0,
          completedReads: 0,
          bounces: 0,
        };
      }

      acc[date].views++;
      acc[date].uniqueSessions.add(view.sessionId);

      if (view.duration) {
        acc[date].totalReadTime += view.duration;
      }

      if (view.readPercentage && view.readPercentage > 80) {
        acc[date].completedReads++;
      }

      if (view.readPercentage && view.readPercentage < 10) {
        acc[date].bounces++;
      }

      return acc;
    },
    {},
  );

  // Convert to array and calculate daily metrics
  const timeline = Object.values(timelineData).map((day: any) => ({
    date: day.date,
    views: day.views,
    uniqueVisitors: day.uniqueSessions.size,
    averageReadTime: day.views > 0 ? day.totalReadTime / day.views : 0,
    completionRate: day.views > 0 ? (day.completedReads / day.views) * 100 : 0,
    bounceRate: day.views > 0 ? (day.bounces / day.views) * 100 : 0,
  }));

  ctx.response.body = {
    id: post.value.id,
    title: post.value.title,
    timeline: timeline.sort((a: any, b: any) => a.date.localeCompare(b.date)),
  };
});

// Get analytics comparison between posts (admin)
adminRouter.get("/compare", async (ctx) => {
  const postIds = ctx.request.url.searchParams.get("ids")?.split(",") || [];
  const kv = getKv();

  if (postIds.length === 0) {
    ctx.response.status = 400;
    ctx.response.body = { error: "No post IDs provided" };
    return;
  }

  try {
    const comparisons = await Promise.all(
      postIds.map(async (id) => {
        const analytics = await getPostAnalytics(id);
        const post = await kv.get<any>([KV_COLLECTIONS.POSTS, id]);

        return {
          id,
          title: post.value?.title || "Unknown",
          metrics: analytics,
        };
      }),
    );

    ctx.response.body = comparisons;
  } catch (error: unknown) {
    console.error("Error comparing posts:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});

// Get real-time analytics (last hour) (admin)
adminRouter.get("/realtime", async (ctx) => {
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.POSTS] });
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const realtimeStats = {
    activeVisitors: 0,
    pageViews: 0,
    topPosts: [] as any[],
    viewsPerMinute: new Array(60).fill(0),
  };

  for await (const entry of entries) {
    if (entry.value.viewHistory) {
      const viewHistory = JSON.parse(entry.value.viewHistory);
      const recentViews = viewHistory.filter((v: any) =>
        new Date(v.timestamp) >= hourAgo
      );

      if (recentViews.length > 0) {
        // Count views in the last 5 minutes as "active visitors"
        const activeViews = recentViews.filter(
          (v: any) =>
            new Date(v.timestamp) >= new Date(now.getTime() - 5 * 60 * 1000),
        );

        realtimeStats.activeVisitors += new Set(activeViews.map((v: any) =>
          v.sessionId
        )).size;
        realtimeStats.pageViews += recentViews.length;

        // Add to top posts if has recent views
        realtimeStats.topPosts.push({
          id: entry.value.id,
          title: entry.value.title,
          recentViews: recentViews.length,
          activeVisitors: new Set(activeViews.map((v: any) =>
            v.sessionId
          )).size,
        });

        // Aggregate views per minute
        recentViews.forEach((view: any) => {
          const minutesAgo = Math.floor(
            (now.getTime() - new Date(view.timestamp).getTime()) / 60000,
          );
          if (minutesAgo >= 0 && minutesAgo < 60) {
            realtimeStats.viewsPerMinute[minutesAgo]++;
          }
        });
      }
    }
  }

  // Sort and limit top posts
  realtimeStats.topPosts.sort((a, b) => b.activeVisitors - a.activeVisitors);
  realtimeStats.topPosts = realtimeStats.topPosts.slice(0, 5);

  ctx.response.body = {
    ...realtimeStats,
    timestamp: now.toISOString(),
  };
});
