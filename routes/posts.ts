// routes/posts.ts - Post management routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { generateId, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import {
  postSchema,
  sanitizeHtml,
  validateInput,
} from "../middleware/validation.ts";
import { logSuspiciousActivity } from "../middleware/logging.ts";
import { verifyToken } from "../middleware/auth.ts";

// Public router - no authentication required for these routes
export const publicRouter = new Router();

// Admin router - authentication required for these routes
export const adminRouter = new Router();

// Apply authentication middleware to all admin routes
adminRouter.use(verifyToken);

// Get all published posts (public)
publicRouter.get("/", async (ctx) => {
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.POSTS] });

  const posts = [];
  for await (const entry of entries) {
    // Only return published posts for public access
    if (entry.value.isPublished) {
      posts.push(entry.value);
    }
  }

  ctx.response.body = posts;
});

// Get post by ID (public)
publicRouter.get("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Post ID is required" };
    return;
  }

  const kv = getKv();
  const post = await kv.get<any>([KV_COLLECTIONS.POSTS, id]);

  if (!post.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Post not found" };
    return;
  }

  // Only return the post if it's published
  if (!post.value.isPublished) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Post not found" };
    return;
  }

  ctx.response.body = post.value;
});

// Search posts (public)
publicRouter.get("/search/:term", async (ctx) => {
  const { term } = ctx.params;
  if (!term) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Search term is required" };
    return;
  }

  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.POSTS] });

  const searchTerm = term.toLowerCase();
  const results = [];

  for await (const entry of entries) {
    const post = entry.value;
    // Only include published posts in search results
    if (
      post.isPublished &&
      (post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.tags.toLowerCase().includes(searchTerm) ||
        post.type.toLowerCase().includes(searchTerm))
    ) {
      results.push(post);
    }
  }

  ctx.response.body = results;
});

// Get posts by type (public)
publicRouter.get("/type/:type", async (ctx) => {
  const { type } = ctx.params;
  if (!type) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Post type is required" };
    return;
  }

  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.POSTS] });

  const posts = [];
  for await (const entry of entries) {
    // Only return published posts of the specified type
    if (
      entry.value.isPublished &&
      entry.value.type.toLowerCase() === type.toLowerCase()
    ) {
      posts.push(entry.value);
    }
  }

  ctx.response.body = posts;
});

// ----- ADMIN ROUTES (Protected) -----

// Get all posts (admin)
adminRouter.get("/", async (ctx) => {
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.POSTS] });

  const posts = [];
  for await (const entry of entries) {
    posts.push(entry.value);
  }

  ctx.response.body = posts;
});

// Get post by ID (admin)
adminRouter.get("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Post ID is required" };
    return;
  }

  const kv = getKv();
  const post = await kv.get<any>([KV_COLLECTIONS.POSTS, id]);

  if (!post.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Post not found" };
    return;
  }

  ctx.response.body = post.value;
});

// Create new post
adminRouter.post("/", validateInput(postSchema), async (ctx) => {
  const postData = ctx.state.body;

  // Sanitize user input
  const sanitizedPost = {
    title: sanitizeHtml(postData.title),
    subtitle: postData.subtitle ? sanitizeHtml(postData.subtitle) : "",
    content: sanitizeHtml(postData.content),
    summary: postData.summary ? sanitizeHtml(postData.summary) : "",
    imageUrl: postData.imageUrl ? sanitizeHtml(postData.imageUrl) : null,
    additionalImages: postData.additionalImages
      ? sanitizeHtml(postData.additionalImages)
      : "",
    type: sanitizeHtml(postData.type || "article"), // Default to article if not specified
    author: postData.author ? sanitizeHtml(postData.author) : "",
    category: postData.category ? sanitizeHtml(postData.category) : "",
    tags: postData.tags ? sanitizeHtml(postData.tags) : "",
    isPublished: Boolean(postData.isPublished),
    publishDate: postData.isPublished ? new Date().toISOString() : null,
    scheduledPublishDate: postData.scheduledPublishDate
      ? sanitizeHtml(postData.scheduledPublishDate)
      : null,
    metaDescription: postData.metaDescription
      ? sanitizeHtml(postData.metaDescription)
      : "",
    readingTime: postData.readingTime || 0,
    references: postData.references ? sanitizeHtml(postData.references) : "",
    relatedPosts: postData.relatedPosts
      ? sanitizeHtml(postData.relatedPosts)
      : "",
    status: sanitizeHtml(postData.status || "draft"),
    viewCount: 0,
    uniqueViewCount: 0,
    viewHistory: "[]",
    averageReadTime: 0,
    bounceRate: 0,
  };

  const id = generateId();
  const userId = ctx.state.user?.id || "unknown";

  const newPost = {
    id,
    ...sanitizedPost,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to KV
  const kv = getKv();
  await kv.set([KV_COLLECTIONS.POSTS, id], newPost);

  // Log audit trail
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: "CREATE_POST",
    postId: id,
    userId,
    timestamp: new Date().toISOString(),
  });

  ctx.response.status = 201; // Created
  ctx.response.body = newPost;
});

