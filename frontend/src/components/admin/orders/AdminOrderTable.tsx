import { Order } from "@/types/order";
import { AdminOrderRow } from "./AdminOrderRow";
import { AdminOrderEmptyState } from "./AdminOrderEmptyState";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminOrderTableProps {
  orders: Order[];
  onView: (order: Order) => void;
  onUpdate: (order: Order) => void;
  onClearFilters: () => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

export function AdminOrderTable({
  orders,
  onView,
  onUpdate,
  onClearFilters,
  currentPage,
  setCurrentPage,
  totalPages
}: AdminOrderTableProps) {
  
  if (orders.length === 0) {
    return (
      <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5] overflow-hidden">
        <AdminOrderEmptyState onClearFilters={onClearFilters} />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-[#FAFAF8] text-gray-500 font-semibold border-b border-[#e5e5e5]">
            <tr>
              <th className="px-6 py-4 font-semibold">Order ID</th>
              <th className="px-6 py-4 font-semibold">Date</th>
              <th className="px-6 py-4 font-semibold">Customer</th>
              <th className="px-6 py-4 font-semibold">Total</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <AdminOrderRow
                key={order.id}
                order={order}
                onView={onView}
                onUpdate={onUpdate}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#e5e5e5] bg-[#FAFAF8]">
          <span className="text-sm font-medium text-gray-500">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className={cn(
                "p-2 rounded-lg border border-[#e5e5e5] bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]",
                currentPage === 1 
                  ? "text-gray-300 cursor-not-allowed" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-black"
              )}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className={cn(
                "p-2 rounded-lg border border-[#e5e5e5] bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]",
                currentPage === totalPages 
                  ? "text-gray-300 cursor-not-allowed" 
                  : "text-gray-600 hover:bg-gray-50 hover:text-black"
              )}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
