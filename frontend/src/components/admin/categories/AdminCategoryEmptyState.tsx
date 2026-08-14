import { FolderX } from "lucide-react";

interface AdminCategoryEmptyStateProps {
  onClearFilters: () => void;
}

export function AdminCategoryEmptyState({ onClearFilters }: AdminCategoryEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
      <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
        <FolderX className="w-8 h-8 text-gray-300" />
      </div>
      <h3 className="font-heading font-bold text-xl text-[#161513] mb-2">No categories found</h3>
      <p className="text-gray-500 font-medium text-sm max-w-sm mb-6">
        We couldn&apos;t find any categories matching your current filters. Try adjusting your search criteria.
      </p>
      <button
        onClick={onClearFilters}
        className="h-10 px-6 rounded-xl border border-[#e5e5e5] bg-white text-sm font-bold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
      >
        Clear Filters
      </button>
    </div>
  );
}
