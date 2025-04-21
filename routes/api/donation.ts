// routes/api/donation.ts - Donation API routes

import { Router } from "https://deno.land/x/oak@v12.5.0/mod.ts";
import { validateRequest } from "../../middleware/validator.ts";
import { verifyApiKey } from "../../middleware/apiKey.ts";
import { verifyToken } from "../../middleware/auth.ts";
import {
  createDonation,
  createDonationTransaction,
  deleteDonation,
  getDonation,
  getDonationTransactions,
  listDonations,
  updateDonation,
} from "../../services/donation.ts";
import {
  getDonationAnalytics,
  getDonationCompletionRateByCategory,
  getDonationSuccessRateByTimePeriod,
  getDonationTrends,
  getOrganizationDonationAnalytics,
} from "../../services/donationAnalytics.ts";
import { DonationStatus, DonationType } from "../../types/donation.ts";

const router = new Router();

// Base API path
const API_PATH = "/api/v1/donations";

// GET /api/v1/donations - List all donations
router.get(API_PATH, verifyApiKey, async (ctx) => {
  try {
    // Parse query parameters
    const { searchParams } = new URL(ctx.request.url);
    const organizationId = searchParams.get("organizationId") || undefined;
    const status = searchParams.get("status") as DonationStatus | undefined;
    const type = searchParams.get("type") as DonationType | undefined;

    const donations = await listDonations({
      organizationId: organizationId,
      status: status,
      type: type,
    });

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: donations,
    };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Failed to fetch donations",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// POST /api/v1/donations - Create a new donation
router.post(
  API_PATH,
  verifyApiKey,
  verifyToken,
  validateRequest,
  async (ctx) => {
    try {
      const body = await ctx.request.body().value;

      if (
        !body.title || !body.description || !body.targetAmount || !body.type ||
        !body.organizationId
      ) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Missing required fields",
        };
        return;
      }

      const donation = await createDonation(body);

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        data: donation,
        message: "Donation created successfully",
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to create donation",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// GET /api/v1/donations/:id - Get a donation by ID
router.get(`${API_PATH}/:id`, verifyApiKey, async (ctx) => {
  try {
    const id = ctx.params.id;

    if (!id) {
      ctx.response.status = 400;
      ctx.response.body = {
        success: false,
        message: "Donation ID is required",
      };
      return;
    }

    const donation = await getDonation(id);

    if (!donation) {
      ctx.response.status = 404;
      ctx.response.body = {
        success: false,
        message: "Donation not found",
      };
      return;
    }

    ctx.response.status = 200;
    ctx.response.body = {
      success: true,
      data: donation,
    };
  } catch (error: unknown) {
    ctx.response.status = 500;
    ctx.response.body = {
      success: false,
      message: "Failed to fetch donation",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
});

// PUT /api/v1/donations/:id - Update a donation
router.put(
  `${API_PATH}/:id`,
  verifyApiKey,
  verifyToken,
  validateRequest,
  async (ctx) => {
    try {
      const id = ctx.params.id;
      const body = await ctx.request.body().value;

      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Donation ID is required",
        };
        return;
      }

      const updatedDonation = await updateDonation(id, body);

      if (!updatedDonation) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          message: "Donation not found",
        };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: updatedDonation,
        message: "Donation updated successfully",
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to update donation",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// DELETE /api/v1/donations/:id - Delete a donation
router.delete(
  `${API_PATH}/:id`,
  verifyApiKey,
  verifyToken,
  async (ctx) => {
    try {
      const id = ctx.params.id;

      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Donation ID is required",
        };
        return;
      }

      const success = await deleteDonation(id);

      if (!success) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          message: "Donation not found",
        };
        return;
      }

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        message: "Donation deleted successfully",
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to delete donation",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// POST /api/v1/donations/:id/donate - Make a donation
router.post(
  `${API_PATH}/:id/donate`,
  verifyApiKey,
  validateRequest,
  async (ctx) => {
    try {
      const id = ctx.params.id;
      const body = await ctx.request.body().value;

      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Donation ID is required",
        };
        return;
      }

      if (
        !body.amount || !body.donorName || body.isAnonymous === undefined ||
        !body.paymentMethod
      ) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Missing required fields",
        };
        return;
      }

      // Add the userId if the request is authenticated
      if (ctx.state.user) {
        body.userId = ctx.state.user.id;
      }

      const transaction = await createDonationTransaction({
        ...body,
        donationId: id,
      });

      if (!transaction) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          message: "Donation not found",
        };
        return;
      }

      ctx.response.status = 201;
      ctx.response.body = {
        success: true,
        data: transaction,
        message: "Donation transaction created successfully",
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to create donation transaction",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// GET /api/v1/donations/:id/transactions - List all transactions for a donation
router.get(
  `${API_PATH}/:id/transactions`,
  verifyApiKey,
  async (ctx) => {
    try {
      const id = ctx.params.id;

      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Donation ID is required",
        };
        return;
      }

      const donation = await getDonation(id);
      if (!donation) {
        ctx.response.status = 404;
        ctx.response.body = {
          success: false,
          message: "Donation not found",
        };
        return;
      }

      const transactions = await getDonationTransactions(id);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: {
          donation,
          transactions,
          progress: {
            current: donation.currentAmount,
            target: donation.targetAmount,
            percentage: (donation.currentAmount / donation.targetAmount) * 100,
          },
        },
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to fetch donation transactions",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// GET /api/v1/donations/analytics - Get donation analytics
router.get(
  `${API_PATH}/analytics`,
  verifyApiKey,
  verifyToken,
  async (ctx) => {
    try {
      const analytics = await getDonationAnalytics();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: analytics,
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to fetch donation analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// GET /api/v1/donations/analytics/organization/:id - Get organization-specific donation analytics
router.get(
  `${API_PATH}/analytics/organization/:id`,
  verifyApiKey,
  verifyToken,
  async (ctx) => {
    try {
      const id = ctx.params.id;

      if (!id) {
        ctx.response.status = 400;
        ctx.response.body = {
          success: false,
          message: "Organization ID is required",
        };
        return;
      }

      const analytics = await getOrganizationDonationAnalytics(id);

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: analytics,
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to fetch organization donation analytics",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// GET /api/v1/donations/analytics/completion-rate - Get donation completion rate by category
router.get(
  `${API_PATH}/analytics/completion-rate`,
  verifyApiKey,
  verifyToken,
  async (ctx) => {
    try {
      const completionRates = await getDonationCompletionRateByCategory();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: completionRates,
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to fetch donation completion rates",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// GET /api/v1/donations/analytics/success-rate - Get donation success rate by time period
router.get(
  `${API_PATH}/analytics/success-rate`,
  verifyApiKey,
  verifyToken,
  async (ctx) => {
    try {
      const successRates = await getDonationSuccessRateByTimePeriod();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: successRates,
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to fetch donation success rates",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

// GET /api/v1/donations/analytics/trends - Get donation trends
router.get(
  `${API_PATH}/analytics/trends`,
  verifyApiKey,
  verifyToken,
  async (ctx) => {
    try {
      const trends = await getDonationTrends();

      ctx.response.status = 200;
      ctx.response.body = {
        success: true,
        data: trends,
      };
    } catch (error: unknown) {
      ctx.response.status = 500;
      ctx.response.body = {
        success: false,
        message: "Failed to fetch donation trends",
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
);

export default router;
