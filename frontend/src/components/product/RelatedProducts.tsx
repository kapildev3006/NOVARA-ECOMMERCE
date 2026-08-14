import { mockProducts } from "@/data/products";
import { ProductCard } from "@/components/product/ProductCard";

interface RelatedProductsProps {
  currentProductId: string;
  category: string;
}

export function RelatedProducts({ currentProductId, category }: RelatedProductsProps) {
  // Find products in the same category, excluding the current one
  const related = mockProducts
    .filter(p => p.category === category && p.id !== currentProductId)
    .slice(0, 4); // max 4 for desktop

  if (related.length === 0) {
    return null; // As requested, don't show empty state
  }

  return (
    <div className="mt-20 pt-16 border-t border-black/5">
      <h2 className="text-2xl font-heading font-bold mb-8">Related Products</h2>
      
      {/* Mobile: Horizontal Scroll. Tablet/Desktop: Grid */}
      <div className="flex overflow-x-auto pb-6 -mx-4 px-4 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 snap-x snap-mandatory scrollbar-hide">
        {related.map(product => (
          <div key={product.id} className="w-[280px] shrink-0 snap-start md:w-auto md:shrink-1">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
