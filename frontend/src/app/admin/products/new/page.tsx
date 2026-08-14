"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Sparkles, PenLine } from "lucide-react";
import { ProductForm } from "@/components/admin/products/ProductForm";
import { AiProductGenerator } from "@/components/admin/products/AiProductGenerator";
import { Product } from "@/types/product";

export default function NewProductPage() {
  const [mode, setMode] = useState<"select" | "manual" | "ai">("select");
  const [aiData, setAiData] = useState<Partial<Product> | null>(null);
  const [formKey, setFormKey] = useState(0);

  const handleApplyAiData = (data: Partial<Product>) => {
    setAiData(data);
    setFormKey(prev => prev + 1); // Force ProductForm to remount and accept new initialData
    setMode("manual");
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 pt-4 pb-12">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/products"
          className="w-10 h-10 rounded-xl bg-white border border-[#e5e5e5] flex items-center justify-center text-gray-500 hover:text-black hover:bg-gray-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]"
          aria-label="Back to Products"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-heading font-bold text-3xl md:text-[32px] text-[#161513] mb-2 tracking-tight">
            Add New Product
          </h1>
          <p className="text-gray-500 font-medium text-sm md:text-base">
            Create a new product for your catalog.
          </p>
        </div>
      </div>

      {mode === "select" && (
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button 
            onClick={() => setMode("ai")}
            className="flex-1 bg-white border-2 border-[#FF5A36]/20 hover:border-[#FF5A36] rounded-2xl p-6 text-left transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FF5A36]"
          >
            <div className="w-12 h-12 rounded-full bg-[#FF5A36]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6 text-[#FF5A36]" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-foreground">Generate with Gemini</h3>
            <p className="text-sm text-muted">Use AI to draft your product details instantly.</p>
          </button>
          
          <button 
            onClick={() => setMode("manual")}
            className="flex-1 bg-white border-2 border-black/5 hover:border-black/20 rounded-2xl p-6 text-left transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
          >
            <div className="w-12 h-12 rounded-full bg-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <PenLine className="w-6 h-6 text-foreground" />
            </div>
            <h3 className="font-bold text-lg mb-2 text-foreground">Enter Manually</h3>
            <p className="text-sm text-muted">Start with a blank form and fill it yourself.</p>
          </button>
        </div>
      )}

      {mode === "ai" && (
        <div className="flex justify-center">
          <AiProductGenerator 
            onApply={handleApplyAiData} 
            onCancel={() => setMode("select")} 
          />
        </div>
      )}

      {mode === "manual" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          <ProductForm key={formKey} initialData={aiData as Product | undefined} />
        </div>
      )}
    </div>
  );
}
