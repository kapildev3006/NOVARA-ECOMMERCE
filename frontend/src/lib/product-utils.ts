import { Product } from "@/types/product";

export type SortOption =
  | "relevance"
  | "price-asc"
  | "price-desc"
  | "rating"
  | "newest"
  | "discount";

export interface FilterParams {
  query?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  minDiscount?: number;
  inStock?: boolean;
}

export function searchProducts(products: Product[], query?: string): Product[] {
  if (!query) return products;
  
  const lowerQuery = query.toLowerCase().trim();
  return products.filter((p) => {
    return (
      p.name.toLowerCase().includes(lowerQuery) ||
      p.category.toLowerCase().includes(lowerQuery) ||
      p.description.toLowerCase().includes(lowerQuery)
    );
  });
}

export function filterProducts(products: Product[], filters: FilterParams): Product[] {
  let filtered = [...products];

  if (filters.query) {
    filtered = searchProducts(filtered, filters.query);
  }

  if (filters.category) {
    const categoryLower = filters.category.toLowerCase();
    filtered = filtered.filter((p) => p.category.toLowerCase() === categoryLower);
  }

  if (filters.minPrice !== undefined) {
    filtered = filtered.filter((p) => p.price >= filters.minPrice!);
  }

  if (filters.maxPrice !== undefined) {
    filtered = filtered.filter((p) => p.price <= filters.maxPrice!);
  }

  if (filters.rating !== undefined) {
    filtered = filtered.filter((p) => p.rating >= filters.rating!);
  }

  if (filters.minDiscount !== undefined) {
    filtered = filtered.filter((p) => (p.discount || 0) >= filters.minDiscount!);
  }

  if (filters.inStock) {
    filtered = filtered.filter((p) => p.stock > 0);
  }

  return filtered;
}

export function sortProducts(products: Product[], sortType: SortOption = "relevance"): Product[] {
  const sorted = [...products];

  switch (sortType) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating);
    case "newest":
      return sorted.sort((a, b) => {
        if (a.isNew === b.isNew) return 0;
        return a.isNew ? -1 : 1;
      });
    case "discount":
      return sorted.sort((a, b) => (b.discount || 0) - (a.discount || 0));
    case "relevance":
    default:
      return sorted; // Keep original order for relevance
  }
}
