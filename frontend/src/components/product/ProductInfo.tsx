import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { WishlistButton } from "@/components/wishlist/WishlistButton";

interface ProductInfoProps {
  productId: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
}

export function ProductInfo({ productId, name, category, rating, reviewCount }: ProductInfoProps) {
  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold tracking-wider text-muted uppercase">
        {category}
      </span>
      
      <div className="flex items-start justify-between gap-4">
        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground leading-tight tracking-tight break-words">
          {name}
        </h1>
        <WishlistButton productId={productId} className="shrink-0 scale-125 hover:bg-black/5" />
      </div>
      
      <div className="flex items-center flex-wrap gap-2 mt-1">
        <div className="flex text-[#F5C518]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={cn("w-4 h-4", i < Math.floor(rating) ? "fill-current" : "fill-transparent text-muted/30")}
            />
          ))}
        </div>
        <span className="text-sm font-semibold text-foreground">{rating.toFixed(1)}</span>
        <span className="text-sm font-medium text-muted underline decoration-dashed underline-offset-4 cursor-pointer hover:text-foreground transition-colors">
          ({reviewCount} reviews)
        </span>
      </div>
    </div>
  );
}
