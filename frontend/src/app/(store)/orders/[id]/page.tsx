"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getOrderById } from "@/lib/order-utils";
import { Order } from "@/types/order";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { ArrowLeft, Package, RotateCcw, ShieldAlert, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import { mockProducts } from "@/data/products";
import { useCart } from "@/context/CartContext";

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const [reorderError, setReorderError] = useState<string | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  
  const { addToCart } = useCart();

  useEffect(() => {
    const foundOrder = getOrderById(params.id);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setOrder(foundOrder || null);
     
    setIsHydrated(true);
  }, [params.id]);

  const handleBuyAgain = () => {
    if (!order || isReordering) return;
    setIsReordering(true);
    setReorderError(null);

    let itemsAdded = 0;
    let itemsSkipped = 0;

    order.items.forEach(orderItem => {
      const currentProduct = mockProducts.find(p => p.id === orderItem.productId);
      
      if (!currentProduct || currentProduct.stock <= 0) {
        itemsSkipped++;
        return;
      }

      // Respect current stock bounds
      const quantityToAdd = Math.min(orderItem.quantity, currentProduct.stock);
      
      addToCart(currentProduct.id, quantityToAdd);
      itemsAdded++;
    });

    if (itemsAdded === 0) {
      setReorderError("None of the items in this order are currently available.");
      setIsReordering(false);
    } else {
      if (itemsSkipped > 0) {
        // We can use a brief timeout to show partial success before redirecting, 
        // or we could pass state via URL. For this prototype, we'll alert briefly.
        alert("Some items are no longer available and were not added.");
      }
      router.push("/cart");
    }
  };

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="mx-auto max-w-[800px] px-4 md:px-8">
          <div className="animate-pulse space-y-4">
            <div className="h-10 w-48 bg-black/5 rounded mb-8" />
            <div className="h-64 bg-black/5 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background py-20 px-4">
        <div className="mx-auto max-w-md text-center">
          <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
          <h1 className="font-heading font-bold text-3xl mb-4 text-foreground">Order not found</h1>
          <p className="text-muted mb-8">
            We couldn&apos;t find this order. It may have been expired from local storage.
          </p>
          <Link
            href="/orders"
            className="bg-foreground text-background font-bold py-3 px-8 rounded-xl hover:bg-black/90 transition-colors inline-block"
          >
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 pt-8">
      <div className="mx-auto max-w-[800px] px-4 md:px-8">
        
        <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-foreground transition-colors mb-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm">
          <ArrowLeft className="w-4 h-4" /> Back to Orders
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-heading font-bold text-3xl md:text-4xl text-foreground mb-2">
              Order Details
            </h1>
            <p className="text-muted font-medium">Order #{order.id}</p>
          </div>
          
          <button
            onClick={handleBuyAgain}
            disabled={isReordering}
            className="bg-foreground text-background font-bold py-3 px-6 rounded-xl hover:bg-black/90 transition-colors inline-flex items-center justify-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            {isReordering ? "Adding..." : "Buy Again"}
          </button>
        </div>

        {reorderError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2 text-sm font-semibold mb-6">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            {reorderError}
          </div>
        )}

        <div className="bg-white border border-black/10 rounded-2xl overflow-hidden shadow-sm mb-6">
          <div className="bg-surface p-6 border-b border-black/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <p className="text-sm text-muted mb-1">Order Status</p>
              <div className="flex items-center gap-2 text-green-700 font-bold">
                <CheckCircle2 className="w-5 h-5" />
                {order.status === "Placed" ? "Order Placed" : order.status}
              </div>
            </div>
            <div>
              <p className="text-sm text-muted mb-1">Placed On</p>
              <p className="font-bold text-foreground">
                {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="p-6">
            <h2 className="font-heading font-bold text-lg mb-4">Items Ordered</h2>
            <div className="flex flex-col gap-6 border-b border-black/5 pb-6 mb-6">
              {order.items.map((item, idx) => {
                const product = mockProducts.find(p => p.id === item.productId);
                return (
                  <div key={`${item.productId}-${idx}`} className="flex flex-col sm:flex-row gap-4">
                    <div className="relative w-20 h-20 bg-surface rounded-xl border border-black/5 shrink-0 overflow-hidden">
                      {product ? (
                        <Image 
                          src={product.image}
                          alt={product.name}
                          fill
                          className="object-contain p-2 mix-blend-multiply"
                          sizes="80px"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted">
                          <Package className="w-6 h-6" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                      <h4 className="font-bold text-foreground truncate">
                        {product ? product.name : "Unknown Product"}
                      </h4>
                      <div className="flex items-center gap-4 mt-1">
                        <p className="text-sm text-muted">Qty: {item.quantity}</p>
                        {/* VERY IMPORTANT: Use historical item.price, NOT product.price */}
                        <p className="text-sm font-bold text-foreground">{formatPrice(item.price)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h2 className="font-heading font-bold text-lg mb-4">Delivery Details</h2>
                
                <div className="mb-6">
                  <p className="text-sm font-bold text-foreground mb-1">Address Snapshot</p>
                  <div className="text-sm text-muted bg-surface p-4 rounded-xl border border-black/5">
                    <p className="font-bold text-foreground mb-1">{order.address.fullName}</p>
                    <p>{order.address.addressLine1}</p>
                    {order.address.addressLine2 && <p>{order.address.addressLine2}</p>}
                    <p>{order.address.city}, {order.address.state} - {order.address.postalCode}</p>
                    <p className="pt-1">Phone: {order.address.phone}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-bold text-foreground mb-1">Delivery Method</p>
                  <p className="text-sm text-muted bg-surface p-4 rounded-xl border border-black/5">
                    <span className="font-bold text-foreground">{order.deliveryMethod.name}</span><br />
                    {order.deliveryMethod.estimatedDays}
                  </p>
                </div>
              </div>

              <div>
                <h2 className="font-heading font-bold text-lg mb-4">Payment Summary</h2>
                
                <div className="mb-6">
                  <p className="text-sm font-bold text-foreground mb-1">Payment Method</p>
                  <p className="text-sm text-muted bg-surface p-4 rounded-xl border border-black/5 uppercase font-semibold">
                    {order.paymentMethod === 'cod' ? 'Cash on Delivery' : order.paymentMethod} (Demo)
                  </p>
                </div>

                <div className="bg-surface p-4 rounded-xl border border-black/5 space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted">Subtotal</span>
                    <span className="font-bold text-foreground">{formatPrice(order.subtotal)}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-green-700">
                      <span>Discount</span>
                      <span className="font-bold">-{formatPrice(order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted">Delivery</span>
                    <span className="font-bold text-foreground">
                      {order.deliveryFee === 0 ? <span className="text-green-700">Free</span> : formatPrice(order.deliveryFee)}
                    </span>
                  </div>
                  <div className="pt-3 border-t border-black/10 flex justify-between items-center">
                    <span className="font-bold text-foreground text-base">Total</span>
                    <span className="font-bold text-foreground text-xl">{formatPrice(order.total)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
