import { Product } from "@/types/product";
import { AdminProductRow } from "./AdminProductRow";
import { AdminProductEmptyState } from "./AdminProductEmptyState";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface AdminProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  onClearFilters: () => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

export function AdminProductTable({
  products,
  onEdit,
  onDelete,
  onClearFilters,
  currentPage,
  setCurrentPage,
  totalPages
}: AdminProductTableProps) {
  
  if (products.length === 0) {
    return (
      <div className="bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5] overflow-hidden">
        <AdminProductEmptyState onClearFilters={onClearFilters} />
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap min-w-[800px]">
          <thead className="bg-[#FAFAF8] text-gray-500 font-semibold border-b border-[#e5e5e5]">
            <tr>
              <th className="px-6 py-4 font-semibold w-[300px]">Product</th>
              <th className="px-6 py-4 font-semibold">Category</th>
              <th className="px-6 py-4 font-semibold">Price</th>
              <th className="px-6 py-4 font-semibold">Stock</th>
              <th className="px-6 py-4 font-semibold">Rating</th>
              <th className="px-6 py-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <AdminProductRow
                key={product.id}
                product={product}
                onEdit={onEdit}
                onDelete={onDelete}
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
