import { API_BASE_URL } from "./api-config";

async function fetchWithAuth(endpoint: string, options: RequestInit = {}, skipContentType = false) {
  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) };
  if (!skipContentType) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include", // Required to send HttpOnly auth cookies
  });

  return res;
}

export interface MediaAssetData {
  assetKey: string;
  provider: string;
  publicId: string;
  url: string;
  secureUrl?: string;
  resourceType: string;
  format: string;
  bytes?: number;
  width?: number;
  height?: number;
  altText?: string;
  caption?: string;
  folder?: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface MediaListResponse {
  success: boolean;
  assets: MediaAssetData[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface MediaUsageData {
  live: boolean;
  draft: boolean;
  revisions: number[];
  campaigns: string[];
}

export const getMediaAssets = async (params?: { page?: number; limit?: number; search?: string }): Promise<MediaListResponse> => {
  const query = new URLSearchParams();
  if (params?.page) query.append("page", params.page.toString());
  if (params?.limit) query.append("limit", params.limit.toString());
  if (params?.search) query.append("search", params.search);

  const res = await fetchWithAuth(`/api/v1/admin/media?${query.toString()}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || "Failed to fetch media assets");
  }
  return res.json();
};

export const getMediaAsset = async (assetKey: string): Promise<MediaAssetData> => {
  const res = await fetchWithAuth(`/api/v1/admin/media/${assetKey}`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || "Failed to fetch media asset");
  }
  const data = await res.json();
  return data.asset;
};

export const uploadMedia = async (file: File): Promise<MediaAssetData> => {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetchWithAuth(`/api/v1/admin/media`, {
    method: "POST",
    body: formData,
  }, true); // pass true or skip Content-Type header so the browser sets it with the boundary

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || "Failed to upload media");
  }
  const data = await res.json();
  return data.asset;
};

export const updateMediaAsset = async (assetKey: string, payload: Partial<MediaAssetData>): Promise<MediaAssetData> => {
  const res = await fetchWithAuth(`/api/v1/admin/media/${assetKey}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || "Failed to update media asset");
  }
  const data = await res.json();
  return data.asset;
};

export const deleteMediaAsset = async (assetKey: string): Promise<void> => {
  const res = await fetchWithAuth(`/api/v1/admin/media/${assetKey}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || "Failed to delete media asset");
  }
};

export const getMediaUsage = async (assetKey: string): Promise<MediaUsageData> => {
  const res = await fetchWithAuth(`/api/v1/admin/media/${assetKey}/usage`);
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error?.message || "Failed to get media usage");
  }
  const data = await res.json();
  return data.usage;
};
