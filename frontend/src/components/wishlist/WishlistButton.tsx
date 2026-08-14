"use client";

import { useWishlist } from "@/context/WishlistContext";
import { Heart } from "lucide-react";
import { cn } from "@/lib/utils";

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist, isHydrated } = useWishlist();

  const wishlisted = isHydrated ? isWishlisted(productId) : false;

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  return (
    <button 
      onClick={handleClick}
      aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
      className={cn(
        "z-20 p-2 rounded-full backdrop-blur-sm shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        wishlisted 
          ? "bg-primary text-white hover:bg-primary/90" 
          : "bg-white/90 text-muted hover:bg-white hover:text-primary",
        className
      )}
    >
      <Heart className={cn("w-4 h-4 transition-transform active:scale-75", wishlisted && "fill-current")} />
    </button>
  );
}
