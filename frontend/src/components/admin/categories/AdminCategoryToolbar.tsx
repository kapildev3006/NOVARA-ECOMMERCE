"use client";

import { Search, X, Filter } from "lucide-react";

interface AdminCategoryToolbarProps {
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  sortOption: string;
  setSortOption: (val: string) => void;
}

export function AdminCategoryToolbar({
  searchQuery,
  setSearchQuery,
  statusFilter,
  setStatusFilter,
  sortOption,
  setSortOption,
}: AdminCategoryToolbarProps) {
  const isFiltered = searchQuery !== "" || statusFilter !== "All" || sortOption !== "Name A-Z";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setSortOption("Name A-Z");
  };

  return (
    <div className="flex flex-col sm:flex-row flex-wrap gap-4 items-start sm:items-center bg-white p-4 rounded-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.02)] border border-[#e5e5e5]">
      
      {/* Search */}
      <div className="relative w-full sm:w-auto sm:flex-1 min-w-[200px]">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search categories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-10 pl-9 pr-4 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] transition-all"
        />
      </div>

      {/* Filters Wrapper */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
        
        {/* Status Status */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 pr-8 rounded-xl border border-[#e5e5e5] bg-white text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer flex-1 sm:flex-none min-w-[120px]"
          style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat' }}
        >
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        {/* Sort */}
        <div className="relative flex-1 sm:flex-none min-w-[170px]">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Filter className="w-4 h-4 text-gray-400" />
          </div>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="w-full h-10 pl-9 pr-8 rounded-xl border border-[#e5e5e5] bg-white text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] appearance-none cursor-pointer"
            style={{ backgroundImage: `url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>')`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat' }}
          >
            <option value="Name A-Z">Name: A-Z</option>
            <option value="Name Z-A">Name: Z-A</option>
            <option value="Count High-Low">Products: High to Low</option>
            <option value="Count Low-High">Products: Low to High</option>
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
