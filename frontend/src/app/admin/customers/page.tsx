"use client";

import { useState, useMemo, useEffect } from "react";
import { AdminCustomer } from "@/types/customer";
import { getDerivedCustomers, updateCustomerStatus } from "@/lib/customer-utils";
import { AdminCustomerToolbar } from "@/components/admin/customers/AdminCustomerToolbar";
import { AdminCustomerTable } from "@/components/admin/customers/AdminCustomerTable";
import { ViewCustomerModal } from "@/components/admin/customers/ViewCustomerModal";
import { ToggleCustomerStatusModal } from "@/components/admin/customers/ToggleCustomerStatusModal";
import { Check } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function AdminCustomersPage() {
  const [localCustomers, setLocalCustomers] = useState<AdminCustomer[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("Name A-Z");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [viewCandidate, setViewCandidate] = useState<AdminCustomer | null>(null);
  const [toggleCandidate, setToggleCandidate] = useState<AdminCustomer | null>(null);
  
  // Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of derived customers
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalCustomers(getDerivedCustomers());
     
    setIsHydrated(true);
  }, []);

  // Reset to page 1 on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortOption]);

  const filteredAndSortedCustomers = useMemo(() => {
    let result = [...localCustomers];

    // 1. Search (Name, Email, Phone)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || 
        (c.email && c.email.toLowerCase().includes(q)) ||
        c.phone.includes(q)
      );
    }

    // 2. Status
    if (statusFilter !== "All") {
      result = result.filter(c => c.status === statusFilter);
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "Name Z-A":
          return b.name.localeCompare(a.name);
        case "Most Orders":
          return b.ordersCount - a.ordersCount;
        case "Highest Spend":
          return b.totalSpent - a.totalSpent;
        case "Newest":
          return new Date(b.lastOrderDate).getTime() - new Date(a.lastOrderDate).getTime();
        case "Name A-Z":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [localCustomers, searchQuery, statusFilter, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedCustomers.length / ITEMS_PER_PAGE);
  const paginatedCustomers = filteredAndSortedCustomers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setSortOption("Name A-Z");
    setCurrentPage(1);
  };

  const handleView = (customer: AdminCustomer) => {
    setViewCandidate(customer);
  };

  const handleToggleInitiate = (customer: AdminCustomer) => {
    setToggleCandidate(customer);
  };

  const handleConfirmToggle = (customer: AdminCustomer) => {
    const newStatus = customer.status === "Active" ? "Inactive" : "Active";
    
    // Update local storage
    updateCustomerStatus(customer.id, newStatus);
    
    // Update local state immediately
    setLocalCustomers(prev => prev.map(c => c.id === customer.id ? { ...c, status: newStatus } : c));
    
    setToggleCandidate(null);

    // Show temporary feedback
    setSuccessMessage(`Customer ${customer.name} is now ${newStatus.toLowerCase()}.`);
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
            Customers
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Manage your store customers and view their order history.
          </p>
        </div>
      </div>

      {/* Toolbar */}
      <AdminCustomerToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      {/* Table */}
      <AdminCustomerTable
        customers={paginatedCustomers}
        onView={handleView}
        onToggleStatus={handleToggleInitiate}
        onClearFilters={handleClearFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {/* Modals */}
      <ViewCustomerModal
        customer={viewCandidate}
        onClose={() => setViewCandidate(null)}
      />

      <ToggleCustomerStatusModal
        customer={toggleCandidate}
        onClose={() => setToggleCandidate(null)}
        onToggle={handleConfirmToggle}
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
