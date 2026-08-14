"use client";

import { useCheckout } from "@/context/CheckoutContext";
import { cn } from "@/lib/utils";
import { CreditCard, Smartphone, Banknote, AlertCircle, Check } from "lucide-react";

const PAYMENT_OPTIONS = [
  {
    id: "upi",
    name: "UPI / QR",
    description: "Pay via Google Pay, PhonePe, Paytm, etc.",
    icon: Smartphone,
  },
  {
    id: "card",
    name: "Credit / Debit Card",
    description: "Visa, MasterCard, RuPay, etc.",
    icon: CreditCard,
  },
  {
    id: "cod",
    name: "Cash on Delivery",
    description: "Pay when you receive the order",
    icon: Banknote,
  }
];

export function PaymentMethodSection() {
  const { selectedPaymentMethod, setSelectedPaymentMethod } = useCheckout();

  return (
    <div className="bg-surface rounded-2xl border border-black/5 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-bold text-xl">Payment Method</h2>
      </div>

      <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-4 mb-6 flex gap-3 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0 text-blue-600" />
        <div>
          <p className="font-bold mb-1">Demo Payment Gateway</p>
          <p>No real transactions will be processed. Do not enter any real payment credentials or OTPs.</p>
        </div>
      </div>
      
      <div className="flex flex-col gap-4">
        {PAYMENT_OPTIONS.map((method) => {
          const isSelected = selectedPaymentMethod === method.id;
          const Icon = method.icon;

          return (
            <div
              key={method.id}
              onClick={() => setSelectedPaymentMethod(method.id)}
              className={cn(
                "relative border rounded-xl p-5 cursor-pointer transition-all hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary flex flex-col sm:flex-row sm:items-center gap-4",
                isSelected
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-black/10 bg-white"
              )}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  setSelectedPaymentMethod(method.id);
                }
              }}
            >
              <div className="flex items-center gap-4 flex-1">
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  isSelected ? "bg-primary text-white" : "bg-black/5 text-muted"
                )}>
                  <Icon className="w-5 h-5" />
                </div>
                
                <div>
                  <h3 className="font-bold text-foreground">{method.name}</h3>
                  <p className="text-sm text-muted">{method.description}</p>
                </div>
              </div>
              
              {isSelected && (
                <div className="mt-4 sm:mt-0 sm:ml-auto">
                  {method.id === "card" && (
                    <div className="text-sm font-semibold bg-white px-3 py-2 border border-black/10 rounded-lg flex items-center gap-2">
                      <span>Card ending in •••• 4242</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Demo</span>
                    </div>
                  )}
                  {method.id === "upi" && (
                    <div className="text-sm font-semibold bg-white px-3 py-2 border border-black/10 rounded-lg flex items-center gap-2">
                      <span>demo@upi</span>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Demo</span>
                    </div>
                  )}
                  {method.id === "cod" && (
                    <div className="text-primary flex items-center gap-1 font-bold text-sm">
                      <Check className="w-4 h-4" /> Selected
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
