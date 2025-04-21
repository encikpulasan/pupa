import { getKv, KV_COLLECTIONS } from "../db/kv.ts";
import { crypto } from "https://deno.land/std@0.185.0/crypto/crypto.ts";
import {
  Branch,
  CreateBranchRequest,
  CreateOrganizationRequest,
  Organization,
  PublicBranch,
  PublicOrganization,
  UpdateBranchRequest,
  UpdateOrganizationRequest,
} from "../types/organization.ts";

// Generate UUID
function generateId(): string {
  return crypto.randomUUID();
}

// Helper function to convert Organization to PublicOrganization
function toPublicOrganization(
  org: Organization,
  branches: Branch[],
): PublicOrganization {
  const publicBranches: PublicBranch[] = branches.map((branch) => ({
    id: branch.id,
    organizationId: branch.organizationId,
    name: branch.name,
    address: branch.address,
    city: branch.city,
    state: branch.state,
    country: branch.country,
    postalCode: branch.postalCode,
    phone: branch.phone,
    email: branch.email,
    isMainBranch: branch.isMainBranch,
    coordinates: branch.coordinates,
    operatingHours: branch.operatingHours,
    services: branch.services,
    status: branch.status,
  }));

  return {
    id: org.id,
    name: org.name,
    description: org.description,
    logo: org.logo,
    website: org.website,
    type: org.type,
    status: org.status,
    contactInfo: org.contactInfo,
    socialMedia: org.socialMedia,
    services: org.services,
    operatingHours: org.operatingHours,
    branches: publicBranches,
  };
}

// Organization operations
export async function createOrganization(
  data: CreateOrganizationRequest,
): Promise<Organization> {
  const kv = getKv();
  const id = generateId();
  const now = new Date().toISOString();

  const organization: Organization = {
    id,
    ...data,
    status: "active",
    createdAt: now,
    updatedAt: now,
  };

  // Create branches if provided
  if (data.branches && data.branches.length > 0) {
    const branches: Branch[] = data.branches.map((branch) => ({
      id: generateId(),
      organizationId: id,
      ...branch,
      status: branch.status || "active",
      createdAt: now,
      updatedAt: now,
    }));

    // Store branches
    await Promise.all(
      branches.map((branch) =>
        kv.set([KV_COLLECTIONS.BRANCHES, branch.id], branch)
      ),
    );
  }

  // Store organization
  await kv.set([KV_COLLECTIONS.ORGANIZATIONS, id], organization);

  return organization;
}

export async function getOrganization(
  id: string,
): Promise<Organization | null> {
  const kv = getKv();
  const result = await kv.get<Organization>([KV_COLLECTIONS.ORGANIZATIONS, id]);
  return result.value;
}

export async function getPublicOrganization(
  id: string,
): Promise<PublicOrganization | null> {
  const organization = await getOrganization(id);
  if (!organization) return null;

  const branches = await getOrganizationBranches(id);
  return toPublicOrganization(organization, branches);
}

export async function updateOrganization(
  id: string,
  data: UpdateOrganizationRequest,
): Promise<Organization | null> {
  const organization = await getOrganization(id);
  if (!organization) return null;

  const kv = getKv();
  const updatedOrganization: Organization = {
    ...organization,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await kv.set([KV_COLLECTIONS.ORGANIZATIONS, id], updatedOrganization);
  return updatedOrganization;
}

export async function deleteOrganization(id: string): Promise<boolean> {
  const organization = await getOrganization(id);
  if (!organization) return false;

  const kv = getKv();
  // Delete all branches
  const branches = await getOrganizationBranches(id);
  await Promise.all(
    branches.map((branch) => kv.delete([KV_COLLECTIONS.BRANCHES, branch.id])),
  );

  // Delete organization
  await kv.delete([KV_COLLECTIONS.ORGANIZATIONS, id]);
  return true;
}

export async function listOrganizations(): Promise<Organization[]> {
  const kv = getKv();
  const organizations: Organization[] = [];
  for await (
    const { value } of kv.list<Organization>({
      prefix: [KV_COLLECTIONS.ORGANIZATIONS],
    })
  ) {
    organizations.push(value);
  }
  return organizations;
}

export async function listPublicOrganizations(): Promise<PublicOrganization[]> {
  const organizations = await listOrganizations();
  const publicOrganizations: PublicOrganization[] = [];

  for (const org of organizations) {
    const branches = await getOrganizationBranches(org.id);
    publicOrganizations.push(toPublicOrganization(org, branches));
  }

  return publicOrganizations;
}

// Branch operations
export async function createBranch(
  organizationId: string,
  data: CreateBranchRequest,
): Promise<Branch | null> {
  const organization = await getOrganization(organizationId);
  if (!organization) return null;

  const kv = getKv();
  const id = generateId();
  const now = new Date().toISOString();

  const branch: Branch = {
    id,
    organizationId,
    ...data,
    status: data.status || "active",
    createdAt: now,
    updatedAt: now,
  };

  await kv.set([KV_COLLECTIONS.BRANCHES, id], branch);
  return branch;
}

export async function getBranch(id: string): Promise<Branch | null> {
  const kv = getKv();
  const result = await kv.get<Branch>([KV_COLLECTIONS.BRANCHES, id]);
  return result.value;
}

export async function getOrganizationBranches(
  organizationId: string,
): Promise<Branch[]> {
  const kv = getKv();
  const branches: Branch[] = [];
  for await (
    const { value } of kv.list<Branch>({
      prefix: [KV_COLLECTIONS.BRANCHES],
    })
  ) {
    if (value.organizationId === organizationId) {
      branches.push(value);
    }
  }
  return branches;
}

export async function updateBranch(
  id: string,
  data: UpdateBranchRequest,
): Promise<Branch | null> {
  const branch = await getBranch(id);
  if (!branch) return null;

  const kv = getKv();
  const updatedBranch: Branch = {
    ...branch,
    ...data,
    updatedAt: new Date().toISOString(),
  };

  await kv.set([KV_COLLECTIONS.BRANCHES, id], updatedBranch);
  return updatedBranch;
}

export async function deleteBranch(id: string): Promise<boolean> {
  const branch = await getBranch(id);
  if (!branch) return false;

  const kv = getKv();
  await kv.delete([KV_COLLECTIONS.BRANCHES, id]);
  return true;
}
