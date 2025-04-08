// services/analytics.ts - Handles article view tracking and analytics

import { getKv, KV_COLLECTIONS } from "../db/kv.ts";

interface ViewEvent {
  postId: string;
  userId?: string;
  sessionId: string;
  timestamp: string;
  duration?: number;
  readPercentage?: number;
  referrer?: string;
  userAgent?: string;
  deviceType?: string;
  country?: string;
  source?: string;
}

interface EngagementMetrics {
  totalViews: number;
  uniqueViews: number;
  averageReadTime: number;
  bounceRate: number;
  completionRate: number;
  deviceBreakdown: Record<string, number>;
  sourceBreakdown: Record<string, number>;
  countryBreakdown: Record<string, number>;
  timeOfDayBreakdown: Record<string, number>;
}

/**
 * Track a view event for an article
 */
export async function trackView(event: ViewEvent) {
  const kv = getKv();
  const post = await kv.get<any>([KV_COLLECTIONS.POSTS, event.postId]);

  if (!post.value) {
    throw new Error("Post not found");
  }

  // Get existing view history or initialize new one
  const viewHistory = post.value.viewHistory
    ? JSON.parse(post.value.viewHistory)
    : [];

  // Add new view event with enhanced tracking
  viewHistory.push({
    sessionId: event.sessionId,
    timestamp: event.timestamp,
    duration: event.duration,
    readPercentage: event.readPercentage,
    deviceType: event.deviceType || "unknown",
    country: event.country || "unknown",
    source: event.source || "direct",
    referrer: event.referrer,
    userAgent: event.userAgent,
    hour: new Date(event.timestamp).getHours(),
  });

  // Calculate basic metrics
  const uniqueSessions = new Set(viewHistory.map((v: any) => v.sessionId)).size;
  const totalViews = viewHistory.length;

  // Calculate engagement metrics
  const viewsWithDuration = viewHistory.filter((v: any) => v.duration);
  const averageReadTime = viewsWithDuration.length > 0
    ? viewsWithDuration.reduce((acc: number, v: any) => acc + v.duration, 0) /
      viewsWithDuration.length
    : 0;

  // Calculate completion rate (views with > 80% read)
  const completedViews =
    viewHistory.filter((v: any) => v.readPercentage && v.readPercentage > 80)
      .length;
  const completionRate = totalViews > 0
    ? (completedViews / totalViews) * 100
    : 0;

  // Calculate bounce rate (sessions with < 10% read percentage or < 10 seconds)
  const bouncedSessions =
    viewHistory.filter((v: any) =>
      (v.readPercentage && v.readPercentage < 10) ||
      (v.duration && v.duration < 10)
    ).length;
  const bounceRate = totalViews > 0 ? (bouncedSessions / totalViews) * 100 : 0;

  // Calculate device breakdown
  const deviceBreakdown = viewHistory.reduce(
    (acc: Record<string, number>, v: any) => {
      const device = v.deviceType || "unknown";
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    },
    {},
  );

  // Calculate source breakdown
  const sourceBreakdown = viewHistory.reduce(
    (acc: Record<string, number>, v: any) => {
      const source = v.source || "direct";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    },
    {},
  );

  // Calculate country breakdown
  const countryBreakdown = viewHistory.reduce(
    (acc: Record<string, number>, v: any) => {
      const country = v.country || "unknown";
      acc[country] = (acc[country] || 0) + 1;
      return acc;
    },
    {},
  );

  // Calculate time of day breakdown
  const timeOfDayBreakdown = viewHistory.reduce(
    (acc: Record<string, number>, v: any) => {
      const hour = v.hour || 0;
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    },
    {},
  );

  // Update post with new analytics
  const updatedPost = {
    ...post.value,
    viewCount: totalViews,
    uniqueViewCount: uniqueSessions,
    viewHistory: JSON.stringify(viewHistory),
    averageReadTime,
    completionRate,
    bounceRate,
    deviceBreakdown: JSON.stringify(deviceBreakdown),
    sourceBreakdown: JSON.stringify(sourceBreakdown),
    countryBreakdown: JSON.stringify(countryBreakdown),
    timeOfDayBreakdown: JSON.stringify(timeOfDayBreakdown),
    lastModified: new Date().toISOString(),
  };

  await kv.set([KV_COLLECTIONS.POSTS, event.postId], updatedPost);

  // Store detailed analytics event
  await kv.set([KV_COLLECTIONS.ANALYTICS, crypto.randomUUID()], {
    ...event,
    type: "VIEW",
  });
}

/**
 * Get analytics for a post
 */
