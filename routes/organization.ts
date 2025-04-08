// routes/organization.ts - Organization management routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { generateId, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import {
  organizationSchema,
  sanitizeHtml,
  validateInput,
} from "../middleware/validation.ts";
import { requireAuth } from "../middleware/auth.ts";
import {
  createBranch,
  createOrganization,
  deleteBranch,
  deleteOrganization,
  getBranch,
  getOrganization,
  getPublicOrganization,
  listOrganizations,
  listPublicOrganizations,
  updateBranch,
  updateOrganization,
} from "../services/organization.ts";
import {
  CreateBranchRequest,
  CreateOrganizationRequest,
  UpdateBranchRequest,
  UpdateOrganizationRequest,
} from "../types/organization.ts";

// Admin routes
const adminRouter = new Router();

// Public routes
const publicRouter = new Router();

// Get organization info (admin)
adminRouter.get("/", async (ctx) => {
  const kv = getKv();

  ctx.response.headers.set("Content-Type", "application/json");

  // Check for organization info document first
  const organizationData = await kv.get([KV_COLLECTIONS.ORGANIZATION, "info"]);

  if (organizationData.value) {
    ctx.response.body = organizationData.value;
    return;
  }

  // If no specific info document found, try to get the first organization from the collection
  const entries = kv.list({ prefix: [KV_COLLECTIONS.ORGANIZATION] });
  const organizations = [];

  for await (const entry of entries) {
    if (entry.value) {
      organizations.push(entry.value);
    }
  }

  if (organizations.length > 0) {
    ctx.response.body = organizations[0];
    return;
  }

  // If no organizations found at all
  ctx.response.status = 404;
  ctx.response.body = { error: "Organization information not found" };
});

// Update organization info
adminRouter.put("/", validateInput(organizationSchema), async (ctx) => {
  const organizationData = ctx.state.body;

  if (!organizationData || typeof organizationData !== "object") {
    ctx.response.status = 400;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = {
      error: "Validation failed",
      details: "Invalid request body format",
    };
    return;
  }

  const requiredFields = ["name", "description", "address", "phone", "email"];
  const missingFields = requiredFields.filter((field) =>
    !organizationData[field]
  );

  if (missingFields.length > 0) {
    ctx.response.status = 400;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = {
      error: "Validation failed",
      details: `Missing required fields: ${missingFields.join(", ")}`,
    };
    return;
  }

  // Sanitize user input
  const sanitizedData = {
    name: sanitizeHtml(organizationData.name),
    description: sanitizeHtml(organizationData.description),
    address: sanitizeHtml(organizationData.address),
    phone: sanitizeHtml(organizationData.phone),
    email: sanitizeHtml(organizationData.email),
    website: organizationData.website
      ? sanitizeHtml(organizationData.website)
      : "",
    socialMedia: organizationData.socialMedia
      ? sanitizeHtml(organizationData.socialMedia)
      : "",
  };

  const userId = ctx.state.user?.id || "unknown";

  const kv = getKv();
  const existingData = await kv.get<any>([KV_COLLECTIONS.ORGANIZATION, "info"]);

  const updatedOrganization = {
    ...(existingData.value || {}),
    ...sanitizedData,
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  };

  // If this is the first time setting org info, add created timestamps
  if (!existingData.value) {
    updatedOrganization.createdBy = userId;
    updatedOrganization.createdAt = new Date().toISOString();
  }

  // Save to KV
  await kv.set([KV_COLLECTIONS.ORGANIZATION, "info"], updatedOrganization);

  // Log audit trail
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: "UPDATE_ORGANIZATION",
    userId,
    timestamp: new Date().toISOString(),
  });

  ctx.response.body = updatedOrganization;
});

