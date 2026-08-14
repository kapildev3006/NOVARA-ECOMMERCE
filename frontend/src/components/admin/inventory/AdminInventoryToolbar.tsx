"use client";

import { Search, X, Filter } from "lucide-react";

interface AdminInventoryToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  stockFilter: string;
  setStockFilter: (val: string) => void;
  sortOption: string;
  setSortOption: (val: string) => void;
  categories: string[];
}

export function AdminInventoryToolbar({
  searchQuery,
  setSearchQuery,
  categoryFilter,
  setCategoryFilter,
  stockFilter,
  setStockFilter,
  sortOption,
  setSortOption,
  categories,
}: AdminInventoryToolbarProps) {
  const isFiltered = searchQuery !== "" || categoryFilter !== "All Categories" || stockFilter !== "All Statuses" || sortOption !== "Product Name";

  const clearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All Categories");
    setStockFilter("All Statuses");
    setSortOption("Product Name");
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center bg-white p-4 rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5]">
      
      {/* Search */}
      <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search by product name or ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
        />
      </div>

      {/* Filters Wrapper */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        
        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="h-10 px-3 pr-8 rounded-xl border border-[#e5e5e5] bg-white text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer flex-1 sm:flex-none min-w-[140px]"
          style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat' }}
        >
          <option value="All Categories">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Stock Filter */}
        <select
          value={stockFilter}
          onChange={(e) => setStockFilter(e.target.value)}
          className="h-10 px-3 pr-8 rounded-xl border border-[#e5e5e5] bg-white text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer flex-1 sm:flex-none min-w-[140px]"
          style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat' }}
        >
          <option value="All Statuses">All Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>

        {/* Sort */}
        <div className="relative flex-1 sm:flex-none min-w-[150px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-[#e5e5e5] bg-white text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer"
            style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat' }}
          >
            <option value="Product Name">Product Name</option>
            <option value="Stock Low → High">Stock Low → High</option>
            <option value="Stock High → Low">Stock High → Low</option>
            <option value="Price">Price</option>
          </select>
        </div>

        {/* Clear Filters */}
        {isFiltered && (
          <button
            onClick={clearFilters}
            className="h-10 px-3 flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 text-red-600 text-sm font-bold hover:bg-red-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 w-full sm:w-auto justify-center"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

    </div>
  );
}
