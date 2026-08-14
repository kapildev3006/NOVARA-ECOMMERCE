"use client";

import { Product } from "@/types/product";
import { cn, formatPrice } from "@/lib/utils";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { WishlistButton } from "@/components/wishlist/WishlistButton";
import { useCart } from "@/context/CartContext";

interface ProductCardProps {
  product: Product;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isOutOfStock) {
      addToCart(product.id, 1);
    }
  };

  return (
    <div className={cn("group flex flex-col bg-surface rounded-2xl overflow-hidden novara-card-hover relative", className)}>
      {/* Badges */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2">
        {product.badge && (
          <span className="bg-foreground text-background text-[10px] font-bold px-2 py-1 rounded-[4px] uppercase tracking-wider shadow-sm">
            {product.badge}
          </span>
        )}
        {product.discount && (
          <span className="bg-primary text-white text-[10px] font-bold px-2 py-1 rounded-[4px] shadow-sm">
            -{product.discount}%
          </span>
        )}
      </div>

      {/* Wishlist */}
      <div className="absolute top-3 right-3 z-20">
        <WishlistButton productId={product.id} />
      </div>

      {/* Image */}
      <Link href={`/product/${product.slug}`} className="relative aspect-square w-full bg-white overflow-hidden flex items-center justify-center p-4">
        <Image
          src={product.image}
          alt={product.name}
          fill
          className="object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500 ease-out p-6"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
        />
      </Link>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4">
        <div className="flex items-center gap-1.5 mb-2.5">
          <div className="flex text-[#F5C518]">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={cn("w-3 h-3", i < Math.floor(product.rating) ? "fill-current" : "fill-transparent text-muted/30")}
              />
            ))}
          </div>
          <span className="text-[11px] font-medium text-muted">({product.reviewCount})</span>
        </div>

        <Link href={`/product/${product.slug}`} className="mb-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
          <h3 className="font-semibold text-foreground text-sm line-clamp-2 min-h-[2.5rem] leading-tight group-hover:text-primary transition-colors">
            {product.name}
          </h3>
        </Link>
        <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-4">{product.category}</p>

        <div className="mt-auto flex items-end justify-between gap-2">
          <div className="flex flex-col gap-0.5">
            {product.originalPrice && (
              <span className="text-[11px] text-muted line-through font-medium tabular-nums leading-none">
                {formatPrice(product.originalPrice)}
              </span>
            )}
            <span className="text-[17px] font-bold text-foreground tabular-nums leading-none">
              {formatPrice(product.price)}
            </span>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="shrink-0 h-8 px-3 text-xs rounded-md bg-white border-black/5 hover:border-primary hover:text-primary shadow-sm disabled:opacity-50 disabled:hover:border-black/5 disabled:hover:text-foreground"
          >
            {isOutOfStock ? "Out of Stock" : "Add"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div className="flex flex-col bg-surface rounded-2xl overflow-hidden animate-pulse">
      <div className="aspect-square w-full bg-black/5" />
      <div className="p-4 md:p-5 flex flex-col gap-3">
        <div className="w-1/3 h-4 bg-black/5 rounded-md" />
        <div className="w-full h-5 bg-black/5 rounded-md" />
        <div className="w-2/3 h-5 bg-black/5 rounded-md" />
        <div className="mt-4 flex justify-between items-end">
          <div className="w-1/4 h-6 bg-black/5 rounded-md" />
          <div className="w-16 h-10 bg-black/5 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
