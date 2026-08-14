import { HomepageSection, HomepageSectionType } from "@/types/homepage";
import { defaultHomepageSections } from "@/data/default-homepage";

const STORAGE_KEY = "novara-admin-homepage";

const VALID_TYPES: HomepageSectionType[] = [
  "announcement",
  "hero",
  "service-bar",
  "categories",
  "product-carousel",
  "promo-banner",
];

function validateSections(data: unknown): HomepageSection[] | null {
  if (!Array.isArray(data)) return null;

  const validSections = data.filter(item => {
    if (!item || typeof item !== "object") return false;
    if (typeof item.id !== "string") return false;
    if (!VALID_TYPES.includes(item.type)) return false;
    if (typeof item.enabled !== "boolean") return false;
    if (typeof item.order !== "number") return false;
    return true;
  });

  if (validSections.length === 0) return null;
  return validSections as HomepageSection[];
}

export function getHomepageSections(): HomepageSection[] {
  if (typeof window === "undefined") {
    return [...defaultHomepageSections];
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return [...defaultHomepageSections];
    }
    const parsed = JSON.parse(stored);
    const validated = validateSections(parsed);
    
    if (!validated) {
      console.warn("Invalid homepage sections detected. Falling back to default.");
      return [...defaultHomepageSections];
    }
    
    return validated.sort((a, b) => a.order - b.order);
  } catch (err) {
    console.error("Failed to parse homepage sections:", err);
    return [...defaultHomepageSections];
  }
}

export function saveHomepageSections(sections: HomepageSection[]): void {
  if (typeof window === "undefined") return;
  try {
    // Re-ensure valid order values before saving
    const sorted = [...sections].sort((a, b) => a.order - b.order).map((s, i) => ({
      ...s,
      order: i
    }));
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
  } catch (err) {
    console.error("Failed to save homepage sections:", err);
  }
}

export function resetHomepageSections(): HomepageSection[] {
  if (typeof window === "undefined") return [...defaultHomepageSections];
  localStorage.removeItem(STORAGE_KEY);
  return [...defaultHomepageSections];
}
