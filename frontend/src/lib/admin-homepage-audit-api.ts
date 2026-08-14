import { fetchWithAuth } from "./api";

export interface HomepageAuditLog {
  _id: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "REORDER" | "SEED";
  sectionId?: string;
  sectionKey?: string;
  actorId?: string;
  actorRole?: string;
  changes?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface PaginatedAuditLogs {
  items: HomepageAuditLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export class AdminHomepageAuditAPIError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "AdminHomepageAuditAPIError";
  }
}

export async function fetchHomepageAuditLogs(
  page = 1,
  limit = 20,
  action?: string,
  sectionId?: string,
  actorId?: string
): Promise<PaginatedAuditLogs> {
  const query = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });
  if (action) query.append("action", action);
  if (sectionId) query.append("sectionId", sectionId);
  if (actorId) query.append("actorId", actorId);

  const res = await fetchWithAuth(`/admin/homepage/audit?${query.toString()}`);

  if (!res.ok) {
    let message = res.statusText;
    try {
      const data = await res.json();
      if (data.message) message = data.message;
      if (data.error?.message) message = data.error.message;
    } catch {
      // Ignore
    }
    throw new AdminHomepageAuditAPIError(res.status, message);
  }

  const data = await res.json();
  return data.data;
}
