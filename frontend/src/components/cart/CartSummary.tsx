"use client";

import { useCart } from "@/context/CartContext";
import { mockProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { calculateCartTotals } from "@/lib/cart-utils";
import { useRouter } from "next/navigation";

export function CartSummary() {
  const { cartItems } = useCart();
  const router = useRouter();

  const { subtotal, discount, subtotalAfterDiscount } = calculateCartTotals(cartItems, mockProducts);

  const delivery = subtotalAfterDiscount > 999 ? 0 : 99;
  const total = subtotalAfterDiscount + delivery;

  if (cartItems.length === 0) return null;

  return (
    <div className="bg-surface rounded-2xl border border-black/5 p-6 sticky top-[120px]">
      <h2 className="font-heading font-bold text-lg mb-6">Order Summary</h2>

      <div className="flex flex-col gap-4 text-sm mb-6 border-b border-black/5 pb-6">
        <div className="flex justify-between">
          <span className="text-muted">Subtotal</span>
          <span className="font-medium text-foreground">{formatPrice(subtotal)}</span>
        </div>
        
        {discount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Discount</span>
            <span className="font-medium">-{formatPrice(discount)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span className="text-muted">Delivery</span>
          <span className="font-medium text-foreground">
            {delivery === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatPrice(delivery)
            )}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mb-8">
        <span className="font-bold text-foreground">Total</span>
        <span className="font-bold text-xl text-foreground">{formatPrice(total)}</span>
      </div>

      <button 
        onClick={() => router.push("/checkout")}
        className="w-full h-14 bg-primary hover:bg-[#e04f2f] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary mb-4 flex items-center justify-center gap-2"
      >
        Proceed to Checkout
        <ArrowRight className="w-5 h-5" />
      </button>

      <div className="flex items-center justify-center gap-2 text-xs text-muted">
        <ShieldCheck className="w-4 h-4" />
        <span>Secure checkout</span>
      </div>
    </div>
  );
}
