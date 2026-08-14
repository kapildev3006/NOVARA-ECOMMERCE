"use client";

import { useCheckout } from "@/context/CheckoutContext";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Truck, Zap, Check } from "lucide-react";

const DELIVERY_OPTIONS = [
  {
    id: "standard",
    name: "Standard Delivery",
    price: 0,
    estimatedDays: "5–7 business days",
    icon: Truck,
  },
  {
    id: "express",
    name: "Express Delivery",
    price: 99,
    estimatedDays: "2–3 business days",
    icon: Zap,
  }
];

export function DeliveryMethodSection() {
  const { selectedDeliveryMethod, setSelectedDeliveryMethod } = useCheckout();

  return (
    <div className="bg-surface rounded-2xl border border-black/5 p-6 mb-8">
      <h2 className="font-heading font-bold text-xl mb-6">Delivery Method</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DELIVERY_OPTIONS.map((method) => {
          const isSelected = selectedDeliveryMethod?.id === method.id;
          const Icon = method.icon;

          return (
            <div
              key={method.id}
              onClick={() => setSelectedDeliveryMethod(method)}
              className={cn(
                "relative border rounded-xl p-5 cursor-pointer transition-all hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex gap-4 items-start",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-black/10 bg-white"
              )}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedDeliveryMethod(method);
                }
              }}
            >
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                isSelected ? "bg-primary text-white" : "bg-black/5 text-muted"
              )}>
                <Icon className="w-5 h-5" />
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <h3 className="font-bold text-foreground">{method.name}</h3>
                  {isSelected && <Check className="w-4 h-4 text-primary" />}
                </div>
                <p className="text-sm text-muted mb-2">{method.estimatedDays}</p>
                <p className="text-sm font-semibold text-foreground">
                  {method.price === 0 ? <span className="text-green-600">FREE</span> : formatPrice(method.price)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
