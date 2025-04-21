// types/donation.ts - Types for donation features

// Donation type enum
export enum DonationType {
  EVENT = "event",
  RECURRING = "recurring",
}

// Donation status
export enum DonationStatus {
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
}

// Transaction status
export enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REFUNDED = "refunded",
}

// Base donation interface
export interface Donation {
  id: string;
  title: string;
  description: string;
  type: DonationType;
  targetAmount: number; // in RM
  currentAmount: number; // in RM
  status: DonationStatus;
  organizationId: string;
  branchId?: string;
  imageUrl?: string;
  category: string; // e.g., "Food", "Clothing", "Medical", "Education"
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

// Event donation (one-time)
export interface EventDonation extends Donation {
  type: DonationType.EVENT;
  startDate: string; // ISO string
  endDate: string; // ISO string
}

// Recurring donation
export interface RecurringDonation extends Donation {
  type: DonationType.RECURRING;
  frequency: "daily" | "weekly" | "monthly"; // How often it recurs
  nextRefreshDate: string; // ISO string
}

// Combined type
export type DonationItem = EventDonation | RecurringDonation;

// Donation transaction
export interface DonationTransaction {
  id: string;
  donationId: string;
  amount: number; // in RM
  status: TransactionStatus;
  transactionReference?: string; // Payment gateway reference
  donorName: string; // Can be anonymous
  donorEmail?: string;
  donorPhone?: string;
  donorMessage?: string;
  userId?: string; // If donated by a logged in user
  isAnonymous: boolean;
  paymentMethod: string; // e.g., "Credit Card", "Bank Transfer"
  createdAt: string;
  updatedAt: string;
}

// Donation analytics
export interface DonationAnalytics {
  totalDonations: number; // Count of donations
  totalAmountRaised: number; // in RM
  activeEventDonations: number;
  activeRecurringDonations: number;
  averageDonationAmount: number; // in RM
  donorCount: number; // Unique donors
  completedDonations: number;
  mostPopularCategory: string;
  donationsByCategory: Record<string, number>; // Category to amount mapping
  donationsByDate: Record<string, number>; // Date to amount mapping
  topDonations: DonationTransaction[]; // Top 10 donations
}

// Request types
export interface CreateDonationRequest {
  title: string;
  description: string;
  type: DonationType;
  targetAmount: number;
  organizationId: string;
  branchId?: string;
  imageUrl?: string;
  category: string;
  tags: string[];

  // For event donations
  startDate?: string;
  endDate?: string;

  // For recurring donations
  frequency?: "daily" | "weekly" | "monthly";
}

export interface UpdateDonationRequest {
  title?: string;
  description?: string;
  targetAmount?: number;
  status?: DonationStatus;
  imageUrl?: string;
  category?: string;
  tags?: string[];

  // For event donations
  startDate?: string;
  endDate?: string;

  // For recurring donations
  frequency?: "daily" | "weekly" | "monthly";
  nextRefreshDate?: string;
}

export interface CreateDonationTransactionRequest {
  donationId: string;
  amount: number;
  donorName: string;
  donorEmail?: string;
  donorPhone?: string;
  donorMessage?: string;
  userId?: string;
  isAnonymous: boolean;
  paymentMethod: string;
}
