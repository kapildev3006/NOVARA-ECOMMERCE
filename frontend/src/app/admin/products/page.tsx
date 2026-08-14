"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getAdminProducts, deleteAdminProduct } from "@/lib/admin-product-store";
import { Product } from "@/types/product";
import { AdminProductToolbar } from "@/components/admin/products/AdminProductToolbar";
import { AdminProductTable } from "@/components/admin/products/AdminProductTable";
import { DeleteProductModal } from "@/components/admin/products/DeleteProductModal";
import { Plus, X } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function AdminProductsPage() {
  const router = useRouter();
  const [localProducts, setLocalProducts] = useState<Product[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [stockFilter, setStockFilter] = useState("All");
  const [sortOption, setSortOption] = useState("Newest");
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [modalMessage, setModalMessage] = useState<string | null>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Product | null>(null);

  useEffect(() => {
    // Initial fetch/set of local products
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalProducts(getAdminProducts());
     
    setIsHydrated(true);
  }, []);

  // Reset to page 1 on filter change
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentPage(1);
  }, [searchQuery, selectedCategory, stockFilter, sortOption]);

  // Adjust pagination if current page becomes empty after deletion
  useEffect(() => {
    const totalPages = Math.ceil(localProducts.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentPage(totalPages);
    }
  }, [localProducts.length, currentPage]);

  const categories = useMemo(() => {
    const cats = new Set(localProducts.map((p) => p.category));
    return Array.from(cats).sort();
  }, [localProducts]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...localProducts];

    // 1. Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    }

    // 2. Category
    if (selectedCategory !== "All") {
      result = result.filter(p => p.category === selectedCategory);
    }

    // 3. Stock
    if (stockFilter !== "All") {
      result = result.filter(p => {
        if (stockFilter === "Out of Stock") return p.stock === 0;
        if (stockFilter === "Low Stock") return p.stock > 0 && p.stock <= 10;
        if (stockFilter === "In Stock") return p.stock > 10;
        return true;
      });
    }

    // 4. Sort
    result.sort((a, b) => {
      switch (sortOption) {
        case "Price: Low to High":
          return a.price - b.price;
        case "Price: High to Low":
          return b.price - a.price;
        case "Rating":
          return b.rating - a.rating;
        case "Stock":
          return b.stock - a.stock;
        case "Newest":
        default:
          // Fallback to isNew flag if true, then by ID
          if (a.isNew && !b.isNew) return -1;
          if (!a.isNew && b.isNew) return 1;
          return a.id.localeCompare(b.id);
      }
    });

    return result;
  }, [localProducts, searchQuery, selectedCategory, stockFilter, sortOption]);

  const totalPages = Math.ceil(filteredAndSortedProducts.length / ITEMS_PER_PAGE);
  const paginatedProducts = filteredAndSortedProducts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("All");
    setStockFilter("All");
    setSortOption("Newest");
    setCurrentPage(1);
  };

  const handleEdit = (product: Product) => {
    router.push(`/admin/products/${product.id}/edit`);
  };

  const handleAdd = () => {
    router.push("/admin/products/new");
  };

  const handleDeleteRequest = (product: Product) => {
    setDeleteCandidate(product);
  };

  const confirmDelete = () => {
    if (deleteCandidate) {
      const success = deleteAdminProduct(deleteCandidate.id);
      if (success) {
        setLocalProducts(prev => prev.filter(p => p.id !== deleteCandidate.id));
        setModalMessage("Product deleted successfully.");
      } else {
        setModalMessage("Error: Product could not be deleted or does not exist.");
      }
      setDeleteCandidate(null);
    }
  };

  if (!isHydrated) return null;

  return (
    <div className="flex flex-col gap-6 pt-4 relative">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
            Products
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Manage your store products and inventory.
          </p>
        </div>
        
        <button
          onClick={handleAdd}
          className="flex items-center justify-center gap-2 bg-[#ff4b2b] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#ff3b1a] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#ff4b2b] shadow-sm w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          Add New Product
        </button>
      </div>

      {/* Toolbar */}
      <AdminProductToolbar
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        stockFilter={stockFilter}
        setStockFilter={setStockFilter}
        sortOption={sortOption}
        setSortOption={setSortOption}
        categories={categories}
      />

      {/* Table */}
      <AdminProductTable
        products={paginatedProducts}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
        onClearFilters={handleClearFilters}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalPages={totalPages}
      />

      {/* Generic Coming Soon Modal */}
      {modalMessage && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-sm w-full flex flex-col relative">
            <button 
              onClick={() => setModalMessage(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-black focus-visible:outline-none"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-heading font-bold text-xl text-[#161513] mb-2 pr-6">Coming Soon</h3>
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <button
              onClick={() => setModalMessage(null)}
              className="w-full bg-[#161513] text-white font-bold py-2.5 rounded-xl hover:bg-black/80 transition-colors"
            >
              Okay
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteCandidate && (
        <DeleteProductModal 
          product={deleteCandidate}
          onClose={() => setDeleteCandidate(null)}
          onConfirm={confirmDelete}
        />
      )}

    </div>
  );
}
