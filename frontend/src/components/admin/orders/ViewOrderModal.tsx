"use client";

import { X, Package, MapPin, Truck, CreditCard } from "lucide-react";
import { Order } from "@/types/order";
import { mockProducts } from "@/data/products";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";

interface ViewOrderModalProps {
  order: Order | null;
  onClose: () => void;
}

export function ViewOrderModal({ order, onClose }: ViewOrderModalProps) {
  if (!order) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getProductDetails = (productId: string) => {
    const product = mockProducts.find(p => p.id === productId);
    return {
      name: product?.name || "Unknown Product",
      image: product?.image || "/images/placeholder.png"
    };
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] max-w-2xl w-full relative my-8 max-h-[90vh] flex flex-col">
        
        {/* Header (Sticky) */}
        <div className="shrink-0 flex items-center justify-between p-6 border-b border-[#e5e5e5]">
          <div>
            <h3 className="font-heading font-bold text-xl text-[#161513] mb-1">
              Order Details
            </h3>
            <p className="text-gray-500 text-sm">
              {order.id} &bull; {formatDate(order.createdAt)}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-black focus-visible:outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          
          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#161513] font-bold pb-2 border-b border-[#e5e5e5]">
                <MapPin className="w-4 h-4 text-[#ff4b2b]" />
                Shipping Address
              </div>
              <div className="text-sm text-gray-600">
                <p className="font-bold text-[#161513]">{order.address.fullName}</p>
                <p>{order.address.addressLine1} {order.address.addressLine2 || ""}</p>
                <p>{order.address.city}, {order.address.state} {order.address.postalCode}</p>
                <p>India</p>
                <p className="mt-1 font-medium">{order.address.phone}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-[#161513] font-bold pb-2 border-b border-[#e5e5e5]">
                <Truck className="w-4 h-4 text-[#ff4b2b]" />
                Delivery & Payment
              </div>
              <div className="text-sm text-gray-600 space-y-2">
                <div>
                  <span className="text-gray-400">Method:</span>
                  <p className="font-medium text-[#161513]">{order.deliveryMethod.name}</p>
                </div>
                <div>
                  <span className="text-gray-400">Payment:</span>
                  <p className="font-medium text-[#161513] flex items-center gap-1.5 mt-0.5">
                    <CreditCard className="w-3.5 h-3.5" />
                    {order.paymentMethod === "cod" ? "Cash on Delivery" : "Prepaid (Card/UPI)"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#161513] font-bold pb-2 border-b border-[#e5e5e5]">
              <Package className="w-4 h-4 text-[#ff4b2b]" />
              Items Purchased
            </div>
            
            <div className="space-y-4">
              {order.items.map((item, index) => {
                const details = getProductDetails(item.productId);
                return (
                  <div key={index} className="flex gap-4 p-3 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8]">
                    <div className="relative w-16 h-16 rounded-lg bg-white border border-[#e5e5e5] overflow-hidden shrink-0">
                      <Image 
                        src={details.image} 
                        alt={details.name} 
                        fill 
                        className="object-contain p-1"
                      />
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                      <span className="font-bold text-sm text-[#161513] line-clamp-2">
                        {details.name}
                      </span>
                      <span className="text-xs font-medium text-gray-500 mt-1">
                        Qty: {item.quantity} &times; {formatPrice(item.price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-end font-bold text-sm text-[#161513] pl-2">
                      {formatPrice(item.price * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-[#FAFAF8] rounded-xl p-4 border border-[#e5e5e5] space-y-3 text-sm">
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-green-600 font-medium">
                <span>Discount</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-gray-600 font-medium">
              <span>Delivery Fee</span>
              <span>{formatPrice(order.deliveryFee)}</span>
            </div>
            <div className="pt-3 mt-3 border-t border-[#e5e5e5] flex justify-between items-center">
              <span className="font-bold text-base text-[#161513]">Total</span>
              <span className="font-bold text-lg text-[#ff4b2b]">
                {formatPrice(order.total)}
              </span>
            </div>
          </div>

        </div>

        {/* Footer (Sticky) */}
        <div className="shrink-0 p-6 border-t border-[#e5e5e5] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#161513] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-black/80 transition-colors focus-visible:outline-none"
          >
            Close Details
          </button>
        </div>

      </div>
    </div>
  );
}
