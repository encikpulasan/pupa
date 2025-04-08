export interface Branch {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  isMainBranch: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  services?: string[];
  status: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface Organization {
  id: string;
  name: string;
  description: string;
  logo?: string;
  website?: string;
  type:
    | "shelter"
    | "food_bank"
    | "clothing_bank"
    | "education_center"
    | "medical_clinic"
    | "other";
  status: "active" | "inactive";
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  services: string[];
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  capacity?: {
    maxOccupancy: number;
    currentOccupancy: number;
  };
  requirements?: {
    documents: string[];
    eligibility: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// Public interfaces (without sensitive information)
export interface PublicBranch {
  id: string;
  organizationId: string;
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  isMainBranch: boolean;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  services?: string[];
  status: "active" | "inactive";
}

export interface PublicOrganization {
  id: string;
  name: string;
  description: string;
  logo?: string;
  website?: string;
  type:
    | "shelter"
    | "food_bank"
    | "clothing_bank"
    | "education_center"
    | "medical_clinic"
    | "other";
  status: "active" | "inactive";
  contactInfo: {
    phone: string;
    email: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
  };
  socialMedia?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
  services: string[];
  operatingHours?: {
    [key: string]: {
      open: string;
      close: string;
    };
  };
  branches: PublicBranch[];
}

// Request interfaces
export interface CreateOrganizationRequest {
  name: string;
  description: string;
  logo?: string;
  website?: string;
  type: Organization["type"];
  contactInfo: Organization["contactInfo"];
  socialMedia?: Organization["socialMedia"];
  services: string[];
  operatingHours?: Organization["operatingHours"];
  capacity?: Organization["capacity"];
  requirements?: Organization["requirements"];
  branches?: Omit<
    Branch,
    "id" | "organizationId" | "createdAt" | "updatedAt"
  >[];
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  logo?: string;
  website?: string;
  type?: Organization["type"];
  status?: Organization["status"];
  contactInfo?: Organization["contactInfo"];
  socialMedia?: Organization["socialMedia"];
  services?: string[];
  operatingHours?: Organization["operatingHours"];
  capacity?: Organization["capacity"];
  requirements?: Organization["requirements"];
}

export interface CreateBranchRequest {
  name: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  phone: string;
  email: string;
  isMainBranch: boolean;
  coordinates?: Branch["coordinates"];
  operatingHours?: Branch["operatingHours"];
  services?: string[];
  status?: Branch["status"];
}

export interface UpdateBranchRequest {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  isMainBranch?: boolean;
  coordinates?: Branch["coordinates"];
  operatingHours?: Branch["operatingHours"];
  services?: string[];
  status?: Branch["status"];
}
