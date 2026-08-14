import { Category } from "@/types/category";
import { mockCategories } from "@/data/categories";

const STORAGE_KEY = "novara-admin-categories";

export function getAdminCategories(): Category[] {
  if (typeof window === "undefined") {
    return mockCategories.map(c => ({
      ...c,
      isActive: c.isActive ?? true,
    }));
  }

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Initialize with copy of mockCategories
      const initial = mockCategories.map(c => ({
        ...c,
        isActive: c.isActive ?? true,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse admin categories from localStorage:", err);
    // Fallback without crashing
    return mockCategories.map(c => ({
      ...c,
      isActive: c.isActive ?? true,
    }));
  }
}

export function saveAdminCategory(category: Category): void {
  if (typeof window === "undefined") return;

  try {
    const currentCategories = getAdminCategories();
    
    // Check if updating or adding
    const existingIndex = currentCategories.findIndex(c => c.id === category.id);
    
    if (existingIndex >= 0) {
      currentCategories[existingIndex] = category;
    } else {
      // Add to front of array
      currentCategories.unshift(category);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentCategories));
  } catch (err) {
    console.error("Failed to save admin category:", err);
  }
}

export function generateCategoryId(): string {
  // Use timestamp + random for stable local ID
  return `cat-local-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function checkCategorySlugUnique(slug: string, excludeId?: string): boolean {
  if (typeof window === "undefined") return true;

  const currentCategories = getAdminCategories();
  const duplicate = currentCategories.find(
    c => c.slug === slug && c.id !== excludeId
  );
  
  return !duplicate;
}

export function deleteAdminCategory(categoryId: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const currentCategories = getAdminCategories();
    const updatedCategories = currentCategories.filter(c => c.id !== categoryId);
    
    // If lengths are same, category didn't exist
    if (currentCategories.length === updatedCategories.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedCategories));
    return true;
  } catch (err) {
    console.error("Failed to delete admin category:", err);
    return false;
  }
}
