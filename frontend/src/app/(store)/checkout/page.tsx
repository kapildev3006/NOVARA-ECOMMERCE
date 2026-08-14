"use client";

import { useCart } from "@/context/CartContext";
import { useCheckout } from "@/context/CheckoutContext";
import { mockProducts } from "@/data/products";
import { calculateCartTotals } from "@/lib/cart-utils";
import { generateOrderId, saveOrder } from "@/lib/order-utils";
import { Order, OrderItem } from "@/types/order";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { AddressSection } from "@/components/checkout/AddressSection";
import { DeliveryMethodSection } from "@/components/checkout/DeliveryMethod";
import { PaymentMethodSection } from "@/components/checkout/PaymentMethod";
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary";
import { Breadcrumb } from "@/components/marketplace/Breadcrumb";
import { ShieldAlert, Loader2 } from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { cartItems, isHydrated, clearCart } = useCart();
  const { selectedAddress, selectedDeliveryMethod, selectedPaymentMethod } = useCheckout();
  
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cart Validation - Reacts to cart changes dynamically
  useEffect(() => {
    if (isHydrated && cartItems.length === 0) {
      router.replace("/cart");
    }
  }, [isHydrated, cartItems.length, router]);

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Cart", href: "/cart" },
    { label: "Checkout" }
  ];

  if (!isHydrated || cartItems.length === 0) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 py-8">
          <div className="animate-pulse h-10 w-48 bg-black/5 rounded mb-8" />
          <div className="animate-pulse h-[400px] w-full bg-black/5 rounded-2xl" />
        </div>
      </main>
    );
  }

  const isReadyToPlace = selectedAddress && selectedDeliveryMethod && selectedPaymentMethod;

  const handlePlaceOrder = () => {
    if (isPlacingOrder) return;
    if (!isReadyToPlace) return;

    setError(null);
    setIsPlacingOrder(true);

    // Final Validation
    const invalidItems = cartItems.filter(item => {
      const product = mockProducts.find(p => p.id === item.productId);
      if (!product) return true;
      if (product.stock <= 0) return true;
      if (item.quantity > product.stock) return true;
      return false;
    });

    if (invalidItems.length > 0) {
      setError("Some items in your cart are no longer available or exceed current stock. Please review your cart.");
      setIsPlacingOrder(false);
      return;
    }

    // Simulate network delay for realistic prototype feel
    setTimeout(() => {
      const { subtotal, discount, subtotalAfterDiscount } = calculateCartTotals(cartItems, mockProducts);
      const deliveryFee = selectedDeliveryMethod.price;
      const total = subtotalAfterDiscount + deliveryFee;

      const orderItems: OrderItem[] = cartItems.map(item => {
        const product = mockProducts.find(p => p.id === item.productId)!;
        return {
          productId: product.id,
          quantity: item.quantity,
          price: product.price
        };
      });

      const order: Order = {
        id: generateOrderId(),
        createdAt: new Date().toISOString(),
        items: orderItems,
        address: selectedAddress,
        deliveryMethod: selectedDeliveryMethod,
        paymentMethod: selectedPaymentMethod,
        subtotal,
        discount,
        deliveryFee,
        total,
        status: "Placed"
      };

      saveOrder(order);
      clearCart();
      router.replace(`/order-success?orderId=${order.id}`);
    }, 1200);
  };

  return (
    <main className="min-h-screen bg-background pb-20">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 py-8">
        <Breadcrumb items={breadcrumbItems} className="mb-6" />
        
        <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-8">
          Checkout
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex gap-3 mb-8 items-start">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Attention Required</p>
              <p className="text-sm">{error}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left Column */}
          <div className="w-full lg:w-[65%] flex flex-col min-w-0">
            <AddressSection />
            <DeliveryMethodSection />
            <PaymentMethodSection />
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-[35%] flex flex-col gap-6">
            <CheckoutSummary />

            <button
              onClick={handlePlaceOrder}
              disabled={!isReadyToPlace || isPlacingOrder}
              className="w-full h-14 bg-foreground hover:bg-black/90 text-background font-bold rounded-xl shadow-md hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-foreground disabled:hover:shadow-md"
            >
              {isPlacingOrder ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Placing Order...
                </>
              ) : (
                "Place Order"
              )}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
