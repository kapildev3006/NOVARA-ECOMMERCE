"use client";

import { useWishlist } from "@/context/WishlistContext";
import { ProductCard } from "@/components/product/ProductCard";
import { Breadcrumb } from "@/components/marketplace/Breadcrumb";
import { mockProducts } from "@/data/products";
import { Heart, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function WishlistPage() {
  const { wishlistItems, isHydrated, clearWishlist } = useWishlist();

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "My Wishlist" }
  ];

  if (!isHydrated) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 py-8">
          <div className="animate-pulse h-6 w-48 bg-black/5 rounded mb-8" />
          <div className="animate-pulse h-10 w-48 bg-black/5 rounded mb-8" />
        </div>
      </main>
    );
  }

  // Get full product objects for the wishlisted items
  const wishlistedProducts = wishlistItems
    .map(id => mockProducts.find(p => p.id === id))
    .filter((p): p is NonNullable<typeof p> => p !== undefined);

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 py-8">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground">
            My Wishlist
          </h1>
          
          {wishlistedProducts.length > 0 && (
            <button 
              onClick={clearWishlist}
              className="text-sm font-medium text-muted hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Clear Wishlist
            </button>
          )}
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface rounded-3xl border border-black/5">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <Heart className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-heading mb-3">Your wishlist is empty</h2>
            <p className="text-muted mb-8 max-w-md">
              Save your favorite items here to easily find them later.
            </p>
            <Link 
              href="/products"
              className="inline-flex items-center gap-2 bg-foreground text-background font-bold px-8 py-4 rounded-xl hover:bg-foreground/90 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary hover:scale-[1.02] active:scale-[0.98]"
            >
              Continue Shopping
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {wishlistedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
