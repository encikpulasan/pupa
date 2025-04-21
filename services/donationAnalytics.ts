// services/donationAnalytics.ts - Donation analytics service

import { getKv, KV_COLLECTIONS } from "../db/kv.ts";
import {
  DonationAnalytics,
  DonationItem,
  DonationStatus,
  DonationTransaction,
  DonationType,
} from "../types/donation.ts";
import { listAllTransactions, listDonations } from "./donation.ts";

// Generate overall donation analytics
export async function generateDonationAnalytics(): Promise<DonationAnalytics> {
  const kv = getKv();

  // Get all donations and transactions
  const donations = await listDonations();
  const transactions = await listAllTransactions();

  // Calculate analytics
  const totalDonations = transactions.length;
  const totalAmountRaised = transactions.reduce(
    (sum, tx) => sum + tx.amount,
    0,
  );

  const activeEventDonations = donations.filter(
    (d) => d.type === DonationType.EVENT && d.status === DonationStatus.ACTIVE,
  ).length;

  const activeRecurringDonations = donations.filter(
    (d) =>
      d.type === DonationType.RECURRING && d.status === DonationStatus.ACTIVE,
  ).length;

  const averageDonationAmount = totalDonations > 0
    ? totalAmountRaised / totalDonations
    : 0;

  // Count unique donors (by email if available, otherwise by name)
  const donorMap = new Map<string, boolean>();
  transactions.forEach((tx) => {
    const donorId = tx.donorEmail || tx.donorName;
    donorMap.set(donorId, true);
  });
  const donorCount = donorMap.size;

  const completedDonations = donations.filter(
    (d) => d.status === DonationStatus.COMPLETED,
  ).length;

  // Calculate donations by category
  const donationsByCategory: Record<string, number> = {};
  donations.forEach((donation) => {
    if (!donationsByCategory[donation.category]) {
      donationsByCategory[donation.category] = 0;
    }
    donationsByCategory[donation.category] += donation.currentAmount;
  });

  // Find most popular category
  let mostPopularCategory = "";
  let highestAmount = 0;
  for (const [category, amount] of Object.entries(donationsByCategory)) {
    if (amount > highestAmount) {
      highestAmount = amount;
      mostPopularCategory = category;
    }
  }

  // Calculate donations by date (last 30 days)
  const donationsByDate: Record<string, number> = {};
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Initialize all dates in the range
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    donationsByDate[dateStr] = 0;
  }

  // Sum donations by date
  transactions.forEach((tx) => {
    const txDate = new Date(tx.createdAt);
    if (txDate >= thirtyDaysAgo) {
      const dateStr = txDate.toISOString().split("T")[0];
      if (donationsByDate[dateStr] !== undefined) {
        donationsByDate[dateStr] += tx.amount;
      }
    }
  });

  // Get top 10 donations by amount
  const topDonations = [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  // Compile analytics
  const analytics: DonationAnalytics = {
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

  // Cache analytics in KV store
  await kv.set(
    [KV_COLLECTIONS.DONATION_ANALYTICS, "latest"],
    {
      ...analytics,
      generatedAt: new Date().toISOString(),
    },
  );

  return analytics;
}

// Get cached analytics or generate new ones
export async function getDonationAnalytics(): Promise<DonationAnalytics> {
  const kv = getKv();

  // Try to get cached analytics
  const cachedResult = await kv.get<
    DonationAnalytics & { generatedAt: string }
  >(
    [KV_COLLECTIONS.DONATION_ANALYTICS, "latest"],
  );

  if (cachedResult.value) {
    const cachedAt = new Date(cachedResult.value.generatedAt);
    const now = new Date();

    // If cache is less than 1 hour old, use it
    if (now.getTime() - cachedAt.getTime() < 3600000) {
      return cachedResult.value;
    }
  }

  // Otherwise generate new analytics
  return await generateDonationAnalytics();
}

// Get organization-specific donation analytics
export async function getOrganizationDonationAnalytics(
  organizationId: string,
): Promise<DonationAnalytics> {
  // Get organization-specific donations
  const donations = await listDonations({
    organizationId,
  });

  // Get IDs to filter transactions
  const donationIds = donations.map((d) => d.id);

  // Get all transactions
  const allTransactions = await listAllTransactions();

  // Filter transactions for this organization
  const transactions = allTransactions.filter(
    (tx) => donationIds.includes(tx.donationId),
  );

  // Similar calculations as main analytics
  const totalDonations = transactions.length;
  const totalAmountRaised = transactions.reduce(
    (sum, tx) => sum + tx.amount,
    0,
  );

  const activeEventDonations = donations.filter(
    (d) => d.type === DonationType.EVENT && d.status === DonationStatus.ACTIVE,
  ).length;

  const activeRecurringDonations = donations.filter(
    (d) =>
      d.type === DonationType.RECURRING && d.status === DonationStatus.ACTIVE,
  ).length;

  const averageDonationAmount = totalDonations > 0
    ? totalAmountRaised / totalDonations
    : 0;

  // Count unique donors
  const donorMap = new Map<string, boolean>();
  transactions.forEach((tx) => {
    const donorId = tx.donorEmail || tx.donorName;
    donorMap.set(donorId, true);
  });
  const donorCount = donorMap.size;

  const completedDonations = donations.filter(
    (d) => d.status === DonationStatus.COMPLETED,
  ).length;

  // Calculate donations by category
  const donationsByCategory: Record<string, number> = {};
  donations.forEach((donation) => {
    if (!donationsByCategory[donation.category]) {
      donationsByCategory[donation.category] = 0;
    }
    donationsByCategory[donation.category] += donation.currentAmount;
  });

  // Find most popular category
  let mostPopularCategory = "";
  let highestAmount = 0;
  for (const [category, amount] of Object.entries(donationsByCategory)) {
    if (amount > highestAmount) {
      highestAmount = amount;
      mostPopularCategory = category;
    }
  }

  // Calculate donations by date (last 30 days)
  const donationsByDate: Record<string, number> = {};
  const today = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  // Initialize all dates in the range
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split("T")[0];
    donationsByDate[dateStr] = 0;
  }

  // Sum donations by date
  transactions.forEach((tx) => {
    const txDate = new Date(tx.createdAt);
    if (txDate >= thirtyDaysAgo) {
      const dateStr = txDate.toISOString().split("T")[0];
      if (donationsByDate[dateStr] !== undefined) {
        donationsByDate[dateStr] += tx.amount;
      }
    }
  });

  // Get top 10 donations by amount
  const topDonations = [...transactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
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
}

// Get donation completion rate by category
export async function getDonationCompletionRateByCategory(): Promise<
  Record<string, number>
> {
  const donations = await listDonations();

  // Group donations by category
  const categoryCounts: Record<string, { total: number; completed: number }> =
    {};

  donations.forEach((donation) => {
    if (!categoryCounts[donation.category]) {
      categoryCounts[donation.category] = { total: 0, completed: 0 };
    }

    categoryCounts[donation.category].total++;

    if (donation.status === DonationStatus.COMPLETED) {
      categoryCounts[donation.category].completed++;
    }
  });

  // Calculate completion rate
  const completionRates: Record<string, number> = {};

  Object.entries(categoryCounts).forEach(([category, counts]) => {
    completionRates[category] = counts.total > 0
      ? (counts.completed / counts.total) * 100
      : 0;
  });

  return completionRates;
}

// Get donation success rate by time period
export async function getDonationSuccessRateByTimePeriod(): Promise<{
  daily: number;
  weekly: number;
  monthly: number;
}> {
  // Get all donations
  const donations = await listDonations({
    type: DonationType.RECURRING,
  });

  // Filter for recurring donations only
  const recurringDonations = donations.filter(
    (d) => d.type === DonationType.RECURRING,
  ) as Array<DonationItem & { frequency: string }>;

  // Count by frequency
  const frequencyCounts: Record<string, { total: number; completed: number }> =
    {
      daily: { total: 0, completed: 0 },
      weekly: { total: 0, completed: 0 },
      monthly: { total: 0, completed: 0 },
    };

  recurringDonations.forEach((donation) => {
    const frequency = donation.frequency;

    if (frequencyCounts[frequency]) {
      frequencyCounts[frequency].total++;

      if (donation.status === DonationStatus.COMPLETED) {
        frequencyCounts[frequency].completed++;
      }
    }
  });

  // Calculate success rates
  return {
    daily: frequencyCounts.daily.total > 0
      ? (frequencyCounts.daily.completed / frequencyCounts.daily.total) * 100
      : 0,
    weekly: frequencyCounts.weekly.total > 0
      ? (frequencyCounts.weekly.completed / frequencyCounts.weekly.total) * 100
      : 0,
    monthly: frequencyCounts.monthly.total > 0
      ? (frequencyCounts.monthly.completed / frequencyCounts.monthly.total) *
        100
      : 0,
  };
}

// Get donation trends (month-over-month)
export async function getDonationTrends(): Promise<{
  monthlyDonations: Record<string, number>;
  growthRate: number;
}> {
  const transactions = await listAllTransactions();

  // Group transactions by month
  const monthlyDonations: Record<string, number> = {};

  // Process transactions
  transactions.forEach((tx) => {
    const date = new Date(tx.createdAt);
    const monthKey = `${date.getFullYear()}-${
      String(date.getMonth() + 1).padStart(2, "0")
    }`;

    if (!monthlyDonations[monthKey]) {
      monthlyDonations[monthKey] = 0;
    }

    monthlyDonations[monthKey] += tx.amount;
  });

  // Sort months
  const sortedMonths = Object.keys(monthlyDonations).sort();

  // Calculate growth rate (current month vs previous month)
  let growthRate = 0;

  if (sortedMonths.length >= 2) {
    const currentMonth = sortedMonths[sortedMonths.length - 1];
    const previousMonth = sortedMonths[sortedMonths.length - 2];

    const currentAmount = monthlyDonations[currentMonth];
    const previousAmount = monthlyDonations[previousMonth];

    if (previousAmount > 0) {
      growthRate = ((currentAmount - previousAmount) / previousAmount) * 100;
    }
  }

  return {
    monthlyDonations,
    growthRate,
  };
}
