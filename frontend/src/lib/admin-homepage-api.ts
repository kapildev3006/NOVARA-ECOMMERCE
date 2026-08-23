import { API_BASE_URL } from "./api-config";
import { HomepageSection, HomepageSectionType } from "@/types/homepage";
import { HomepageCampaign, CreateCampaignData } from "@/types/homepageCampaign";

export class AdminHomepageAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AdminHomepageAPIError";
  }
}

export async function fetchAdminApi(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "include", // Required to send HttpOnly auth cookies
  });

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (data.message) message = data.message;
      if (data.error?.message) message = data.error.message;
    } catch {
      // Ignore
    }
    throw new AdminHomepageAPIError(res.status, message);
  }

  return res.json();
}

// Adapter
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapToFrontend(backendSection: any): HomepageSection {
  return {
    _id: backendSection._id,
    id: backendSection.sectionKey,
    type: backendSection.type as HomepageSectionType,
    title: backendSection.title,
    subtitle: backendSection.subtitle,
    enabled: backendSection.enabled,
    order: backendSection.order,
    isProtected: backendSection.isProtected,
    config: backendSection.config,
  };
}

export interface AdminHomepageResponse {
  sections: HomepageSection[];
  revisionId: number;
  publishedAt?: string;
  rollbackFromRevisionId?: number;
  scheduledRevision?: {
    revisionId: number;
    scheduledPublishAt: string;
    scheduledBy?: string;
  } | null;
}

export async function getAdminHomepage(): Promise<AdminHomepageResponse> {
  const result = await fetchAdminApi("/admin/homepage");
  if (!result.success || !Array.isArray(result.data)) {
    throw new Error("Invalid response format");
  }
  return {
    sections: result.data.map(mapToFrontend),
    revisionId: result.revisionId,
    publishedAt: result.publishedAt,
    rollbackFromRevisionId: result.rollbackFromRevisionId,
    scheduledRevision: result.scheduledRevision,
  };
}

export async function publishAdminHomepage(revisionId: number): Promise<{ revisionId: number }> {
  const result = await fetchAdminApi("/admin/homepage/publish", {
    method: "POST",
    body: JSON.stringify({ revisionId }),
  });
  return { revisionId: result.data.revisionId };
}

export async function createHomepageSection(section: Omit<HomepageSection, "_id" | "id" | "isProtected"> & { sectionKey: string }): Promise<HomepageSection> {
  const payload = {
    sectionKey: section.sectionKey,
    type: section.type,
    title: section.title,
    subtitle: section.subtitle,
    enabled: section.enabled,
    order: section.order,
    config: section.config || {},
  };
  
  const result = await fetchAdminApi("/admin/homepage", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  
  return mapToFrontend(result.data);
}

export async function updateHomepageSection(id: string, updates: Partial<HomepageSection>): Promise<HomepageSection> {
  // id here must be the MongoDB _id !
  const payload: Record<string, unknown> = {};
  const p = payload;
  if (updates.title !== undefined) p.title = updates.title;
  if (updates.subtitle !== undefined) p.subtitle = updates.subtitle;
  if (updates.enabled !== undefined) p.enabled = updates.enabled;
  if (updates.order !== undefined) p.order = updates.order;
  if (updates.config !== undefined) p.config = updates.config;

  const result = await fetchAdminApi(`/admin/homepage/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return mapToFrontend(result.data);
}

export async function toggleHomepageSection(id: string, enabled: boolean): Promise<HomepageSection> {
  return updateHomepageSection(id, { enabled });
}

export async function deleteHomepageSection(id: string): Promise<void> {
  await fetchAdminApi(`/admin/homepage/${id}`, {
    method: "DELETE",
  });
}

export async function reorderHomepageSections(sections: { _id: string; order: number }[]): Promise<HomepageSection[]> {
  const payload = {
    sections: sections.map(s => ({
      id: s._id,
      order: s.order
    }))
  };

  const result = await fetchAdminApi("/admin/homepage", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return result.data?.message ? [] : [];
}

export interface HomepageRevisionMeta {
  _id: string;
  revisionId: number;
  status: "draft" | "published" | "scheduled" | "cancelled" | "executing";
  publishedAt?: string;
  scheduledPublishAt?: string;
  publishedBy?: { _id: string; fullName: string; role: string; } | string;
  rollbackFromRevisionId?: number;
  createdAt: string;
}

export async function getHomepageRevisions(page = 1, limit = 20): Promise<{ items: HomepageRevisionMeta[], pagination: { page: number, limit: number, total: number, pages: number } }> {
  const result = await fetchAdminApi(`/admin/homepage/revisions?page=${page}&limit=${limit}`);
  return {
    items: result.data,
    pagination: result.pagination
  };
}

export async function getHomepageRevision(revisionId: number): Promise<{ revision: HomepageRevisionMeta, sections: HomepageSection[] }> {
  const result = await fetchAdminApi(`/admin/homepage/revisions/${revisionId}`);
  return {
    revision: result.data,
    sections: (result.data.sections || []).map(mapToFrontend)
  };
}

export async function rollbackHomepageRevision(revisionId: number, currentDraftRevisionId: number): Promise<{ revisionId: number }> {
  const result = await fetchAdminApi(`/admin/homepage/revisions/${revisionId}/rollback`, {
    method: "POST",
    body: JSON.stringify({ currentDraftRevisionId }),
  });
  return { revisionId: result.data.revisionId };
}

export async function scheduleHomepagePublish(revisionId: number, publishAt: string): Promise<{ revisionId: number }> {
  const result = await fetchAdminApi("/admin/homepage/schedule", {
    method: "POST",
    body: JSON.stringify({ revisionId, publishAt }),
  });
  return { revisionId: result.data.revisionId };
}

export async function cancelHomepageSchedule(): Promise<void> {
  await fetchAdminApi("/admin/homepage/schedule", {
    method: "DELETE",
  });
}

// --- CAMPAIGNS ---

export async function getHomepageCampaigns(page = 1, limit = 20, status?: string): Promise<{ items: HomepageCampaign[], pagination: { page: number, limit: number, total: number, pages: number } }> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  if (status) query.append("status", status);
  const result = await fetchAdminApi(`/admin/homepage/campaigns?${query.toString()}`);
  return {
    items: result.data,
    pagination: result.pagination
  };
}

export async function getHomepageCampaign(campaignKey: string): Promise<HomepageCampaign> {
  const result = await fetchAdminApi(`/admin/homepage/campaigns/${campaignKey}`);
  return result.data;
}

export async function createHomepageCampaign(data: CreateCampaignData): Promise<HomepageCampaign> {
  const result = await fetchAdminApi("/admin/homepage/campaigns", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result.data;
}

export async function cancelHomepageCampaign(campaignKey: string): Promise<void> {
  await fetchAdminApi(`/admin/homepage/campaigns/${campaignKey}/cancel`, {
    method: "POST",
  });
}

export interface ValidationIssue {
  code: string;
  severity: "error" | "warning";
  sectionKey?: string;
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
}

export async function validateHomepageRevision(revisionId: number): Promise<ValidationResult> {
  const result = await fetchAdminApi("/admin/homepage/validate", {
    method: "POST",
    body: JSON.stringify({ revisionId }),
  });
  return result.data;
}
