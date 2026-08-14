"use client";

import { useCart } from "@/context/CartContext";
import { CartItem } from "@/components/cart/CartItem";
import { CartSummary } from "@/components/cart/CartSummary";
import { Breadcrumb } from "@/components/marketplace/Breadcrumb";
import Link from "next/link";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function CartPage() {
  const { cartItems, isHydrated, clearCart } = useCart();

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Your Cart" }
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

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 py-8">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />
        
        <div className="flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
          <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground">
            Your Cart
          </h1>
          
          {cartItems.length > 0 && (
            <button 
              onClick={clearCart}
              className="text-sm font-medium text-muted hover:text-red-500 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
            >
              Clear Cart
            </button>
          )}
        </div>

        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center bg-surface rounded-3xl border border-black/5">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-bold font-heading mb-3">Your cart is empty</h2>
            <p className="text-muted mb-8 max-w-md">
              Looks like you haven&apos;t added anything to your cart yet. Discover our latest collections and find something you&apos;ll love.
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
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            <div className="w-full lg:w-[65%] flex flex-col gap-4">
              {cartItems.map((item) => (
                <CartItem 
                  key={item.productId} 
                  productId={item.productId} 
                  quantity={item.quantity} 
                />
              ))}
            </div>
            <div className="w-full lg:w-[35%]">
              <CartSummary />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
