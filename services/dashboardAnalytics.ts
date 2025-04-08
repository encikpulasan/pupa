import { getKv, KV_COLLECTIONS } from "../db/kv.ts";

export interface UserStats {
  total: number;
  change: number;
  active: number;
  new: number;
}

export interface PostStats {
  total: number;
  change: number;
  published: number;
  drafts: number;
  popular: {
    id: string;
    title: string;
    views: number;
  }[];
}

export interface LocationStats {
  total: number;
  active: number;
  inactive: number;
}

export interface RequestStats {
  total: number;
  change: number;
  byEndpoint: {
    endpoint: string;
    count: number;
  }[];
}

export interface ActivityItem {
  type: string;
  user: string;
  action: string;
  timestamp: string;
}

/**
 * Get user statistics
 */
export async function getUserStats(): Promise<UserStats> {
  const kv = getKv();
  const users = kv.list<any>({ prefix: [KV_COLLECTIONS.USERS] });

  let total = 0;
  let active = 0;
  let newUsers = 0;
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  for await (const user of users) {
    total++;
    if (user.value.isActive) {
      active++;
    }
    if (new Date(user.value.createdAt) >= thirtyDaysAgo) {
      newUsers++;
    }
  }

  // Calculate change (mock data for now)
  const change = Math.floor(Math.random() * 20) - 10;

  return {
    total,
    change,
    active,
    new: newUsers,
  };
}

/**
 * Get post statistics
 */
export async function getPostStats(): Promise<PostStats> {
  const kv = getKv();
  const posts = kv.list<any>({ prefix: [KV_COLLECTIONS.POSTS] });

  let total = 0;
  let published = 0;
  let drafts = 0;
  const popularPosts: { id: string; title: string; views: number }[] = [];

  for await (const post of posts) {
    total++;
    if (post.value.isPublished) {
      published++;
    } else {
      drafts++;
    }

    // Add to popular posts if published and has views
    if (post.value.isPublished && post.value.viewCount > 0) {
      popularPosts.push({
        id: post.value.id,
        title: post.value.title,
        views: post.value.viewCount,
      });
    }
  }

  // Sort by views and take top 5
  popularPosts.sort((a, b) => b.views - a.views);
  const topPopular = popularPosts.slice(0, 5);

  // Calculate change (mock data for now)
  const change = Math.floor(Math.random() * 10) - 5;

  return {
    total,
    change,
    published,
    drafts,
    popular: topPopular,
  };
}

/**
 * Get location statistics
 */
export async function getLocationStats(): Promise<LocationStats> {
  const kv = getKv();
  const organizations = kv.list<any>({ prefix: [KV_COLLECTIONS.ORGANIZATION] });

  let total = 0;
  let active = 0;
  let inactive = 0;

  for await (const org of organizations) {
    total++;
    if (org.value.isActive) {
      active++;
    } else {
      inactive++;
    }
  }

  return {
    total,
    active,
    inactive,
  };
}

/**
 * Get request statistics
 */
export async function getRequestStats(): Promise<RequestStats> {
  const kv = getKv();
  const entries = kv.list<any>({
    prefix: [KV_COLLECTIONS.API_METRICS, "metrics:overall"],
  });

  let total = 0;
  const byEndpoint: { endpoint: string; count: number }[] = [];

  for await (const entry of entries) {
    const endpoint = entry.key.split(":")[2]; // Extract endpoint from key
    const count = entry.value.totalCalls || 0;
    total += count;
    byEndpoint.push({ endpoint, count });
  }

  // Sort by count and take top 5
  byEndpoint.sort((a, b) => b.count - a.count);
  const topEndpoints = byEndpoint.slice(0, 5);

  // Calculate change (mock data for now)
  const change = Math.floor(Math.random() * 1000) - 500;

  return {
    total,
    change,
    byEndpoint: topEndpoints,
  };
}

/**
 * Get recent activity
 */
export async function getRecentActivity(): Promise<ActivityItem[]> {
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.API_EVENTS] });

  const activities: ActivityItem[] = [];
  const now = new Date();
  const fiveHoursAgo = new Date(now.getTime() - 5 * 60 * 60 * 1000);

  for await (const entry of entries) {
    const event = entry.value;
    const timestamp = new Date(event.timestamp);

    if (timestamp >= fiveHoursAgo) {
      activities.push({
        type: event.type,
        user: event.userId || "System",
        action: event.action || "Unknown action",
        timestamp: event.timestamp,
      });
    }
  }

  // Sort by timestamp and take most recent
  activities.sort((a, b) =>
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  return activities.slice(0, 8); // Return 8 most recent activities
}

/**
 * Get all dashboard analytics
 */
export async function getDashboardAnalytics() {
  const [userStats, postStats, locationStats, requestStats, recentActivity] =
    await Promise.all([
      getUserStats(),
      getPostStats(),
      getLocationStats(),
      getRequestStats(),
      getRecentActivity(),
    ]);

  return {
    userStats,
    postStats,
    locationStats,
    requestStats,
    recentActivity,
    lastUpdated: new Date().toISOString(),
  };
}
