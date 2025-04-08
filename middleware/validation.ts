// middleware/validation.ts - Input validation utilities

import { Context, Next } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import {
  flattenMessages,
  isDate,
  isEmail,
  isNumber,
  isString,
  maxLength,
  minLength,
  required,
  validate,
} from "https://deno.land/x/validasaur@v0.15.0/mod.ts";
import { logSuspiciousActivity } from "./logging.ts";

/**
 * Input validation middleware
 */
export function validateInput(schema: any) {
  return async (ctx: Context, next: Next) => {
    // Get request body
    const body = ctx.state.body;

    if (!body) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Request body is required" };
      return;
    }

    // Validate input data
    const [passes, errors] = await validate(body, schema);

    if (!passes) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Validation failed",
        details: flattenMessages(errors),
      };

      // Log validation failures that might indicate tampering
      if (Object.keys(errors).length > 5) {
        logSuspiciousActivity({
          type: "VALIDATION_FAILURE",
          ip: ctx.request.ip,
          path: ctx.request.url.pathname,
          errors: flattenMessages(errors),
        });
      }

      return;
    }

    await next();
  };
}

/**
 * Sanitize input to prevent XSS attacks
 */
export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization
  return html
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Export validation schemas
export const postSchema = {
  title: [required, isString, minLength(3), maxLength(100)],
  subtitle: [isString, maxLength(200)],
  content: [required, isString, minLength(10)],
  summary: [isString, maxLength(500)],
  imageUrl: [isString],
  additionalImages: [isString],
  type: [required, isString], // Required field for post type (article, news, announcement)
  author: [isString],
  category: [isString],
  tags: [isString],
  isPublished: [required],
  publishDate: [isString],
  scheduledPublishDate: [isString],
  lastModified: [isString],
  featuredImage: [isString],
  metaDescription: [isString, maxLength(160)],
  readingTime: [isNumber],
  references: [isString],
  relatedPosts: [isString],
  status: [isString],
  viewCount: [isNumber],
  uniqueViewCount: [isNumber],
  viewHistory: [isString], // JSON array of view timestamps
  averageReadTime: [isNumber],
  bounceRate: [isNumber],
  publishingStatus: [isString], // "draft", "scheduled", "published", "archived"
};

export const organizationSchema = {
  name: [required, isString, minLength(3), maxLength(100)],
  description: [required, isString, minLength(10)],
  address: [required, isString],
  phone: [required, isString],
  email: [required, isEmail],
  website: [isString],
  socialMedia: [isString],
};

export const userSchema = {
  username: [required, isString, minLength(3), maxLength(50)],
  email: [required, isEmail],
  password: [required, isString, minLength(8)],
  role: [required, isString],
  firstName: [isString],
  lastName: [isString],
  phoneNumber: [isString],
  address: [isString],
  bio: [isString],
  profilePicture: [isString],
  dateOfBirth: [isString],
  interests: [isString],
  skills: [isString],
  isActive: [isString],
};
