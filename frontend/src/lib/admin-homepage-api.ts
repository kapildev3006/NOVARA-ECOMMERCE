import { API_BASE_URL } from "./api-config";
import { HomepageSection, HomepageSectionType } from "@/types/homepage";

export class AdminHomepageAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AdminHomepageAPIError";
  }
}

async function fetchWithAuth(endpoint: string, options: RequestInit = {}) {
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
}

export async function getAdminHomepage(): Promise<AdminHomepageResponse> {
  const result = await fetchWithAuth("/admin/homepage");
  if (!result.success || !Array.isArray(result.data)) {
    throw new Error("Invalid response format");
  }
  return {
    sections: result.data.map(mapToFrontend),
    revisionId: result.revisionId,
    publishedAt: result.publishedAt,
  };
}

export async function publishAdminHomepage(revisionId: number): Promise<{ revisionId: number }> {
  const result = await fetchWithAuth("/admin/homepage/publish", {
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
  
  const result = await fetchWithAuth("/admin/homepage", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  
  return mapToFrontend(result.data);
}

export async function updateHomepageSection(id: string, updates: Partial<HomepageSection>): Promise<HomepageSection> {
  // id here must be the MongoDB _id !
  const payload: unknown = {};
  const p = payload as any;
  if (updates.title !== undefined) p.title = updates.title;
  if (updates.subtitle !== undefined) p.subtitle = updates.subtitle;
  if (updates.enabled !== undefined) p.enabled = updates.enabled;
  if (updates.order !== undefined) p.order = updates.order;
  if (updates.config !== undefined) p.config = updates.config;

  const result = await fetchWithAuth(`/admin/homepage/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return mapToFrontend(result.data);
}

export async function toggleHomepageSection(id: string, enabled: boolean): Promise<HomepageSection> {
  return updateHomepageSection(id, { enabled });
}

export async function deleteHomepageSection(id: string): Promise<void> {
  await fetchWithAuth(`/admin/homepage/${id}`, {
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

  const result = await fetchWithAuth("/admin/homepage", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  return result.data?.message ? [] : [];
}