// Add location
adminRouter.post("/locations", async (ctx) => {
  const locationData = ctx.state.body;

  if (!locationData || typeof locationData !== "object") {
    ctx.response.status = 400;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = {
      error: "Validation failed",
      details: "Invalid request body format",
    };
    return;
  }

  if (!locationData.name || !locationData.address) {
    ctx.response.status = 400;
    ctx.response.headers.set("Content-Type", "application/json");
    ctx.response.body = {
      error: "Validation failed",
      details: "Location name and address are required fields",
    };
    return;
  }

  // Sanitize user input
  const sanitizedLocation = {
    name: sanitizeHtml(locationData.name),
    address: sanitizeHtml(locationData.address),
    phone: locationData.phone ? sanitizeHtml(locationData.phone) : "",
    email: locationData.email ? sanitizeHtml(locationData.email) : "",
    description: locationData.description
      ? sanitizeHtml(locationData.description)
      : "",
  };

  const id = generateId();
  const userId = ctx.state.user?.id || "unknown";

  const newLocation = {
    id,
    ...sanitizedLocation,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Save to KV
  const kv = getKv();
  await kv.set([KV_COLLECTIONS.ORGANIZATION, "locations", id], newLocation);

  // Log audit trail
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: "ADD_LOCATION",
    locationId: id,
    userId,
    timestamp: new Date().toISOString(),
  });

  ctx.response.status = 201; // Created
  ctx.response.body = newLocation;
});

// Get all locations (admin)
adminRouter.get("/locations", async (ctx) => {
  const kv = getKv();
  const entries = kv.list<any>({
    prefix: [KV_COLLECTIONS.ORGANIZATION, "locations"],
  });

  const locations = [];
  for await (const entry of entries) {
    locations.push(entry.value);
  }

  ctx.response.body = locations;
});

// Update location
adminRouter.put("/locations/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Location ID is required" };
    return;
  }

  const locationData = ctx.state.body;

  if (!locationData.name || !locationData.address) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Location name and address are required" };
    return;
  }

  const kv = getKv();
  const existingLocation = await kv.get<any>([
    KV_COLLECTIONS.ORGANIZATION,
    "locations",
    id,
  ]);

  if (!existingLocation.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Location not found" };
    return;
  }

  // Sanitize user input
  const sanitizedLocation = {
    name: sanitizeHtml(locationData.name),
    address: sanitizeHtml(locationData.address),
    phone: locationData.phone
      ? sanitizeHtml(locationData.phone)
      : existingLocation.value.phone,
    email: locationData.email
      ? sanitizeHtml(locationData.email)
      : existingLocation.value.email,
    description: locationData.description
      ? sanitizeHtml(locationData.description)
      : existingLocation.value.description,
  };

  const userId = ctx.state.user?.id || "unknown";

  const updatedLocation = {
    ...existingLocation.value,
    ...sanitizedLocation,
    updatedBy: userId,
    updatedAt: new Date().toISOString(),
  };

  // Save to KV
  await kv.set([KV_COLLECTIONS.ORGANIZATION, "locations", id], updatedLocation);

  // Log audit trail
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: "UPDATE_LOCATION",
    locationId: id,
    userId,
    timestamp: new Date().toISOString(),
  });

  ctx.response.body = updatedLocation;
});

// Delete location
adminRouter.delete("/locations/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Location ID is required" };
    return;
  }

  const kv = getKv();
  const existingLocation = await kv.get([
    KV_COLLECTIONS.ORGANIZATION,
    "locations",
    id,
  ]);

  if (!existingLocation.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Location not found" };
    return;
  }

  // Delete from KV
  await kv.delete([KV_COLLECTIONS.ORGANIZATION, "locations", id]);

  // Log audit trail
  const userId = ctx.state.user?.id || "unknown";
  await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
    action: "DELETE_LOCATION",
    locationId: id,
    userId,
    timestamp: new Date().toISOString(),
  });

  ctx.response.status = 204; // No Content
});

// ====== PUBLIC ROUTES ======

// Get all organizations
publicRouter.get("/", async (ctx) => {
  const kv = getKv();
  const entries = kv.list({ prefix: [KV_COLLECTIONS.ORGANIZATION] });

  const organizations = [];
  for await (const entry of entries) {
    // Exclude locations and other nested data
    if (
      entry.key.length === 2 && entry.key[0] === KV_COLLECTIONS.ORGANIZATION
    ) {
      organizations.push(entry.value);
    }
  }

  ctx.response.body = organizations;
});

