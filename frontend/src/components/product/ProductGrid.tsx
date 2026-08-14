import { Product } from "@/types/product";
import { ProductCard } from "./ProductCard";
import { SearchX } from "lucide-react";
import Link from "next/link";

interface ProductGridProps {
  products: Product[];
}

export function ProductGrid({ products }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface/50 rounded-2xl border border-black/5 border-dashed">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
          <SearchX className="w-8 h-8 text-muted" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">No products found</h3>
        <p className="text-sm text-muted max-w-md mb-6">
          We couldn&apos;t find any products matching your current filters. Try adjusting your search criteria or clearing your filters.
        </p>
        <Link 
          href="/products"
          className="bg-primary hover:bg-[#e04f2f] text-white text-sm font-semibold py-2.5 px-6 rounded-xl shadow-sm hover:shadow-md transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
        >
          Clear All Filters
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
