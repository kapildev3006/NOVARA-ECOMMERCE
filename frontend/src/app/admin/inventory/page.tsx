"use client";

import { useState, useMemo, useEffect } from "react";
import { Product } from "@/types/product";
import { getAdminProducts, saveAdminProduct } from "@/lib/admin-product-store";
import { getAdminCategories } from "@/lib/admin-category-store";
import { AdminInventoryToolbar } from "@/components/admin/inventory/AdminInventoryToolbar";
import { AdminInventoryTable } from "@/components/admin/inventory/AdminInventoryTable";
import { UpdateStockModal } from "@/components/admin/inventory/UpdateStockModal";
import { Check, Package, AlertTriangle, XCircle, Box } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function AdminInventoryPage() {
  const [localInventory, setLocalInventory] = useState<Product[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [stockFilter, setStockFilter] = useState("All Statuses");
  const [sortOption, setSortOption] = useState("Product Name");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [updateCandidate, setUpdateCandidate] = useState<Product | null>(null);
  
  // Feedback
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    // Initial fetch of products
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalInventory(getAdminProducts());
     
    setIsHydrated(true);
  }, []);

  // Reset to page 1 on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, categoryFilter, stockFilter, sortOption]);

  // Derived categories
  const [categoriesList, setCategoriesList] = useState<string[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCategoriesList(getAdminCategories().map(c => c.name));
  }, []);

  const getStockStatus = (stock: number) => {
    if (stock === 0) return "Out of Stock";
    if (stock <= 10) return "Low Stock";
    return "In Stock";
  };

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...localInventory];

    // 1. Search (Name, ID)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.id.toLowerCase().includes(q)
      );
    }

    // 2. Category
    if (categoryFilter !== "All Categories") {
      result = result.filter(p => p.category === categoryFilter);
    }

    // 3. Stock Status
    if (stockFilter !== "All Statuses") {
      result = result.filter(p => getStockStatus(p.stock) === stockFilter);
    }

    // 4. Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "Stock Low → High":
          return a.stock - b.stock;
        case "Stock High → Low":
          return b.stock - a.stock;
        case "Price":
          return b.price - a.price;
        case "Product Name":
        default:
          return a.name.localeCompare(b.name);
      }
    });

    return result;
  }, [localInventory, searchQuery, categoryFilter, stockFilter, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setCategoryFilter("All Categories");
    setStockFilter("All Statuses");
    setSortOption("Product Name");
    setCurrentPage(1);
  };

  const handleUpdateInitiate = (product: Product) => {
    setUpdateCandidate(product);
  };

  const handleConfirmUpdate = (productId: string, newStock: number) => {
    const product = localInventory.find(p => p.id === productId);
    if (!product) return;

    const updatedProduct = { ...product, stock: newStock };
    saveAdminProduct(updatedProduct);

    // Update local state immediately
    setLocalInventory(getAdminProducts());
    
    setUpdateCandidate(null);

    // Show temporary feedback
    setSuccessMessage(`Stock for ${product.name} updated to ${newStock}.`);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
  };

  // KPIs
  const totalProducts = localInventory.length;
  const inStock = localInventory.filter(p => p.stock > 10).length;
  const lowStock = localInventory.filter(p => p.stock > 0 && p.stock <= 10).length;
  const outOfStock = localInventory.filter(p => p.stock === 0).length;

  if (!isHydrated) return null;

  return (
    <div className="flex flex-col gap-6 pt-4 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
            Inventory
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Manage your product stock levels and track inventory status.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Total Products</span>
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
              <Box className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <span className="text-2xl font-bold text-[#161513]">{totalProducts}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">In Stock</span>
            <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
              <Package className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <span className="text-2xl font-bold text-green-600">{inStock}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Low Stock</span>
            <div className="w-8 h-8 rounded-full bg-orange-50 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <span className="text-2xl font-bold text-orange-600">{lowStock}</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-[#e5e5e5] shadow-[0_2px_8px_rgba(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-bold text-gray-500 uppercase tracking-wide">Out of Stock</span>
            <div className="w-8 h-8 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="w-4 h-4 text-red-500" />
            </div>
          </div>
          <span className="text-2xl font-bold text-red-600">{outOfStock}</span>
        </div>
      </div>

      {/* Toolbar */}
      <AdminInventoryToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        categories={categoriesList}
      />

      {/* Table */}
      <AdminInventoryTable
        products={paginatedProducts}
        onUpdateStock={handleUpdateInitiate}
        onClearFilters={handleClearFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {/* Modals */}
      <UpdateStockModal
        product={updateCandidate}
        onClose={() => setUpdateCandidate(null)}
        onSave={handleConfirmUpdate}
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