// Get organization by ID
publicRouter.get("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Organization ID is required" };
    return;
  }

  const kv = getKv();
  const organizationData = await kv.get([KV_COLLECTIONS.ORGANIZATION, id]);

  if (!organizationData.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Organization not found" };
    return;
  }

  ctx.response.body = organizationData.value;
});

// Get organization locations
publicRouter.get("/:id/locations", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Organization ID is required" };
    return;
  }

  const kv = getKv();
  // First verify the organization exists
  const organizationData = await kv.get([KV_COLLECTIONS.ORGANIZATION, id]);

  if (!organizationData.value) {
    ctx.response.status = 404;
    ctx.response.body = { error: "Organization not found" };
    return;
  }

  // Get all locations for this organization
  const entries = kv.list<any>({
    prefix: [KV_COLLECTIONS.ORGANIZATION, "locations"],
  });

  const locations = [];
  for await (const entry of entries) {
    locations.push(entry.value);
  }

  ctx.response.body = locations;
});

// Admin routes (auth required)
adminRouter.post("/", requireAuth, async (ctx) => {
  try {
    const data = ctx.state.body as CreateOrganizationRequest;
    const organization = await createOrganization(data);
    ctx.response.status = 201;
    ctx.response.body = organization;
  } catch (error: unknown) {
    console.error("Error creating organization:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});

// Update an organization
adminRouter.put("/:id", requireAuth, async (ctx) => {
  try {
    const { id } = ctx.params;
    const data = ctx.state.body as UpdateOrganizationRequest;
    const organization = await updateOrganization(id, data);
    if (!organization) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Organization not found" };
      return;
    }
    ctx.response.body = organization;
  } catch (error: unknown) {
    console.error("Error updating organization:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});

// Delete an organization
adminRouter.delete("/:id", requireAuth, async (ctx) => {
  try {
    const { id } = ctx.params;
    const success = await deleteOrganization(id);
    if (!success) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Organization not found" };
      return;
    }
    ctx.response.status = 204;
  } catch (error: unknown) {
    console.error("Error deleting organization:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});

// Branch routes (admin only)
adminRouter.post("/:organizationId/branches", requireAuth, async (ctx) => {
  try {
    const { organizationId } = ctx.params;
    const data = ctx.state.body as CreateBranchRequest;
    const branch = await createBranch(organizationId, data);
    if (!branch) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Organization not found" };
      return;
    }
    ctx.response.status = 201;
    ctx.response.body = branch;
  } catch (error: unknown) {
    console.error("Error creating branch:", error);
    ctx.response.status = 500;
    ctx.response.body = {
      error: error instanceof Error ? error.message : "Internal server error",
    };
  }
});

adminRouter.put(
  "/:organizationId/branches/:branchId",
  requireAuth,
  async (ctx) => {
    try {
      const { branchId } = ctx.params;
      const data = ctx.state.body as UpdateBranchRequest;
      const branch = await updateBranch(branchId, data);
      if (!branch) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Branch not found" };
        return;
      }
      ctx.response.body = branch;
    } catch (error: unknown) {
      console.error("Error updating branch:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  },
);

adminRouter.delete(
  "/:organizationId/branches/:branchId",
  requireAuth,
  async (ctx) => {
    try {
      const { branchId } = ctx.params;
      const success = await deleteBranch(branchId);
      if (!success) {
        ctx.response.status = 404;
        ctx.response.body = { error: "Branch not found" };
        return;
      }
      ctx.response.status = 204;
    } catch (error: unknown) {
      console.error("Error deleting branch:", error);
      ctx.response.status = 500;
      ctx.response.body = {
        error: error instanceof Error ? error.message : "Internal server error",
      };
    }
  },
);

export default {
  publicRouter,
  adminRouter,
};
