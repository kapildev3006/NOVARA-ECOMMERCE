"use client";

import { X, AlertTriangle } from "lucide-react";
import { AdminCustomer } from "@/types/customer";

interface ToggleCustomerStatusModalProps {
  customer: AdminCustomer | null;
  onClose: () => void;
  onToggle: (customer: AdminCustomer) => void;
}

export function ToggleCustomerStatusModal({ customer, onClose, onToggle }: ToggleCustomerStatusModalProps) {
  if (!customer) return null;

  const isActive = customer.status === "Active";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-sm w-full flex flex-col relative text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isActive ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
          <AlertTriangle className="w-8 h-8" />
        </div>
        
        <h3 className="font-heading font-bold text-xl text-[#161513] mb-2">
          {isActive ? "Deactivate Customer?" : "Activate Customer?"}
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Are you sure you want to {isActive ? "deactivate" : "activate"} <strong>{customer.name}</strong>? {isActive ? "They will be marked as inactive in your system." : "They will be restored to active status."}
        </p>

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-[#e5e5e5] text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onToggle(customer)}
            className={`flex-1 text-white font-bold py-2.5 rounded-xl transition-colors ${
              isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
