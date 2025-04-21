// services/scheduler.ts - Handles scheduled publishing of posts

import { getKv, KV_COLLECTIONS } from "../db/kv.ts";
import {
  processEventDonations,
  processRecurringDonations,
} from "./donation.ts";

/**
 * Check for and publish scheduled posts
 */
export async function checkScheduledPosts() {
  const kv = getKv();
  const now = new Date();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.POSTS] });

  for await (const entry of entries) {
    const post = entry.value;

    if (
      post.publishingStatus === "scheduled" &&
      post.scheduledPublishDate &&
      new Date(post.scheduledPublishDate) <= now
    ) {
      // Update post status to published
      const updatedPost = {
        ...post,
        isPublished: true,
        publishingStatus: "published",
        publishDate: now.toISOString(),
        lastModified: now.toISOString(),
      };

      await kv.set([KV_COLLECTIONS.POSTS, post.id], updatedPost);

      // Log the publishing event
      await kv.set([KV_COLLECTIONS.AUDIT, crypto.randomUUID()], {
        action: "SCHEDULED_PUBLISH",
        postId: post.id,
        timestamp: now.toISOString(),
      });
    }
  }
}

/**
 * Initialize the scheduler
 */
export function initializeScheduler() {
  // Check for scheduled posts every minute
  setInterval(checkScheduledPosts, 60000);
}

/**
 * Initialize all scheduler tasks
 */
export function initScheduler() {
  // Schedule donation processing tasks

  // Process recurring donations daily
  Deno.cron("Process Recurring Donations", "0 0 * * *", async () => {
    console.log("Running scheduled task: Process Recurring Donations");
    try {
      await processRecurringDonations();
      console.log("Successfully processed recurring donations");
    } catch (error) {
      console.error("Error processing recurring donations:", error);
    }
  });

  // Check for expired event donations daily
  Deno.cron("Process Event Donations", "0 1 * * *", async () => {
    console.log("Running scheduled task: Process Event Donations");
    try {
      await processEventDonations();
      console.log("Successfully processed event donations");
    } catch (error) {
      console.error("Error processing event donations:", error);
    }
  });
}
