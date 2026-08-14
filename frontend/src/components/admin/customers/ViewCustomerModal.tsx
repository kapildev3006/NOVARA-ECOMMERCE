"use client";

import { X, MapPin, Package, Clock, CreditCard } from "lucide-react";
import { AdminCustomer } from "@/types/customer";
import { formatPrice } from "@/lib/utils";

interface ViewCustomerModalProps {
  customer: AdminCustomer | null;
  onClose: () => void;
}

export function ViewCustomerModal({ customer, onClose }: ViewCustomerModalProps) {
  if (!customer) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").toUpperCase().substring(0, 2);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] max-w-3xl w-full relative my-8 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="shrink-0 flex items-start justify-between p-6 border-b border-[#e5e5e5]">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xl shrink-0">
              {getInitials(customer.name)}
            </div>
            <div>
              <h3 className="font-heading font-bold text-xl text-[#161513] mb-1 flex items-center gap-2">
                {customer.name}
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${customer.status === "Active" ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {customer.status}
                </span>
              </h3>
              <p className="text-gray-500 text-sm">
                {customer.email || "Email not available"} &bull; {customer.phone}
              </p>
            </div>
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
          
          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#FAFAF8] rounded-xl p-4 border border-[#e5e5e5]">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Total Spent</span>
              <p className="text-xl font-bold text-[#161513] mt-1">{formatPrice(customer.totalSpent)}</p>
            </div>
            <div className="bg-[#FAFAF8] rounded-xl p-4 border border-[#e5e5e5]">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Orders</span>
              <p className="text-xl font-bold text-[#161513] mt-1">{customer.ordersCount}</p>
            </div>
            <div className="bg-[#FAFAF8] rounded-xl p-4 border border-[#e5e5e5] col-span-2">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Last Order</span>
              <p className="text-xl font-bold text-[#161513] mt-1">{formatDate(customer.lastOrderDate)}</p>
            </div>
          </div>

          {/* Addresses */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#161513] font-bold pb-2 border-b border-[#e5e5e5]">
              <MapPin className="w-4 h-4 text-[#ff4b2b]" />
              Saved Addresses
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {customer.addresses.map((address, idx) => (
                <div key={idx} className="p-4 rounded-xl border border-[#e5e5e5] text-sm text-gray-600">
                  <div className="font-bold text-[#161513] flex justify-between items-start mb-1">
                    {address.fullName}
                    <span className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                      {address.type}
                    </span>
                  </div>
                  <p>{address.addressLine1} {address.addressLine2 || ""}</p>
                  <p>{address.city}, {address.state} {address.postalCode}</p>
                  <p className="mt-1 font-medium">{address.phone}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Orders List */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-[#161513] font-bold pb-2 border-b border-[#e5e5e5]">
              <Package className="w-4 h-4 text-[#ff4b2b]" />
              Order History
            </div>
            <div className="space-y-3">
              {customer.orders.slice(0, 5).map((order) => (
                <div key={order.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#161513] text-sm">{order.id}</span>
                      <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 flex items-center gap-3">
                      <span className="flex items-center gap-1"><CreditCard className="w-3 h-3" /> {order.paymentMethod === "cod" ? "COD" : "Prepaid"}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {order.items.length} items</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 justify-between sm:justify-end">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      order.status === "Delivered" ? "bg-green-100 text-green-700" :
                      order.status === "Cancelled" ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                    }`}>
                      {order.status}
                    </span>
                    <span className="font-bold text-[#161513]">
                      {formatPrice(order.total)}
                    </span>
                  </div>
                </div>
              ))}
              {customer.orders.length > 5 && (
                <p className="text-center text-sm text-gray-500 pt-2 font-medium">
                  + {customer.orders.length - 5} older orders not shown
                </p>
              )}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="shrink-0 p-6 border-t border-[#e5e5e5] flex justify-end">
          <button
            onClick={onClose}
            className="bg-[#161513] text-white font-bold py-2.5 px-6 rounded-xl hover:bg-black/80 transition-colors focus-visible:outline-none"
          >
            Close Profile
          </button>
        </div>

      </div>
    </div>
  );
}
