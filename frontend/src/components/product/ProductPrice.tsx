import { formatPrice } from "@/lib/utils";

interface ProductPriceProps {
  price: number;
  originalPrice?: number;
  discount?: number;
}

export function ProductPrice({ price, originalPrice, discount }: ProductPriceProps) {
  return (
    <div className="flex items-end flex-wrap gap-3 mt-6 mb-8">
      <span className="text-4xl font-bold font-heading text-foreground tracking-tight tabular-nums">
        {formatPrice(price)}
      </span>
      
      {originalPrice && (
        <span className="text-lg font-medium text-muted line-through mb-1 tabular-nums">
          {formatPrice(originalPrice)}
        </span>
      )}
      
      {discount && (
        <span className="text-sm font-bold text-[#e04f2f] bg-[#e04f2f]/10 px-2 py-1 rounded-md mb-1.5 ml-2">
          {discount}% OFF
        </span>
      )}
    </div>
  );
}
