"use client";

import { useState, useEffect } from "react";
import { X, RefreshCw } from "lucide-react";
import { Order, OrderStatus } from "@/types/order";

interface UpdateStatusModalProps {
  order: Order | null;
  onClose: () => void;
  onSave: (orderId: string, newStatus: OrderStatus) => void;
}

export function UpdateStatusModal({ order, onClose, onSave }: UpdateStatusModalProps) {
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus>("Placed");

  useEffect(() => {
    if (order) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedStatus(order.status);
    }
  }, [order]);

  if (!order) return null;

  const getAvailableStatuses = (current: OrderStatus): OrderStatus[] => {
    if (current === "Delivered" || current === "Cancelled") {
      return [current]; // No changes allowed
    }
    
    const possible: OrderStatus[] = [current]; // Can always stay the same

    switch (current) {
      case "Placed":
        possible.push("Processing", "Cancelled");
        break;
      case "Processing":
        possible.push("Shipped", "Cancelled");
        break;
      case "Shipped":
        possible.push("Delivered", "Cancelled");
        break;
    }

    return possible;
  };

  const availableStatuses = getAvailableStatuses(order.status);
  const isTerminal = order.status === "Delivered" || order.status === "Cancelled";

  const handleSave = () => {
    if (selectedStatus !== order.status) {
      onSave(order.id, selectedStatus);
    } else {
      onClose(); // No change
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-sm w-full flex flex-col relative text-center">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black focus-visible:outline-none"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-500">
          <RefreshCw className="w-8 h-8" />
        </div>
        
        <h3 className="font-heading font-bold text-xl text-[#161513] mb-2">
          Update Order Status
        </h3>
        <p className="text-gray-500 text-sm mb-6">
          Change the status for order <strong>{order.id}</strong>.
        </p>

        {isTerminal ? (
          <div className="bg-gray-50 border border-[#e5e5e5] rounded-xl p-4 text-sm font-medium text-gray-600 mb-6 text-left">
            This order is currently <strong>{order.status}</strong>. Terminal statuses cannot be changed further.
          </div>
        ) : (
          <div className="mb-6 text-left">
            <label className="block text-sm font-bold text-[#161513] mb-2">
              New Status
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as OrderStatus)}
                className="w-full h-12 px-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer"
                style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 1rem center', backgroundRepeat: 'no-repeat' }}
              >
                {availableStatuses.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            className="flex-1 bg-white border border-[#e5e5e5] text-gray-700 font-bold py-2.5 rounded-xl hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          {!isTerminal && (
            <button
              onClick={handleSave}
              className="flex-1 bg-[#ff4b2b] text-white font-bold py-2.5 rounded-xl hover:bg-[#ff3b1a] transition-colors"
            >
              Update
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