export async function getPostAnalytics(
  postId: string,
): Promise<EngagementMetrics> {
  const kv = getKv();
  const post = await kv.get<any>([KV_COLLECTIONS.POSTS, postId]);

  if (!post.value) {
    throw new Error("Post not found");
  }

  return {
    totalViews: post.value.viewCount || 0,
    uniqueViews: post.value.uniqueViewCount || 0,
    averageReadTime: post.value.averageReadTime || 0,
    bounceRate: post.value.bounceRate || 0,
    completionRate: post.value.completionRate || 0,
    deviceBreakdown: post.value.deviceBreakdown
      ? JSON.parse(post.value.deviceBreakdown)
      : {},
    sourceBreakdown: post.value.sourceBreakdown
      ? JSON.parse(post.value.sourceBreakdown)
      : {},
    countryBreakdown: post.value.countryBreakdown
      ? JSON.parse(post.value.countryBreakdown)
      : {},
    timeOfDayBreakdown: post.value.timeOfDayBreakdown
      ? JSON.parse(post.value.timeOfDayBreakdown)
      : {},
  };
}

/**
 * Get trending posts based on recent views and engagement
 */
export async function getTrendingPosts(limit = 5) {
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.POSTS] });
  const posts = [];

  for await (const entry of entries) {
    if (entry.value.isPublished) {
      const viewHistory = entry.value.viewHistory
        ? JSON.parse(entry.value.viewHistory)
        : [];

      // Calculate recent views (last 24 hours)
      const recentDate = new Date();
      recentDate.setHours(recentDate.getHours() - 24);

      const recentViews = viewHistory.filter((v: any) =>
        new Date(v.timestamp) >= recentDate
      ).length;

      // Calculate engagement score
      const engagementScore = (
        (entry.value.completionRate || 0) * 0.4 + // 40% weight to completion rate
        (100 - (entry.value.bounceRate || 0)) * 0.3 + // 30% weight to inverse bounce rate
        (recentViews * 2) // Recent views boost
      );

      posts.push({
        id: entry.value.id,
        title: entry.value.title,
        viewCount: entry.value.viewCount || 0,
        recentViews,
        completionRate: entry.value.completionRate || 0,
        bounceRate: entry.value.bounceRate || 0,
        engagementScore,
      });
    }
  }

  // Sort by engagement score and return top posts
  return posts
    .sort((a, b) => b.engagementScore - a.engagementScore)
    .slice(0, limit);
}

/**
 * Get overall analytics summary
 */
export async function getAnalyticsSummary() {
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.POSTS] });

  let totalViews = 0;
  let totalEngagementTime = 0;
  const deviceTypes = new Set<string>();
  const countries = new Set<string>();
  const sources = new Set<string>();

  const summary = {
    totalPosts: 0,
    publishedPosts: 0,
    totalViews: 0,
    averageViewsPerPost: 0,
    averageEngagementTime: 0,
    totalUniqueVisitors: 0,
    deviceTypes: 0,
    countries: 0,
    sources: 0,
    topDevices: {} as Record<string, number>,
    topCountries: {} as Record<string, number>,
    topSources: {} as Record<string, number>,
  };

  for await (const entry of entries) {
    summary.totalPosts++;
    if (entry.value.isPublished) {
      summary.publishedPosts++;
    }

    totalViews += entry.value.viewCount || 0;
    totalEngagementTime += (entry.value.averageReadTime || 0) *
      (entry.value.viewCount || 0);

    // Process device types
    if (entry.value.deviceBreakdown) {
      const devices = JSON.parse(entry.value.deviceBreakdown);
      Object.entries(devices).forEach(([device, count]: [string, number]) => {
        deviceTypes.add(device);
        summary.topDevices[device] = (summary.topDevices[device] || 0) + count;
      });
    }

    // Process countries
    if (entry.value.countryBreakdown) {
      const countryData = JSON.parse(entry.value.countryBreakdown);
      Object.entries(countryData).forEach(
        ([country, count]: [string, number]) => {
          countries.add(country);
          summary.topCountries[country] = (summary.topCountries[country] || 0) +
            count;
        },
      );
    }

    // Process sources
    if (entry.value.sourceBreakdown) {
      const sourceData = JSON.parse(entry.value.sourceBreakdown);
      Object.entries(sourceData).forEach(
        ([source, count]: [string, number]) => {
          sources.add(source);
          summary.topSources[source] = (summary.topSources[source] || 0) +
            count;
        },
      );
    }
  }

  summary.totalViews = totalViews;
  summary.averageViewsPerPost = summary.publishedPosts > 0
    ? totalViews / summary.publishedPosts
    : 0;
  summary.averageEngagementTime = totalViews > 0
    ? totalEngagementTime / totalViews
    : 0;
  summary.deviceTypes = deviceTypes.size;
  summary.countries = countries.size;
  summary.sources = sources.size;

  // Sort and limit top breakdowns
  const sortAndLimit = (obj: Record<string, number>, limit = 5) =>
    Object.fromEntries(
      Object.entries(obj)
        .sort(([, a], [, b]) => b - a)
        .slice(0, limit),
    );

  summary.topDevices = sortAndLimit(summary.topDevices);
  summary.topCountries = sortAndLimit(summary.topCountries);
  summary.topSources = sortAndLimit(summary.topSources);

  return summary;
}
