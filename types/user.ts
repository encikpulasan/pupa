// types/user.ts - User Type Definitions

// User types
export enum UserType {
  ADMIN = "admin",
  EDITOR = "editor",
  PATRON = "patron",
  VOLUNTEER = "volunteer",
  GUEST = "guest",
}

// Access level for fine-grained permissions (similar to AWS IAM)
export enum AccessLevel {
  FULL = "full", // Full access (create, read, update, delete)
  READ_WRITE = "read_write", // Can read and modify but not delete
  READ_ONLY = "read_only", // Read-only access
  NONE = "none", // No access
}

// Resource types that can be accessed
export enum ResourceType {
  USERS = "users",
  POSTS = "posts",
  ORGANIZATIONS = "organizations",
  BOOKINGS = "bookings",
  ANALYTICS = "analytics",
  SETTINGS = "settings",
  DONATIONS = "donations",
}

// Permission definition for a specific resource
export interface Permission {
  resource: ResourceType;
  accessLevel: AccessLevel;
}

// Role definition with associated permissions
export interface Role {
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean; // System roles cannot be modified or deleted
}

// Base user interface
export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  userType: UserType;
  roles: string[]; // Array of role names assigned to the user
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  address?: string;
  bio?: string;
  profilePicture?: string;
  dateOfBirth?: string;
  interests?: string;
  skills?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
}

// Patron-specific fields
export interface PatronUser extends User {
  userType: UserType.PATRON;
  organizationName?: string;
  position?: string;
  verificationStatus?: "pending" | "verified" | "rejected";
  contactPreference?: "email" | "phone" | "both";
  notes?: string;
}

// Default system roles
export const SYSTEM_ROLES: Role[] = [
  {
    name: "SuperAdmin",
    description: "Full access to all resources",
    permissions: Object.values(ResourceType).map((resource) => ({
      resource,
      accessLevel: AccessLevel.FULL,
    })),
    isSystemRole: true,
  },
  {
    name: "ContentManager",
    description: "Manage posts and content",
    permissions: [
      { resource: ResourceType.POSTS, accessLevel: AccessLevel.FULL },
      {
        resource: ResourceType.ORGANIZATIONS,
        accessLevel: AccessLevel.READ_ONLY,
      },
      { resource: ResourceType.ANALYTICS, accessLevel: AccessLevel.READ_ONLY },
      { resource: ResourceType.DONATIONS, accessLevel: AccessLevel.READ_ONLY },
    ],
    isSystemRole: true,
  },
  {
    name: "BookingManager",
    description: "Manage booking requests",
    permissions: [
      { resource: ResourceType.BOOKINGS, accessLevel: AccessLevel.FULL },
      { resource: ResourceType.USERS, accessLevel: AccessLevel.READ_ONLY },
      { resource: ResourceType.DONATIONS, accessLevel: AccessLevel.READ_ONLY },
    ],
    isSystemRole: true,
  },
  {
    name: "DonationManager",
    description: "Manage donations",
    permissions: [
      { resource: ResourceType.DONATIONS, accessLevel: AccessLevel.FULL },
      {
        resource: ResourceType.ORGANIZATIONS,
        accessLevel: AccessLevel.READ_ONLY,
      },
      { resource: ResourceType.USERS, accessLevel: AccessLevel.READ_ONLY },
    ],
    isSystemRole: true,
  },
  {
    name: "Patron",
    description: "External organization representatives",
    permissions: [
      { resource: ResourceType.BOOKINGS, accessLevel: AccessLevel.READ_WRITE },
      { resource: ResourceType.POSTS, accessLevel: AccessLevel.READ_ONLY },
      {
        resource: ResourceType.ORGANIZATIONS,
        accessLevel: AccessLevel.READ_ONLY,
      },
      { resource: ResourceType.DONATIONS, accessLevel: AccessLevel.READ_WRITE },
    ],
    isSystemRole: true,
  },
  {
    name: "Guest",
    description: "Limited read-only access",
    permissions: [
      { resource: ResourceType.POSTS, accessLevel: AccessLevel.READ_ONLY },
      {
        resource: ResourceType.ORGANIZATIONS,
        accessLevel: AccessLevel.READ_ONLY,
      },
      { resource: ResourceType.DONATIONS, accessLevel: AccessLevel.READ_ONLY },
    ],
    isSystemRole: true,
  },
];

// Helper function to check if a user has access to a resource
export function hasPermission(
  userRoles: string[],
  availableRoles: Role[],
  resource: ResourceType,
  requiredAccessLevel: AccessLevel,
): boolean {
  // If no roles are provided, deny access
  if (!userRoles || userRoles.length === 0) {
    return false;
  }

  // Find the roles that the user has
  const roles = availableRoles.filter((role) => userRoles.includes(role.name));

  // Check if any of the user's roles have the required access level for the resource
  return roles.some((role) => {
    const permission = role.permissions.find((p) => p.resource === resource);
    if (!permission) {
      return false;
    }

    // Check if the permission grants sufficient access level
    switch (requiredAccessLevel) {
      case AccessLevel.FULL:
        return permission.accessLevel === AccessLevel.FULL;

      case AccessLevel.READ_WRITE:
        return [AccessLevel.FULL, AccessLevel.READ_WRITE].includes(
          permission.accessLevel,
        );

      case AccessLevel.READ_ONLY:
        return [AccessLevel.FULL, AccessLevel.READ_WRITE, AccessLevel.READ_ONLY]
          .includes(permission.accessLevel);

      default:
        return false;
    }
  });
}
