"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getOrderById } from "@/lib/order-utils";
import { Order } from "@/types/order";
import { formatPrice } from "@/lib/utils";
import { CheckCircle2, Package, ShieldAlert } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { mockProducts } from "@/data/products";

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (orderId) {
      const foundOrder = getOrderById(orderId);
      if (foundOrder) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setOrder(foundOrder);
      }
    }
     
    setIsLoading(false);
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="animate-pulse h-12 w-48 bg-black/5 rounded mb-4" />
        <div className="animate-pulse h-6 w-32 bg-black/5 rounded" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <ShieldAlert className="w-16 h-16 text-red-500 mb-6" />
        <h1 className="font-heading font-bold text-3xl mb-4 text-foreground">Order Not Found</h1>
        <p className="text-muted max-w-md mb-8">
          We couldn&apos;t find the order you&apos;re looking for. It may have been expired from local storage or the ID is incorrect.
        </p>
        <button
          onClick={() => router.push("/")}
          className="bg-foreground text-background font-bold py-3 px-8 rounded-xl hover:bg-black/80 transition-colors"
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto py-12 md:py-20 px-4">
      <div className="flex flex-col items-center text-center mb-12">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle2 className="w-10 h-10 text-green-600" />
        </div>
        <h1 className="font-heading font-bold text-3xl md:text-5xl text-foreground mb-4">
          Order placed successfully!
        </h1>
        <p className="text-lg text-muted">
          Thank you for shopping with NOVARA.
        </p>
      </div>

      <div className="bg-surface border border-black/5 rounded-3xl p-6 md:p-10 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 border-b border-black/5 pb-8">
          <div>
            <p className="text-sm text-muted mb-1">Order ID</p>
            <p className="font-bold text-lg text-foreground">{order.id}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Estimated Delivery</p>
            <p className="font-bold text-lg text-foreground">{order.deliveryMethod.estimatedDays}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Total</p>
            <p className="font-bold text-lg text-foreground">{formatPrice(order.total)}</p>
          </div>
          <div>
            <p className="text-sm text-muted mb-1">Payment Method</p>
            <p className="font-bold text-lg text-foreground uppercase">{order.paymentMethod}</p>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-xl mb-6">Order Items</h2>
          <div className="flex flex-col gap-6">
            {order.items.map((item, idx) => {
              const product = mockProducts.find(p => p.id === item.productId);
              if (!product) return null;
              
              return (
                <div key={`${item.productId}-${idx}`} className="flex gap-4">
                  <div className="relative w-20 h-20 bg-white rounded-xl border border-black/5 shrink-0 overflow-hidden">
                    <Image 
                      src={product.image}
                      alt={product.name}
                      fill
                      className="object-contain p-2 mix-blend-multiply"
                      sizes="80px"
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <h4 className="font-bold text-foreground truncate">{product.name}</h4>
                    <p className="text-sm text-muted mt-1">
                      Qty: {item.quantity} × {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4">
        <Link href="/products" className="bg-foreground text-background font-bold py-4 px-8 rounded-xl hover:bg-black/90 transition-colors text-center shadow-lg hover:shadow-xl">
          Continue Shopping
        </Link>
        <button disabled className="bg-white border border-black/10 text-muted font-bold py-4 px-8 rounded-xl opacity-50 cursor-not-allowed text-center flex items-center justify-center gap-2">
          <Package className="w-5 h-5" />
          View Orders
        </button>
      </div>
    </div>
  );
}

import { Suspense } from "react";

export default function OrderSuccessPage() {
  return (
    <main className="min-h-screen bg-background">
      <Suspense fallback={
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4" />
          <p className="text-muted">Loading order details...</p>
        </div>
      }>
        <OrderSuccessContent />
      </Suspense>
    </main>
  );
}
