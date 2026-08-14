"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { mockProducts } from "@/data/products";

interface WishlistContextType {
  wishlistItems: string[];
  wishlistCount: number;
  isHydrated: boolean;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  toggleWishlist: (productId: string) => void;
  clearWishlist: () => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

const WISHLIST_KEY = "novara-wishlist";

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlistItems, setWishlistItems] = useState<string[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WISHLIST_KEY);
      if (stored) {
        const parsed: string[] = JSON.parse(stored);
        
        // Filter out items that no longer exist in mockProducts
        const validItems = parsed.filter(id => mockProducts.some(p => p.id === id));
        
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setWishlistItems(validItems);
      }
    } catch (e) {
      console.error("Failed to parse wishlist data", e);
    }
    setIsHydrated(true);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlistItems));
    }
  }, [wishlistItems, isHydrated]);

  const addToWishlist = useCallback((productId: string) => {
    setWishlistItems(prev => {
      if (prev.includes(productId)) return prev;
      return [...prev, productId];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: string) => {
    setWishlistItems(prev => prev.filter(id => id !== productId));
  }, []);

  const toggleWishlist = useCallback((productId: string) => {
    setWishlistItems(prev => {
      if (prev.includes(productId)) {
        return prev.filter(id => id !== productId);
      }
      return [...prev, productId];
    });
  }, []);

  const clearWishlist = useCallback(() => {
    setWishlistItems([]);
  }, []);

  const isWishlisted = useCallback((productId: string) => {
    return wishlistItems.includes(productId);
  }, [wishlistItems]);

  const wishlistCount = wishlistItems.length;

  return (
    <WishlistContext.Provider value={{
      wishlistItems,
      wishlistCount,
      isHydrated,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      clearWishlist,
      isWishlisted
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
