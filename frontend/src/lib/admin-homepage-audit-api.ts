import { API_BASE_URL } from "./api-config";

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

export async function fetchHomepageAuditLogs(page: number = 1, limit: number = 20): Promise<PaginatedAuditLogs> {
  const url = new URL(`${API_BASE_URL}/admin/homepage/audit`);
  url.searchParams.append("page", page.toString());
  url.searchParams.append("limit", limit.toString());

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
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
    throw new AdminHomepageAuditAPIError(res.status, message);
  }

  const data = await res.json();
  return data.data;
}
