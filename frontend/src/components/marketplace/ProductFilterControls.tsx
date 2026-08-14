"use client";

import { useCallback, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { mockCategories } from "@/data/categories";

export function ProductFilterControls() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category");
  const minPrice = searchParams.get("minPrice") ? Number(searchParams.get("minPrice")) : "";
  const maxPrice = searchParams.get("maxPrice") ? Number(searchParams.get("maxPrice")) : "";
  const rating = searchParams.get("rating") ? Number(searchParams.get("rating")) : 0;
  const inStock = searchParams.get("inStock") === "true";

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleCategoryChange = (slug: string) => {
    router.push(pathname + "?" + createQueryString("category", slug === currentCategory ? "" : slug));
  };

  const handleRatingChange = (val: number) => {
    router.push(pathname + "?" + createQueryString("rating", val === rating ? "" : val.toString()));
  };

  const handleStockChange = () => {
    router.push(pathname + "?" + createQueryString("inStock", inStock ? "" : "true"));
  };

  // Local state for price inputs so we don't update URL on every keystroke
  const [localMin, setLocalMin] = useState(minPrice);
  const [localMax, setLocalMax] = useState(maxPrice);

  const applyPriceFilter = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (localMin) params.set("minPrice", localMin.toString());
    else params.delete("minPrice");
    
    if (localMax) params.set("maxPrice", localMax.toString());
    else params.delete("maxPrice");
    
    router.push(pathname + "?" + params.toString());
  };

  const clearFilters = () => {
    setLocalMin("");
    setLocalMax("");
    router.push(pathname);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* Category Filter */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted">Category</h3>
        <div className="flex flex-col gap-2">
          {mockCategories.map((cat) => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={currentCategory === cat.slug}
                onChange={() => handleCategoryChange(cat.slug)}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
              />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                {cat.name}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Filter */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted">Price Range</h3>
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={localMin}
            onChange={(e) => setLocalMin(e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-surface border border-black/5 rounded-lg h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <span className="text-muted">-</span>
          <input
            type="number"
            placeholder="Max"
            value={localMax}
            onChange={(e) => setLocalMax(e.target.value ? Number(e.target.value) : "")}
            className="w-full bg-surface border border-black/5 rounded-lg h-9 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <button 
          onClick={applyPriceFilter}
          className="bg-black/5 hover:bg-black/10 text-foreground text-xs font-semibold py-2 rounded-lg transition-colors mt-1"
        >
          Apply Price
        </button>
      </div>

      {/* Rating Filter */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted">Rating</h3>
        <div className="flex flex-col gap-2">
          {[4, 3, 2, 1].map((r) => (
            <label key={r} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="rating"
                checked={rating === r}
                onChange={() => handleRatingChange(r)}
                className="w-4 h-4 text-primary focus:ring-primary accent-primary"
              />
              <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} className={`w-3.5 h-3.5 ${i < r ? 'text-[#F5C518] fill-current' : 'text-muted/30 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                ))}
                <span className="ml-1 text-muted text-xs">& Up</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Availability Filter */}
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm uppercase tracking-wider text-muted">Availability</h3>
        <label className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={inStock}
            onChange={handleStockChange}
            className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary accent-primary"
          />
          <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
            In Stock Only
          </span>
        </label>
      </div>
      
      {/* Clear Filters (Visible only if filters applied) */}
      {(currentCategory || minPrice || maxPrice || rating > 0 || inStock) && (
        <button 
          onClick={clearFilters}
          className="text-primary hover:text-[#e04f2f] text-sm font-semibold py-2 text-left transition-colors mt-2"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
