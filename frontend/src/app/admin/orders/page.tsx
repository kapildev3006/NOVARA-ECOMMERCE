"use client";

import { useState, useMemo, useEffect } from "react";
import { Order, OrderStatus } from "@/types/order";
import { getOrders, updateOrderStatus } from "@/lib/order-utils";
import { AdminOrderToolbar } from "@/components/admin/orders/AdminOrderToolbar";
import { AdminOrderTable } from "@/components/admin/orders/AdminOrderTable";
import { ViewOrderModal } from "@/components/admin/orders/ViewOrderModal";
import { UpdateStatusModal } from "@/components/admin/orders/UpdateStatusModal";
import { Check } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function AdminOrdersPage() {
  const [localOrders, setLocalOrders] = useState<Order[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [viewCandidate, setViewCandidate] = useState<Order | null>(null);
  const [updateCandidate, setUpdateCandidate] = useState<Order | null>(null);
  
  // Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of local orders
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalOrders(getOrders());
     
    setIsHydrated(true);
  }, []);

  // Reset to page 1 on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortOption]);

  const filteredAndSortedOrders = useMemo(() => {
    let result = [...localOrders];

    // 1. Search (ID or Customer Name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o => 
        o.id.toLowerCase().includes(q) || 
        o.address.fullName.toLowerCase().includes(q)
      );
    }

    // 2. Status
    if (statusFilter !== "All") {
      result = result.filter(o => o.status === statusFilter);
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "Oldest":
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case "Highest Total":
          return b.total - a.total;
        case "Lowest Total":
          return a.total - b.total;
        case "Newest":
        default:
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return result;
  }, [localOrders, searchQuery, statusFilter, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedOrders.length / ITEMS_PER_PAGE);
  const paginatedOrders = filteredAndSortedOrders.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setSortOption("Newest");
    setCurrentPage(1);
  };

  const handleView = (order: Order) => {
    setViewCandidate(order);
  };

  const handleUpdate = (order: Order) => {
    setUpdateCandidate(order);
  };

  const handleSaveStatus = (orderId: string, newStatus: OrderStatus) => {
    // Update local storage
    updateOrderStatus(orderId, newStatus);
    
    // Update local state immediately
    setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    setUpdateCandidate(null);

    // Show temporary feedback
    setSuccessMessage(`Order ${orderId} status updated to ${newStatus}.`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  if (!isHydrated) return null;

  return (
    <div className="flex flex-col gap-6 pt-4 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
            Orders
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Manage customer orders and fulfillments.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <AdminOrderToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      {/* Table */}
      <AdminOrderTable
        orders={paginatedOrders}
        onView={handleView}
        onUpdate={handleUpdate}
        onClearFilters={handleClearFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {/* Modals */}
      <ViewOrderModal
        order={viewCandidate}
        onClose={() => setViewCandidate(null)}
      />

      <UpdateStatusModal
        order={updateCandidate}
        onClose={() => setUpdateCandidate(null)}
        onSave={handleSaveStatus}
      />

      {/* Temporary Success Feedback */}
      {successMessage && (
        <div className="fixed bottom-6 right-6 z-[200] bg-gray-900 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-5">
          <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-white" strokeWidth={3} />
          </div>
          <p className="font-medium text-sm">{successMessage}</p>
        </div>
      )}

    </div>
  );
}
