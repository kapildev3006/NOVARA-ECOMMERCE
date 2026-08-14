"use client";

import { useState, useMemo, useEffect } from "react";
import { getAdminCategories, saveAdminCategory, deleteAdminCategory } from "@/lib/admin-category-store";
import { mockProducts } from "@/data/products";
import { Category } from "@/types/category";
import { AdminCategoryToolbar } from "@/components/admin/categories/AdminCategoryToolbar";
import { AdminCategoryTable } from "@/components/admin/categories/AdminCategoryTable";
import { ExtendedCategory } from "@/components/admin/categories/AdminCategoryRow";
import { CategoryFormModal } from "@/components/admin/categories/CategoryFormModal";
import { DeleteCategoryModal } from "@/components/admin/categories/DeleteCategoryModal";
import { Plus } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function AdminCategoriesPage() {
  const [localCategories, setLocalCategories] = useState<Category[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortOption, setSortOption] = useState("Name A-Z");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ExtendedCategory | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ExtendedCategory | null>(null);

  useEffect(() => {
    // Initial fetch/set of local categories
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalCategories(getAdminCategories());
     
    setIsHydrated(true);
  }, []);

  // Adjust pagination if current page becomes empty after deletion
  useEffect(() => {
    const totalPages = Math.ceil(localCategories.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [localCategories.length, currentPage]);

  // Reset to page 1 on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, statusFilter, sortOption]);

  // Derive Extended Categories with Product Counts
  const extendedCategories = useMemo<ExtendedCategory[]>(() => {
    return localCategories.map(cat => {
      const count = mockProducts.filter(p => p.category === cat.name).length;
      return {
        ...cat,
        productCount: count
      };
    });
  }, [localCategories]);

  const filteredAndSortedCategories = useMemo(() => {
    let result = [...extendedCategories];

    // 1. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(c => 
        c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q)
      );
    }

    // 2. Status
    if (statusFilter !== "All") {
      const isActiveFilter = statusFilter === "Active";
      result = result.filter(c => c.isActive === isActiveFilter);
    }

    // 3. Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "Name Z-A":
          return b.name.localeCompare(a.name);
        case "Count High-Low":
          return b.productCount - a.productCount;
        case "Count Low-High":
          return a.productCount - b.productCount;
        case "Name A-Z":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [extendedCategories, searchQuery, statusFilter, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedCategories.length / ITEMS_PER_PAGE);
  const paginatedCategories = filteredAndSortedCategories.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setSortOption("Name A-Z");
    setCurrentPage(1);
  };

  const handleAddClick = () => {
    setEditingCategory(null);
    setIsFormModalOpen(true);
  };

  const handleEditClick = (category: ExtendedCategory) => {
    setEditingCategory(category);
    setIsFormModalOpen(true);
  };

  const handleDeleteRequest = (category: ExtendedCategory) => {
    setDeleteCandidate(category);
  };

  const confirmDelete = () => {
    if (deleteCandidate && deleteCandidate.productCount === 0) {
      const success = deleteAdminCategory(deleteCandidate.id);
      if (success) {
        setLocalCategories(prev => prev.filter(c => c.id !== deleteCandidate.id));
      }
    }
    setDeleteCandidate(null);
  };

  const handleSaveCategory = (category: Category) => {
    saveAdminCategory(category);
    setLocalCategories(getAdminCategories());
    setIsFormModalOpen(false);
    setEditingCategory(null);
  };

  if (!isHydrated) return null;

  return (
    <div className="flex flex-col gap-6 pt-4 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
            Categories
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Manage your product categories.
          </p>
        </div>
        
        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 bg-[#ff4b2b] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#ff3b1a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff4b2b] shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add New Category
        </button>
      </div>

      {/* Toolbar */}
      <AdminCategoryToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
      />

      {/* Table */}
      <AdminCategoryTable
        categories={paginatedCategories}
        onEdit={handleEditClick}
        onDelete={handleDeleteRequest}
        onClearFilters={handleClearFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {/* Modals */}
      <CategoryFormModal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingCategory(null); }}
        onSave={handleSaveCategory}
        category={editingCategory}
      />

      <DeleteCategoryModal
        category={deleteCandidate}
        onClose={() => setDeleteCandidate(null)}
        onConfirm={confirmDelete}
      />

    </div>
  );
}
