"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, PackageX, Loader2 } from "lucide-react";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { getAdminProducts } from "@/lib/admin-product-store";
import { Product } from "@/types/product";

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate slight network delay for prototype realism, and ensure localStorage is read client-side
    const loadProduct = () => {
      const products = getAdminProducts();
      const found = products.find(p => p.id === id);
      setProduct(found || null);
      setIsLoading(false);
    };
    
    loadProduct();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 pt-4 pb-12">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/products"
            className="w-10 h-10 rounded-xl bg-white border border-[#e5e5e5] flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
              Edit Product
            </h1>
            <p className="text-gray-500 font-medium text-sm md:text-base">
              Loading product data...
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-12 flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 text-[#ff4b2b] animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col gap-6 md:gap-8 pt-4 pb-12">
        <div className="flex items-center gap-4">
          <Link 
            href="/admin/products"
            className="w-10 h-10 rounded-xl bg-white border border-[#e5e5e5] flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
              Edit Product
            </h1>
            <p className="text-gray-500 font-medium text-sm md:text-base">
              Product not found
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-[#e5e5e5] p-12 flex flex-col items-center justify-center text-center min-h-[400px]">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mb-6">
            <PackageX className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="font-heading font-bold text-2xl text-[#161513] mb-3">
            Product Not Found
          </h2>
          <p className="text-gray-500 font-medium max-w-md mb-8">
            The product you are trying to edit does not exist or may have been deleted.
          </p>
          <Link
            href="/admin/products"
            className="bg-[#161513] text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-[#ff4b2b] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b] focus-visible:ring-offset-2"
          >
            ← Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 pt-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/products"
          className="w-10 h-10 rounded-xl bg-white border border-[#e5e5e5] flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
          aria-label="Back to Products"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
            Edit Product
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Update existing product information.
          </p>
        </div>
      </div>

      <ProductForm initialData={product} />
    </div>
  );
}
