// routes/donations.ts - Donation management routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { generateId, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import { sanitizeHtml } from "../middleware/validation.ts";
import { verifyToken } from "../middleware/auth.ts";
import {
  CreateDonationRequest,
  CreateDonationTransactionRequest,
  DonationStatus,
  DonationType,
  TransactionStatus,
  UpdateDonationRequest,
} from "../types/donation.ts";

// Public router - no authentication required for these routes
export const publicRouter = new Router();

// Admin router - authentication required for these routes
export const adminRouter = new Router();

// Apply authentication middleware to all admin routes
adminRouter.use(verifyToken);

// Get all donations (public)
publicRouter.get("/", async (ctx) => {
  try {
    const kv = getKv();
    const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.DONATIONS] });

    const donations = [];
    for await (const entry of entries) {
      // Only include active donations for public view
      if (entry.value.status === DonationStatus.ACTIVE) {
        donations.push(entry.value);
      }
    }

    ctx.response.body = donations;
  } catch (error) {
    console.error("Error fetching donations:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Get donation by ID (public)
publicRouter.get("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Donation ID is required" };
    return;
  }

  try {
    const kv = getKv();
    const donation = await kv.get<any>([KV_COLLECTIONS.DONATIONS, id]);

    if (!donation.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Donation not found" };
      return;
    }

    // Only return active donations to public
    if (donation.value.status !== DonationStatus.ACTIVE) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Donation not found or not active" };
      return;
    }

    ctx.response.body = donation.value;
  } catch (error) {
    console.error("Error fetching donation:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Process a donation payment (public)
publicRouter.post("/:id/donate", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Organization ID is required" };
    return;
  }

  const transactionData = ctx.state.body as CreateDonationTransactionRequest;
  if (!transactionData || typeof transactionData !== "object") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid request body" };
    return;
  }

  // Validate required fields
  const requiredFields = ["amount", "donorName", "paymentMethod"];
  for (const field of requiredFields) {
    if (!transactionData[field as keyof CreateDonationTransactionRequest]) {
      ctx.response.status = 400;
      ctx.response.body = { error: `${field} is required` };
      return;
    }
  }

  try {
    // Verify organization exists
    const kv = getKv();
    const organization = await kv.get<any>([KV_COLLECTIONS.ORGANIZATIONS, id]);
    if (!organization.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Organization not found" };
      return;
    }

    // Create donation transaction
    const transactionId = generateId();
    const timestamp = new Date().toISOString();

    // Sanitize user input
    const sanitizedData = {
      amount: transactionData.amount,
      donorName: sanitizeHtml(transactionData.donorName),
      donorEmail: transactionData.donorEmail
        ? sanitizeHtml(transactionData.donorEmail)
        : undefined,
      donorPhone: transactionData.donorPhone
        ? sanitizeHtml(transactionData.donorPhone)
        : undefined,
      donorMessage: transactionData.donorMessage
        ? sanitizeHtml(transactionData.donorMessage)
        : undefined,
      userId: transactionData.userId,
      isAnonymous: transactionData.isAnonymous || false,
      paymentMethod: sanitizeHtml(transactionData.paymentMethod),
    };

    const transaction = {
      id: transactionId,
      organizationId: id,
      status: TransactionStatus.COMPLETED, // Assume successful for now
      transactionReference: `tx-${Date.now()}`, // In a real app, this would be from payment processor
      ...sanitizedData,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Save to KV
    await kv.set(
      [KV_COLLECTIONS.DONATION_TRANSACTIONS, transactionId],
      transaction,
    );

    // Return the transaction confirmation
    ctx.response.status = 201;
    ctx.response.body = {
      id: transactionId,
      status: "completed",
      message: "Donation processed successfully",
      amount: transaction.amount,
      organization: organization.value.name,
    };
  } catch (error) {
    console.error("Error processing donation:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Get all donations (admin)
adminRouter.get("/", async (ctx) => {
  try {
    const kv = getKv();
    const entries = kv.list<any>({ prefix: [KV_COLLECTIONS.DONATIONS] });

    const donations = [];
    for await (const entry of entries) {
      donations.push(entry.value);
    }

    ctx.response.body = donations;
  } catch (error) {
    console.error("Error fetching donations:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Create a new donation (admin)
adminRouter.post("/", async (ctx) => {
  const donationData = ctx.state.body as CreateDonationRequest;
  if (!donationData || typeof donationData !== "object") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid request body" };
    return;
  }

  // Validate required fields
  const requiredFields = [
    "title",
    "description",
    "type",
    "targetAmount",
    "organizationId",
    "category",
  ];

  for (const field of requiredFields) {
    if (!donationData[field as keyof CreateDonationRequest]) {
      ctx.response.status = 400;
      ctx.response.body = { error: `${field} is required` };
      return;
    }
  }

  // Type-specific validations
  if (donationData.type === DonationType.EVENT) {
    if (!donationData.startDate || !donationData.endDate) {
      ctx.response.status = 400;
      ctx.response.body = {
        error: "Event donations require startDate and endDate",
      };
      return;
    }
  } else if (donationData.type === DonationType.RECURRING) {
    if (!donationData.frequency) {
      ctx.response.status = 400;
      ctx.response.body = { error: "Recurring donations require frequency" };
      return;
    }
  }

  try {
    // Verify organization exists
    const kv = getKv();
    const organization = await kv.get<any>([
      KV_COLLECTIONS.ORGANIZATIONS,
      donationData.organizationId,
    ]);
    if (!organization.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Organization not found" };
      return;
    }

    const id = generateId();
    const timestamp = new Date().toISOString();

    // Sanitize user input
    const sanitizedData = {
      title: sanitizeHtml(donationData.title),
      description: sanitizeHtml(donationData.description),
      type: donationData.type,
      targetAmount: donationData.targetAmount,
      organizationId: donationData.organizationId,
      branchId: donationData.branchId,
      imageUrl: donationData.imageUrl
        ? sanitizeHtml(donationData.imageUrl)
        : undefined,
      category: sanitizeHtml(donationData.category),
      tags: donationData.tags?.map((tag) => sanitizeHtml(tag)) || [],
    };

    // Base donation
    const newDonation = {
      id,
      ...sanitizedData,
      currentAmount: 0,
      status: DonationStatus.ACTIVE,
      createdAt: timestamp,
      updatedAt: timestamp,
      createdBy: ctx.state.user.id,
    };

    // Add type-specific fields
    if (donationData.type === DonationType.EVENT) {
      Object.assign(newDonation, {
        startDate: donationData.startDate,
        endDate: donationData.endDate,
      });
    } else if (donationData.type === DonationType.RECURRING) {
      Object.assign(newDonation, {
        frequency: donationData.frequency,
        nextRefreshDate: calculateNextRefreshDate(donationData.frequency!),
      });
    }

    // Save to KV
    await kv.set([KV_COLLECTIONS.DONATIONS, id], newDonation);

    // Return the donation with ID
    ctx.response.status = 201;
    ctx.response.body = newDonation;
  } catch (error) {
    console.error("Error creating donation:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Get donation by ID (admin)
adminRouter.get("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Donation ID is required" };
    return;
  }

  try {
    const kv = getKv();
    const donation = await kv.get<any>([KV_COLLECTIONS.DONATIONS, id]);

    if (!donation.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Donation not found" };
      return;
    }

    ctx.response.body = donation.value;
  } catch (error) {
    console.error("Error fetching donation:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Update donation (admin)
adminRouter.put("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Donation ID is required" };
    return;
  }

  const updateData = ctx.state.body as UpdateDonationRequest;
  if (!updateData || typeof updateData !== "object") {
    ctx.response.status = 400;
    ctx.response.body = { error: "Invalid request body" };
    return;
  }

  try {
    const kv = getKv();
    const existingDonation = await kv.get<any>([KV_COLLECTIONS.DONATIONS, id]);

    if (!existingDonation.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Donation not found" };
      return;
    }

    // Sanitize input
    const sanitizedUpdate: Record<string, any> = {};

    if (updateData.title) {
      sanitizedUpdate.title = sanitizeHtml(updateData.title);
    }
    if (updateData.description) {
      sanitizedUpdate.description = sanitizeHtml(updateData.description);
    }
    if (updateData.targetAmount) {
      sanitizedUpdate.targetAmount = updateData.targetAmount;
    }
    if (updateData.status) sanitizedUpdate.status = updateData.status;
    if (updateData.imageUrl) {
      sanitizedUpdate.imageUrl = sanitizeHtml(updateData.imageUrl);
    }
    if (updateData.category) {
      sanitizedUpdate.category = sanitizeHtml(updateData.category);
    }
    if (updateData.tags) {
      sanitizedUpdate.tags = updateData.tags.map((tag) => sanitizeHtml(tag));
    }

    // Type-specific updates
    if (existingDonation.value.type === DonationType.EVENT) {
      if (updateData.startDate) {
        sanitizedUpdate.startDate = updateData.startDate;
      }
      if (updateData.endDate) sanitizedUpdate.endDate = updateData.endDate;
    } else if (existingDonation.value.type === DonationType.RECURRING) {
      if (updateData.frequency) {
        sanitizedUpdate.frequency = updateData.frequency;
      }
      if (updateData.nextRefreshDate) {
        sanitizedUpdate.nextRefreshDate = updateData.nextRefreshDate;
      }
    }

    const updatedDonation = {
      ...existingDonation.value,
      ...sanitizedUpdate,
      updatedAt: new Date().toISOString(),
      updatedBy: ctx.state.user.id,
    };

    // Save to KV
    await kv.set([KV_COLLECTIONS.DONATIONS, id], updatedDonation);

    // Return the updated donation
    ctx.response.body = updatedDonation;
  } catch (error) {
    console.error("Error updating donation:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Delete donation (admin)
adminRouter.delete("/:id", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Donation ID is required" };
    return;
  }

  try {
    const kv = getKv();
    const donation = await kv.get<any>([KV_COLLECTIONS.DONATIONS, id]);

    if (!donation.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Donation not found" };
      return;
    }

    // Delete the donation
    await kv.delete([KV_COLLECTIONS.DONATIONS, id]);

    // Log audit trail
    await kv.set([KV_COLLECTIONS.AUDIT, generateId()], {
      action: "DELETE_DONATION",
      donationId: id,
      userId: ctx.state.user.id,
      timestamp: new Date().toISOString(),
    });

    ctx.response.status = 204; // No content
  } catch (error) {
    console.error("Error deleting donation:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Get donation transactions (admin)
adminRouter.get("/:id/transactions", async (ctx) => {
  const { id } = ctx.params;
  if (!id) {
    ctx.response.status = 400;
    ctx.response.body = { error: "Donation ID is required" };
    return;
  }

  try {
    const kv = getKv();

    // First check if donation exists
    const donation = await kv.get<any>([KV_COLLECTIONS.DONATIONS, id]);
    if (!donation.value) {
      ctx.response.status = 404;
      ctx.response.body = { error: "Donation not found" };
      return;
    }

    // Then fetch all transactions for this donation
    const transactions = [];
    const entries = kv.list<any>({
      prefix: [KV_COLLECTIONS.DONATION_TRANSACTIONS],
    });

    for await (const entry of entries) {
      if (entry.value.donationId === id) {
        transactions.push(entry.value);
      }
    }

    ctx.response.body = transactions;
  } catch (error) {
    console.error("Error fetching donation transactions:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Get donation analytics (admin)
adminRouter.get("/analytics", async (ctx) => {
  try {
    const kv = getKv();

    // Fetch all donations
    const donations = [];
    const donationEntries = kv.list<any>({
      prefix: [KV_COLLECTIONS.DONATIONS],
    });
    for await (const entry of donationEntries) {
      donations.push(entry.value);
    }

    // Fetch all transactions
    const transactions = [];
    const transactionEntries = kv.list<any>({
      prefix: [KV_COLLECTIONS.DONATION_TRANSACTIONS],
    });
    for await (const entry of transactionEntries) {
      transactions.push(entry.value);
    }

    // Calculate analytics
    const totalDonations = transactions.length;
    const totalAmountRaised = transactions.reduce(
      (sum, tx) => sum + tx.amount,
      0,
    );

    const activeEventDonations = donations.filter(
      (d) =>
        d.type === DonationType.EVENT && d.status === DonationStatus.ACTIVE,
    ).length;

    const activeRecurringDonations = donations.filter(
      (d) =>
        d.type === DonationType.RECURRING && d.status === DonationStatus.ACTIVE,
    ).length;

    const averageDonationAmount = totalDonations > 0
      ? totalAmountRaised / totalDonations
      : 0;

    // Count unique donors
    const uniqueDonors = new Set();
    transactions.forEach((tx) => {
      if (tx.userId) {
        uniqueDonors.add(tx.userId);
      } else if (tx.donorEmail) {
        uniqueDonors.add(tx.donorEmail);
      } else {
        uniqueDonors.add(tx.donorName + "-" + tx.createdAt);
      }
    });

    const donorCount = uniqueDonors.size;

    const completedDonations = donations.filter((d) =>
      d.status === DonationStatus.COMPLETED
    ).length;

    // Category analytics
    const donationsByCategory: Record<string, number> = {};
    donations.forEach((donation) => {
      const { category } = donation;
      if (!donationsByCategory[category]) {
        donationsByCategory[category] = 0;
      }
      donationsByCategory[category]++;
    });

    // Find most popular category
    let mostPopularCategory = "";
    let maxCount = 0;
    for (const [category, count] of Object.entries(donationsByCategory)) {
      if (count > maxCount) {
        maxCount = count;
        mostPopularCategory = category;
      }
    }

    // Donations by date
    const donationsByDate: Record<string, number> = {};
    transactions.forEach((tx) => {
      const date = tx.createdAt.split("T")[0]; // Get just the date part
      if (!donationsByDate[date]) {
        donationsByDate[date] = 0;
      }
      donationsByDate[date] += tx.amount;
    });

    // Top 10 donations by amount
    const topDonations = [...transactions]
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const analytics = {
      totalDonations,
      totalAmountRaised,
      activeEventDonations,
      activeRecurringDonations,
      averageDonationAmount,
      donorCount,
      completedDonations,
      mostPopularCategory,
      donationsByCategory,
      donationsByDate,
      topDonations,
    };

    ctx.response.body = analytics;
  } catch (error) {
    console.error("Error generating donation analytics:", error);
    ctx.response.status = 500;
    ctx.response.body = { error: "Internal server error" };
  }
});

// Helper function to calculate next refresh date based on frequency
function calculateNextRefreshDate(
  frequency: "daily" | "weekly" | "monthly",
): string {
  const now = new Date();

  switch (frequency) {
    case "daily":
      now.setDate(now.getDate() + 1);
      break;
    case "weekly":
      now.setDate(now.getDate() + 7);
      break;
    case "monthly":
      now.setMonth(now.getMonth() + 1);
      break;
  }

  return now.toISOString();
}
