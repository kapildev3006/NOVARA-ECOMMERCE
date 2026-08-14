"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { Address } from "@/types/address";
import { DeliveryMethod } from "@/types/order";

interface CheckoutContextType {
  selectedAddress: Address | null;
  setSelectedAddress: (address: Address | null) => void;
  selectedDeliveryMethod: DeliveryMethod | null;
  setSelectedDeliveryMethod: (method: DeliveryMethod | null) => void;
  selectedPaymentMethod: string | null;
  setSelectedPaymentMethod: (method: string | null) => void;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(undefined);

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedDeliveryMethod, setSelectedDeliveryMethod] = useState<DeliveryMethod | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);

  return (
    <CheckoutContext.Provider
      value={{
        selectedAddress,
        setSelectedAddress,
        selectedDeliveryMethod,
        setSelectedDeliveryMethod,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error("useCheckout must be used within a CheckoutProvider");
  }
  return context;
}