// Update post
adminRouter.put("/:id", validateInput(postSchema), async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Post ID is required" };
    return;
  }

  const postData = ctx.state.body;
  const kv = getKv();
  const existingPost = await kv.get<any>([KV_COLLECTIONS.POSTS, id]);

  if (!existingPost.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Post not found" };
    return;
  }

  // Calculate publish date if status changes to published
  let publishDate = existingPost.value.publishDate;
  if (!existingPost.value.isPublished && postData.isPublished) {
    publishDate = new Date().toISOString();
  }

  // Sanitize user input
  const sanitizedPost = {
    title: sanitizeHtml(postData.title),
    subtitle: postData.subtitle
      ? sanitizeHtml(postData.subtitle)
      : existingPost.value.subtitle || "",
    content: sanitizeHtml(postData.content),
    summary: postData.summary
      ? sanitizeHtml(postData.summary)
      : existingPost.value.summary || "",
    imageUrl: postData.imageUrl
      ? sanitizeHtml(postData.imageUrl)
      : existingPost.value.imageUrl,
    additionalImages: postData.additionalImages
      ? sanitizeHtml(postData.additionalImages)
      : existingPost.value.additionalImages || "",
    type: postData.type
      ? sanitizeHtml(postData.type)
      : existingPost.value.type || "article",
    author: postData.author
      ? sanitizeHtml(postData.author)
      : existingPost.value.author || "",
    category: postData.category
      ? sanitizeHtml(postData.category)
      : existingPost.value.category || "",
    tags: postData.tags
      ? sanitizeHtml(postData.tags)
      : existingPost.value.tags || "",
    isPublished: postData.isPublished !== undefined
      ? Boolean(postData.isPublished)
      : existingPost.value.isPublished,
    publishDate: publishDate,
    scheduledPublishDate: postData.scheduledPublishDate
      ? sanitizeHtml(postData.scheduledPublishDate)
      : existingPost.value.scheduledPublishDate,
    metaDescription: postData.metaDescription
      ? sanitizeHtml(postData.metaDescription)
      : existingPost.value.metaDescription || "",
    readingTime: postData.readingTime || existingPost.value.readingTime || 0,
    references: postData.references
      ? sanitizeHtml(postData.references)
      : existingPost.value.references || "",
    relatedPosts: postData.relatedPosts
      ? sanitizeHtml(postData.relatedPosts)
      : existingPost.value.relatedPosts || "",
    status: postData.status
      ? sanitizeHtml(postData.status)
      : existingPost.value.status || "draft",
  };

  const userId = ctx.state.user?.id || "unknown";

  const updatedPost = {
    ...existingPost.value,
    ...sanitizedPost,
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  };

  // Save to KV
  await kv.set([KV_COLLECTIONS.POSTS, id], updatedPost);

  // Log audit trail
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: "UPDATE_POST",
    postId: id,
    userId,
    timestamp: new Date().toISOString(),
  });

  ctx.response.body = updatedPost;
});

// Delete post
adminRouter.delete("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Post ID is required" };
    return;
  }

  const kv = getKv();
  const existingPost = await kv.get([KV_COLLECTIONS.POSTS, id]);

  if (!existingPost.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Post not found" };
    return;
  }

  // Delete from KV
  await kv.delete([KV_COLLECTIONS.POSTS, id]);

  // Log audit trail
  const userId = ctx.state.user?.id || "unknown";
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: "DELETE_POST",
    postId: id,
    userId,
    timestamp: new Date().toISOString(),
  });

  ctx.response.status = 204; // No Content
});

// Publish/unpublish post
adminRouter.patch("/:id/publish", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Post ID is required" };
    return;
  }

  const { isPublished } = ctx.state.body;
  if (isPublished === undefined) {
    ctx.response.status = 400;
    ctx.response.body = { error: "isPublished status is required" };
    return;
  }

  const kv = getKv();
  const existingPost = await kv.get<any>([KV_COLLECTIONS.POSTS, id]);

  if (!existingPost.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Post not found" };
    return;
  }

  const userId = ctx.state.user?.id || "unknown";

  const updatedPost = {
    ...existingPost.value,
    isPublished: Boolean(isPublished),
    publishDate: isPublished && !existingPost.value.isPublished
      ? new Date().toISOString()
      : existingPost.value.publishDate,
    status: isPublished ? "published" : "draft",
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  };

  // Save to KV
  await kv.set([KV_COLLECTIONS.POSTS, id], updatedPost);

  // Log audit trail
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: isPublished ? "PUBLISH_POST" : "UNPUBLISH_POST",
    postId: id,
    userId,
    timestamp: new Date().toISOString(),
  });

  ctx.response.body = updatedPost;
});

// Export both routers
export default {
  publicRouter,
  adminRouter,
};
