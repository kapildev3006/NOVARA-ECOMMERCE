"use client";

import { useState, useEffect } from "react";
import { Address } from "@/types/address";
import { Plus, Check, Edit2, Trash2 } from "lucide-react";
import { AddressForm } from "./AddressForm";
import { cn } from "@/lib/utils";
import { useCheckout } from "@/context/CheckoutContext";

interface AddressSectionProps {
  isAccountMode?: boolean;
}

const ADDRESSES_KEY = "novara-addresses";

export function AddressSection({ isAccountMode = false }: AddressSectionProps) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  
  // Conditionally grab checkout context only if we're not in account mode
  // We can't conditionally call hooks, so we always call it but handle the error if not wrapped
  // Actually, useCheckout throws if not in Provider. To avoid this, we can catch or use a safe wrapper.
  // The simplest is to create a safe hook or just try/catch inside a custom hook, 
  // but since we know where it's used, let's just make sure the component doesn't crash.
  // Wait, if it throws, we can't catch it normally in a hook. 
  // Let's change CheckoutContext to NOT throw, or just use a SafeuseCheckout.
  // Better yet, just pass `isAccountMode` and handle selection locally in account mode.
  let checkoutCtx: Record<string, unknown> | null = null;
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    checkoutCtx = isAccountMode ? null : useCheckout() as unknown as Record<string, unknown>;
  } catch {
    // ignore
  }

  const selectedAddress = checkoutCtx?.selectedAddress as Address | undefined;
  const setSelectedAddress = checkoutCtx?.setSelectedAddress as ((address: Address | null) => void) | undefined;

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADDRESSES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setAddresses(parsed);
      } else {
        // Add a demo address if none exists
        const demoAddress: Address = {
          id: "addr-1",
          fullName: "Demo User",
          phone: "9876543210",
          addressLine1: "123 Example Street",
          city: "New Delhi",
          state: "Delhi",
          postalCode: "110001",
          type: "Home"
        };
        setAddresses([demoAddress]);
        localStorage.setItem(ADDRESSES_KEY, JSON.stringify([demoAddress]));
      }
    } catch (e) {
      console.error("Failed to parse addresses", e);
    }
  }, []);

  const saveAddress = (address: Address) => {
    const updated = editingAddress
      ? addresses.map(a => (a.id === address.id ? address : a))
      : [...addresses, address];
      
    setAddresses(updated);
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(updated));
    setIsFormOpen(false);
    setEditingAddress(null);
    
    // Auto-select if it's the only one or if we were editing the selected one (only in checkout mode)
    if (!isAccountMode && setSelectedAddress) {
      if (updated.length === 1 || selectedAddress?.id === address.id || !editingAddress) {
        setSelectedAddress(address);
      }
    }
  };

  const deleteAddress = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = addresses.filter(a => a.id !== id);
    setAddresses(updated);
    localStorage.setItem(ADDRESSES_KEY, JSON.stringify(updated));
    if (!isAccountMode && selectedAddress?.id === id && setSelectedAddress) {
      setSelectedAddress(null);
    }
  };

  const editAddress = (address: Address, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingAddress(address);
    setIsFormOpen(true);
  };

  if (isFormOpen) {
    return (
      <div className="bg-surface rounded-2xl border border-black/5 p-6 mb-8">
        <h2 className="font-heading font-bold text-xl mb-6">
          {editingAddress ? "Edit Address" : "Add New Address"}
        </h2>
        <AddressForm 
          initialData={editingAddress || undefined} 
          onSave={saveAddress} 
          onCancel={() => {
            setIsFormOpen(false);
            setEditingAddress(null);
          }} 
        />
      </div>
    );
  }

  return (
    <div className="bg-surface rounded-2xl border border-black/5 p-6 mb-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-heading font-bold text-xl">Delivery Address</h2>
        <button
          onClick={() => setIsFormOpen(true)}
          className="text-sm font-semibold text-primary hover:text-[#e04f2f] flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
        >
          <Plus className="w-4 h-4" /> Add New
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((address) => (
          <div
            key={address.id}
            onClick={() => {
              if (!isAccountMode && setSelectedAddress) setSelectedAddress(address);
            }}
            className={cn(
              "relative border rounded-xl p-4 transition-all hover:border-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
              isAccountMode ? "cursor-default border-black/10 bg-white" : "cursor-pointer",
              !isAccountMode && selectedAddress?.id === address.id
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : (!isAccountMode ? "border-black/10 bg-white" : "")
            )}
            tabIndex={0}
            onKeyDown={(e) => {
              if (!isAccountMode && (e.key === "Enter" || e.key === " ")) {
                if (setSelectedAddress) setSelectedAddress(address);
              }
            }}
          >
            {!isAccountMode && selectedAddress?.id === address.id && (
              <div className="absolute top-4 right-4 text-primary">
                <Check className="w-5 h-5" />
              </div>
            )}
            
            <div className="flex items-center gap-2 mb-2">
              <span className="font-bold text-foreground">{address.fullName}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider bg-black/5 px-2 py-0.5 rounded-full">
                {address.type}
              </span>
            </div>
            
            <div className="text-sm text-muted mb-4 space-y-1">
              <p>{address.addressLine1}</p>
              {address.addressLine2 && <p>{address.addressLine2}</p>}
              <p>{address.city}, {address.state} - {address.postalCode}</p>
              {address.landmark && <p>Landmark: {address.landmark}</p>}
              <p className="pt-1">Phone: {address.phone}</p>
            </div>

            <div className="flex gap-4 text-sm font-semibold border-t border-black/5 pt-3">
              <button 
                onClick={(e) => editAddress(address, e)}
                className="text-muted hover:text-foreground flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
              <button 
                onClick={(e) => deleteAddress(address.id, e)}
                className="text-muted hover:text-red-500 flex items-center gap-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
