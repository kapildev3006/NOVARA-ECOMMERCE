import { Product } from "@/types/product";
import { mockProducts } from "@/data/products";

const STORAGE_KEY = "novara-admin-products";

export function getAdminProducts(): Product[] {
  if (typeof window === "undefined") return [...mockProducts];

  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      // Initialize with copy of mockProducts
      const initial = [...mockProducts];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to parse admin products from localStorage:", err);
    return [...mockProducts]; // Fallback to mock catalog without crashing
  }
}

export function saveAdminProduct(product: Product): void {
  if (typeof window === "undefined") return;

  try {
    const currentProducts = getAdminProducts();
    
    // Check if updating or adding
    const existingIndex = currentProducts.findIndex(p => p.id === product.id);
    
    if (existingIndex >= 0) {
      currentProducts[existingIndex] = product;
    } else {
      // Add to front of array
      currentProducts.unshift(product);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentProducts));
  } catch (err) {
    console.error("Failed to save admin product:", err);
  }
}

export function generateProductId(): string {
  // Use timestamp + random for stable local ID
  return `prod-local-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
}

export function checkSlugUnique(slug: string, excludeId?: string): boolean {
  if (typeof window === "undefined") return true;

  const currentProducts = getAdminProducts();
  const duplicate = currentProducts.find(
    p => p.slug === slug && p.id !== excludeId
  );
  
  return !duplicate;
}

export function deleteAdminProduct(productId: string): boolean {
  if (typeof window === "undefined") return false;

  try {
    const currentProducts = getAdminProducts();
    const updatedProducts = currentProducts.filter(p => p.id !== productId);
    
    // If lengths are same, product didn't exist
    if (currentProducts.length === updatedProducts.length) return false;
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProducts));
    return true;
  } catch (err) {
    console.error("Failed to delete admin product:", err);
    return false;
  }
}
