// routes/bookings.ts - Booking management routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { generateId, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import { sanitizeHtml } from "../middleware/validation.ts";
import { verifyToken } from "../middleware/auth.ts";

// Public router - no authentication required for these routes
export const publicRouter = new Router();

// Admin router - authentication required for these routes
export const adminRouter = new Router();

// Apply authentication middleware to all admin routes
adminRouter.use(verifyToken);

// Create a new booking (public)
publicRouter.post("/", async (ctx) => {
  const bookingData = ctx.state.body;

  if (!bookingData || typeof bookingData !== "object") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid request body" };
    return;
  }

  // Validate required fields
  const requiredFields = [
    "organizationName",
    "contactName",
    "contactEmail",
    "eventTitle",
    "eventDate",
    "eventType",
  ];

  for (const field of requiredFields) {
    if (!bookingData[field]) {
      ctx.response.status = 400;
      ctx.response.body = { error: `${field} is required` };
      return;
    }
  }

  // Validate event type
  if (
    !["visit_to_shelter", "invite_children"].includes(bookingData.eventType)
  ) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: "eventType must be either 'visit_to_shelter' or 'invite_children'",
    };
    return;
  }

  // Sanitize user input
  const sanitizedBooking = {
    organizationName: sanitizeHtml(bookingData.organizationName),
    contactName: sanitizeHtml(bookingData.contactName),
    contactEmail: sanitizeHtml(bookingData.contactEmail),
    contactPhone: bookingData.contactPhone
      ? sanitizeHtml(bookingData.contactPhone)
      : "",
    eventTitle: sanitizeHtml(bookingData.eventTitle),
    eventDescription: bookingData.eventDescription
      ? sanitizeHtml(bookingData.eventDescription)
      : "",
    eventDate: sanitizeHtml(bookingData.eventDate),
    eventTime: bookingData.eventTime ? sanitizeHtml(bookingData.eventTime) : "",
    eventLocation: bookingData.eventLocation
      ? sanitizeHtml(bookingData.eventLocation)
      : "",
    eventType: sanitizeHtml(bookingData.eventType),
    numberOfAttendees: bookingData.numberOfAttendees || 0,
    numberOfChildrenInvited: bookingData.numberOfChildrenInvited || 0,
    specialRequirements: bookingData.specialRequirements
      ? sanitizeHtml(bookingData.specialRequirements)
      : "",
    status: "pending",
  };

  const id = generateId();
  const timestamp = new Date().toISOString();

  const newBooking = {
    id,
    ...sanitizedBooking,
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  // Save to KV
  const kv = getKv();
  await kv.set([KV_COLLECTIONS.BOOKINGS, id], newBooking);

  // Return the booking with ID
  ctx.response.status = 201;
  ctx.response.body = newBooking;
});

// Get booking status by ID (public)
publicRouter.get("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Booking ID is required" };
    return;
  }

  const kv = getKv();
  const booking = await kv.get<any>([KV_COLLECTIONS.BOOKINGS, id]);

  if (!booking.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Booking not found" };
    return;
  }

  // Return limited public information
  ctx.response.body = {
    id: booking.value.id,
    eventTitle: booking.value.eventTitle,
    eventDate: booking.value.eventDate,
    status: booking.value.status,
    createdAt: booking.value.createdAt,
  };
});

// Get all bookings (admin)
adminRouter.get("/", async (ctx) => {
  const kv = getKv();
  const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.BOOKINGS] });

  const bookings = [];
  for await (const entry of entries) {
    bookings.push(entry.value);
  }

  ctx.response.body = bookings;
});

// Get booking by ID (admin)
adminRouter.get("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Booking ID is required" };
    return;
  }

  const kv = getKv();
  const booking = await kv.get<any>([KV_COLLECTIONS.BOOKINGS, id]);

  if (!booking.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Booking not found" };
    return;
  }

  ctx.response.body = booking.value;
});

// Update booking status (admin)
adminRouter.put("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Booking ID is required" };
    return;
  }

  const updateData = ctx.state.body;
  if (!updateData || typeof updateData !== "object") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid request body" };
    return;
  }

  const kv = getKv();
  const existingBooking = await kv.get<any>([KV_COLLECTIONS.BOOKINGS, id]);

  if (!existingBooking.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Booking not found" };
    return;
  }

  // Validate status if it's being updated
  if (
    updateData.status &&
    !["pending", "approved", "rejected", "cancelled"].includes(
      updateData.status,
    )
  ) {
    ctx.response.status = 400;
    ctx.response.body = {
      error: "status must be 'pending', 'approved', 'rejected', or 'cancelled'",
    };
    return;
  }

  // Sanitize input
  const sanitizedUpdate: Record<string, string | number> = {};
  const allowedFields = [
    "status",
    "adminNotes",
    "eventDate",
    "eventTime",
    "eventLocation",
    "numberOfAttendees",
    "numberOfChildrenInvited",
    "specialRequirements",
  ];

  for (const field of allowedFields) {
    if (updateData[field] !== undefined) {
      sanitizedUpdate[field] = typeof updateData[field] === "string"
        ? sanitizeHtml(updateData[field])
        : updateData[field];
    }
  }

  const updatedBooking = {
    ...existingBooking.value,
    ...sanitizedUpdate,
    updatedAt: new Date().toISOString(),
    updatedBy: ctx.state.user?.id || "unknown",
  };

  // Save to KV
  await kv.set([KV_COLLECTIONS.BOOKINGS, id], updatedBooking);

  // Return the updated booking
  ctx.response.body = updatedBooking;
});

// Delete booking (admin)
adminRouter.delete("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Booking ID is required" };
    return;
  }

  const kv = getKv();
  const booking = await kv.get<any>([KV_COLLECTIONS.BOOKINGS, id]);

  if (!booking.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Booking not found" };
    return;
  }

  // Delete the booking
  await kv.delete([KV_COLLECTIONS.BOOKINGS, id]);

  // Log audit trail
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: "DELETE_BOOKING",
    bookingId: id,
    userId: ctx.state.user?.id || "unknown",
    timestamp: new Date().toISOString(),
  });

  ctx.response.status = 204; // No content
});
