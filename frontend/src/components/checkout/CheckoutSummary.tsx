"use client";

import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { mockProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import { calculateCartTotals } from "@/lib/cart-utils";
import Image from "next/image";

export function CheckoutSummary() {
  const { cartItems } = useCart();
  const { selectedDeliveryMethod } = useCheckout();

  const { subtotal, discount, subtotalAfterDiscount } = calculateCartTotals(cartItems, mockProducts);

  const deliveryFee = selectedDeliveryMethod ? selectedDeliveryMethod.price : (subtotalAfterDiscount > 999 ? 0 : 99);
  const total = subtotalAfterDiscount + deliveryFee;

  if (cartItems.length === 0) return null;

  return (
    <div className="bg-surface rounded-2xl border border-black/5 p-6 sticky top-[120px]">
      <h2 className="font-heading font-bold text-lg mb-6">Order Summary</h2>

      <div className="flex flex-col gap-4 mb-6 max-h-[300px] overflow-y-auto pr-2 scrollbar-hide">
        {cartItems.map((item) => {
          const product = mockProducts.find(p => p.id === item.productId);
          if (!product) return null;
          
          return (
            <div key={item.productId} className="flex gap-4">
              <div className="relative w-16 h-16 bg-white rounded-lg border border-black/5 shrink-0 overflow-hidden">
                <Image 
                  src={product.image}
                  alt={product.name}
                  fill
                  className="object-contain p-1 mix-blend-multiply"
                  sizes="64px"
                />
                <span className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-5 h-5 text-[10px] font-bold text-white bg-foreground rounded-full">
                  {item.quantity}
                </span>
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h4 className="font-bold text-sm text-foreground truncate">{product.name}</h4>
                <p className="text-xs text-muted mt-0.5">{formatPrice(product.price)}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-4 text-sm mb-6 border-b border-t border-black/5 py-6">
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
            {deliveryFee === 0 ? (
              <span className="text-green-600">Free</span>
            ) : (
              formatPrice(deliveryFee)
            )}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="font-bold text-foreground">Total</span>
        <span className="font-bold text-xl text-foreground">{formatPrice(total)}</span>
      </div>
    </div>
  );
}
