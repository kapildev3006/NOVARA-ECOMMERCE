"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { mockProducts } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";

interface RecentlyViewedProps {
  currentSlug: string;
}

const RECENT_VIEWED_KEY = "novara_recently_viewed";
const MAX_RECENT = 6;

export function RecentlyViewed({ currentSlug }: RecentlyViewedProps) {
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    try {
      // 1. Get existing from localStorage
      const stored = localStorage.getItem(RECENT_VIEWED_KEY);
      let slugs: string[] = stored ? JSON.parse(stored) : [];

      // 2. Remove current slug if it exists to prevent duplicates
      slugs = slugs.filter(s => s !== currentSlug);

      // 3. Add current slug to the start of the array
      slugs.unshift(currentSlug);

      // 4. Trim to max length
      if (slugs.length > MAX_RECENT) {
        slugs = slugs.slice(0, MAX_RECENT);
      }

      // 5. Save back to localStorage
      localStorage.setItem(RECENT_VIEWED_KEY, JSON.stringify(slugs));

      // 6. Resolve slugs to actual products (excluding the current one for display)
      const displaySlugs = slugs.filter(s => s !== currentSlug);
      const resolved = displaySlugs
        .map(slug => mockProducts.find(p => p.slug === slug))
        .filter((p): p is Product => p !== undefined);

      setTimeout(() => setRecentProducts(resolved), 0);
    } catch (error) {
      console.error("Failed to parse recently viewed from localStorage", error);
    }
  }, [currentSlug]);

  // Prevent SSR hydration mismatch and hide if empty
  if (!mounted || recentProducts.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 pt-16 border-t border-black/5 mb-12">
      <h2 className="text-2xl font-heading font-bold mb-8">Recently Viewed</h2>
      
      {/* Mobile: Horizontal Scroll. Tablet/Desktop: Grid */}
      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 snap-x snap-mandatory scrollbar-hide">
        {recentProducts.slice(0, 4).map(product => (
          <div key={product.id} className="w-[280px] shrink-0 snap-start md:w-auto md:shrink-1">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
