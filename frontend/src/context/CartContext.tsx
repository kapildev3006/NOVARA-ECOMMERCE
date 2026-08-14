"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { CartItem } from "@/types/cart";
import { mockProducts } from "@/data/products";

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  isHydrated: boolean;
  addToCart: (productId: string, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isInCart: (productId: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_KEY = "novara-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) {
        const parsed: CartItem[] = JSON.parse(stored);
        
        // Filter out items that no longer exist in mockProducts and apply stock limits
        const validItems = parsed.reduce((acc: CartItem[], item) => {
          const product = mockProducts.find(p => p.id === item.productId);
          if (product && product.stock > 0) {
            acc.push({
              ...item,
              quantity: Math.min(Math.max(1, item.quantity), product.stock)
            });
          }
          return acc;
        }, []);

        // eslint-disable-next-line react-hooks/set-state-in-effect
        setCartItems(validItems);
      }
    } catch (e) {
      console.error("Failed to parse cart data", e);
    }
    setIsHydrated(true);
  }, []);

  // Sync to localStorage
  useEffect(() => {
    if (isHydrated) {
      localStorage.setItem(CART_KEY, JSON.stringify(cartItems));
    }
  }, [cartItems, isHydrated]);

  const addToCart = useCallback((productId: string, quantity = 1) => {
    const product = mockProducts.find(p => p.id === productId);
    if (!product || product.stock === 0) return;

    setCartItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        const newQuantity = Math.min(existing.quantity + quantity, product.stock);
        return prev.map(item => 
          item.productId === productId ? { ...item, quantity: newQuantity } : item
        );
      }
      return [...prev, { productId, quantity: Math.min(quantity, product.stock) }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => prev.filter(item => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    const product = mockProducts.find(p => p.id === productId);
    if (!product) return;

    const safeQuantity = Math.min(Math.max(1, quantity), product.stock);
    setCartItems(prev => prev.map(item => 
      item.productId === productId ? { ...item, quantity: safeQuantity } : item
    ));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const isInCart = useCallback((productId: string) => {
    return cartItems.some(item => item.productId === productId);
  }, [cartItems]);

  const cartCount = useMemo(() => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  }, [cartItems]);

  const subtotal = useMemo(() => {
    return cartItems.reduce((total, item) => {
      const product = mockProducts.find(p => p.id === item.productId);
      return total + (product ? product.price * item.quantity : 0);
    }, 0);
  }, [cartItems]);

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      subtotal,
      isHydrated,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      isInCart
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
