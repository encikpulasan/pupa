// middleware/validator.ts - Request validation middleware

import { Middleware } from "https://deno.land/x/oak@v12.5.0/middleware.ts";

/**
 * Middleware to validate request body
 * This is a placeholder for a more comprehensive validation system
 */
export const validateRequest: Middleware = async (ctx, next) => {
  try {
    if (ctx.request.hasBody) {
      const body = ctx.request.body();

      if (body.type === "json") {
        // Store the parsed body in context.state for reuse
        ctx.state.requestBody = await body.value;
      } else {
        ctx.response.status = 415; // Unsupported Media Type
        ctx.response.body = {
          success: false,
          message: "Content type must be application/json",
        };
        return;
      }
    }
    await next();
  } catch (error) {
    ctx.response.status = 400;
    ctx.response.body = {
      success: false,
      message: "Invalid request body",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
};
