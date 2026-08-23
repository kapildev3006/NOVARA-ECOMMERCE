import { API_BASE_URL } from "./api-config";
import { HomepageSection, HomepageSectionType } from "@/types/homepage";

// The backend response format based on Phase 26
interface BackendHomepageSection {
  _id: string;
  sectionKey: string;
  type: string;
  title?: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  isProtected?: boolean;
  config?: Record<string, unknown>;
}

export async function getHomepageSections(queryParams: string = ""): Promise<HomepageSection[]> {
  const response = await fetch(`${API_BASE_URL}/homepage${queryParams}`, {
    headers: {
      "Content-Type": "application/json",
    },
    // We typically want fresh data, or we rely on SWR/React hook to handle refetching
    // We'll let the hook handle refetching, but this prevents aggressive caching of the fetch call by Next.js if executed in server-like contexts
    cache: "no-store", 
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch homepage sections: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  
  if (!result.success || !Array.isArray(result.data)) {
    throw new Error("Invalid response format from homepage API");
  }

  // Adapter mapping BackendHomepageSection to our frontend HomepageSection type
  return result.data.map((backendSection: BackendHomepageSection): HomepageSection => {
    return {
      _id: backendSection._id,
      id: backendSection.sectionKey, // Map backend sectionKey to frontend id
      type: backendSection.type as HomepageSectionType,
      title: backendSection.title,
      subtitle: backendSection.subtitle,
      enabled: backendSection.enabled,
      order: backendSection.order,
      isProtected: backendSection.isProtected,
      config: backendSection.config,
    };
  });
}
