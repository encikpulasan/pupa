// services/donation.ts - Donation service operations

import { generateId, getKv, KV_COLLECTIONS } from "../db/kv.ts";
import {
  CreateDonationRequest,
  CreateDonationTransactionRequest,
  Donation,
  DonationAnalytics,
  DonationItem,
  DonationStatus,
  DonationTransaction,
  DonationType,
  EventDonation,
  RecurringDonation,
  TransactionStatus,
  UpdateDonationRequest,
} from "../types/donation.ts";

// Helper function to convert date objects to ISO strings
function toISOString(date: Date): string {
  return date.toISOString();
}

// Create a new donation (either event or recurring)
export async function createDonation(
  data: CreateDonationRequest,
): Promise<DonationItem> {
  const kv = getKv();
  const id = generateId();
  const now = toISOString(new Date());

  // Base donation data
  const baseDonation: Donation = {
    id,
    title: data.title,
    description: data.description,
    type: data.type,
    targetAmount: data.targetAmount,
    currentAmount: 0, // Start with 0
    status: DonationStatus.ACTIVE,
    organizationId: data.organizationId,
    branchId: data.branchId,
    imageUrl: data.imageUrl,
    category: data.category,
    tags: data.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  let donation: DonationItem;

  // Create specific donation type
  if (data.type === DonationType.EVENT) {
    if (!data.startDate || !data.endDate) {
      throw new Error("Event donations require start and end dates");
    }

    donation = {
      ...baseDonation,
      type: DonationType.EVENT,
      startDate: data.startDate,
      endDate: data.endDate,
    } as EventDonation;
  } else {
    // Recurring donation
    if (!data.frequency) {
      throw new Error("Recurring donations require a frequency");
    }

    // Calculate next refresh date based on frequency
    const nextRefreshDate = new Date();
    switch (data.frequency) {
      case "daily":
        nextRefreshDate.setDate(nextRefreshDate.getDate() + 1);
        break;
      case "weekly":
        nextRefreshDate.setDate(nextRefreshDate.getDate() + 7);
        break;
      case "monthly":
        nextRefreshDate.setMonth(nextRefreshDate.getMonth() + 1);
        break;
    }

    donation = {
      ...baseDonation,
      type: DonationType.RECURRING,
      frequency: data.frequency,
      nextRefreshDate: toISOString(nextRefreshDate),
    } as RecurringDonation;
  }

  // Store in KV
  await kv.set([KV_COLLECTIONS.DONATIONS, id], donation);

  return donation;
}

// Get a donation by ID
export async function getDonation(id: string): Promise<DonationItem | null> {
  const kv = getKv();
  const result = await kv.get<DonationItem>([KV_COLLECTIONS.DONATIONS, id]);
  return result.value;
}

// Update an existing donation
export async function updateDonation(
  id: string,
  data: UpdateDonationRequest,
): Promise<DonationItem | null> {
  const kv = getKv();
  const existingDonation = await getDonation(id);

  if (!existingDonation) {
    return null;
  }

  const updatedDonation: DonationItem = {
    ...existingDonation,
    ...data,
    updatedAt: toISOString(new Date()),
  };

  // Handle type-specific updates
  if (existingDonation.type === DonationType.EVENT) {
    if (data.startDate) {
      (updatedDonation as EventDonation).startDate = data.startDate;
    }
    if (data.endDate) {
      (updatedDonation as EventDonation).endDate = data.endDate;
    }
  } else if (existingDonation.type === DonationType.RECURRING) {
    if (data.frequency) {
      (updatedDonation as RecurringDonation).frequency = data.frequency;
    }
    if (data.nextRefreshDate) {
      (updatedDonation as RecurringDonation).nextRefreshDate =
        data.nextRefreshDate;
    }
  }

  await kv.set([KV_COLLECTIONS.DONATIONS, id], updatedDonation);
  return updatedDonation;
}

// Delete a donation
export async function deleteDonation(id: string): Promise<boolean> {
  const kv = getKv();
  const donation = await getDonation(id);

  if (!donation) {
    return false;
  }

  // Remove the donation
  await kv.delete([KV_COLLECTIONS.DONATIONS, id]);

  // Also remove associated transactions (in a real app, you might archive instead)
  const transactions = await getDonationTransactions(id);
  for (const transaction of transactions) {
    await kv.delete([KV_COLLECTIONS.DONATION_TRANSACTIONS, transaction.id]);
  }

  return true;
}

// List all donations
export async function listDonations(options?: {
  organizationId?: string;
  status?: DonationStatus;
  type?: DonationType;
}): Promise<DonationItem[]> {
  const kv = getKv();
  const donations: DonationItem[] = [];

  for await (
    const entry of kv.list<DonationItem>({
      prefix: [KV_COLLECTIONS.DONATIONS],
    })
  ) {
    // Apply filters if options are provided
    if (options) {
      if (
        options.organizationId &&
        entry.value.organizationId !== options.organizationId
      ) {
        continue;
      }
      if (options.status && entry.value.status !== options.status) {
        continue;
      }
      if (options.type && entry.value.type !== options.type) {
        continue;
      }
    }

    donations.push(entry.value);
  }

  return donations;
}

// Create a donation transaction
export async function createDonationTransaction(
  data: CreateDonationTransactionRequest,
): Promise<DonationTransaction | null> {
  const kv = getKv();

  // Get the donation
  const donation = await getDonation(data.donationId);
  if (!donation) {
    return null;
  }

  const id = generateId();
  const now = toISOString(new Date());

  // Create transaction
  const transaction: DonationTransaction = {
    id,
    donationId: data.donationId,
    amount: data.amount,
    status: TransactionStatus.COMPLETED, // Assume immediate completion for simplicity
    donorName: data.donorName,
    donorEmail: data.donorEmail,
    donorPhone: data.donorPhone,
    donorMessage: data.donorMessage,
    userId: data.userId,
    isAnonymous: data.isAnonymous,
    paymentMethod: data.paymentMethod,
    createdAt: now,
    updatedAt: now,
  };

  // Store the transaction
  await kv.set([KV_COLLECTIONS.DONATION_TRANSACTIONS, id], transaction);

  // Update the donation's current amount
  const updatedDonation = {
    ...donation,
    currentAmount: donation.currentAmount + data.amount,
    updatedAt: now,
  };

  // Check if the donation has reached its target
  if (updatedDonation.currentAmount >= donation.targetAmount) {
    updatedDonation.status = DonationStatus.COMPLETED;
  }

  await kv.set([KV_COLLECTIONS.DONATIONS, donation.id], updatedDonation);

  return transaction;
}

// Get a transaction by ID
export async function getDonationTransaction(
  id: string,
): Promise<DonationTransaction | null> {
  const kv = getKv();
  const result = await kv.get<DonationTransaction>([
    KV_COLLECTIONS.DONATION_TRANSACTIONS,
    id,
  ]);
  return result.value;
}

// Get all transactions for a donation
export async function getDonationTransactions(
  donationId: string,
): Promise<DonationTransaction[]> {
  const kv = getKv();
  const transactions: DonationTransaction[] = [];

  for await (
    const entry of kv.list<DonationTransaction>({
      prefix: [KV_COLLECTIONS.DONATION_TRANSACTIONS],
    })
  ) {
    if (entry.value.donationId === donationId) {
      transactions.push(entry.value);
    }
  }

  return transactions;
}

// List all transactions
export async function listAllTransactions(options?: {
  userId?: string;
  startDate?: Date;
  endDate?: Date;
}): Promise<DonationTransaction[]> {
  const kv = getKv();
  const transactions: DonationTransaction[] = [];

  for await (
    const entry of kv.list<DonationTransaction>({
      prefix: [KV_COLLECTIONS.DONATION_TRANSACTIONS],
    })
  ) {
    // Apply filters if options are provided
    if (options) {
      if (options.userId && entry.value.userId !== options.userId) {
        continue;
      }

      const transactionDate = new Date(entry.value.createdAt);

      if (options.startDate && transactionDate < options.startDate) {
        continue;
      }

      if (options.endDate && transactionDate > options.endDate) {
        continue;
      }
    }

    transactions.push(entry.value);
  }

  return transactions;
}

// Check and update recurring donations (to be run by a scheduler)
export async function processRecurringDonations(): Promise<void> {
  const kv = getKv();
  const now = new Date();

  // Get all active recurring donations
  const donations = await listDonations({
    type: DonationType.RECURRING,
    status: DonationStatus.ACTIVE,
  });

  for (const donation of donations) {
    if (donation.type !== DonationType.RECURRING) continue;

    const nextRefreshDate = new Date(donation.nextRefreshDate);

    // Check if it's time to refresh
    if (nextRefreshDate <= now) {
      // Reset currentAmount to 0 for new cycle
      const updatedDonation = { ...donation };
      updatedDonation.currentAmount = 0;

      // Calculate next refresh date
      const newRefreshDate = new Date(donation.nextRefreshDate);
      switch (donation.frequency) {
        case "daily":
          newRefreshDate.setDate(newRefreshDate.getDate() + 1);
          break;
        case "weekly":
          newRefreshDate.setDate(newRefreshDate.getDate() + 7);
          break;
        case "monthly":
          newRefreshDate.setMonth(newRefreshDate.getMonth() + 1);
          break;
      }

      updatedDonation.nextRefreshDate = toISOString(newRefreshDate);
      updatedDonation.updatedAt = toISOString(now);

      await kv.set([KV_COLLECTIONS.DONATIONS, donation.id], updatedDonation);
    }
  }
}

// Check for expired event donations (to be run by a scheduler)
export async function processEventDonations(): Promise<void> {
  const kv = getKv();
  const now = new Date();

  // Get all active event donations
  const donations = await listDonations({
    type: DonationType.EVENT,
    status: DonationStatus.ACTIVE,
  });

  for (const donation of donations) {
    if (donation.type !== DonationType.EVENT) continue;

    const endDate = new Date(donation.endDate);

    // Check if the event has ended
    if (endDate <= now) {
      // Mark as expired
      const updatedDonation = {
        ...donation,
        status: DonationStatus.EXPIRED,
        updatedAt: toISOString(now),
      };

      await kv.set([KV_COLLECTIONS.DONATIONS, donation.id], updatedDonation);
    }
  }
}
