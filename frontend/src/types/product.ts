export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  price: number;
  originalPrice?: number;
  discount?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  image: string;
  gallery?: string[];
  badge?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  specifications?: Record<string, string>;
}
