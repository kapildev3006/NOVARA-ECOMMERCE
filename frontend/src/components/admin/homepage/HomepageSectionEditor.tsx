"use client";

import React, { useState, useEffect, useMemo } from "react";
import { X, Check, Search, AlertCircle } from "lucide-react";
import { HomepageSection, ProductCarouselConfig } from "@/types/homepage";
import { getAdminProducts } from "@/lib/admin-product-store";
import { Product } from "@/types/product";

interface HomepageSectionEditorProps {
  isOpen: boolean;
  onClose: () => void;
  section: HomepageSection | null;
  onSave: (updatedSection: HomepageSection) => void;
}

export function HomepageSectionEditor({ isOpen, onClose, section, onSave }: HomepageSectionEditorProps) {
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [enabled, setEnabled] = useState(true);

  // Carousel specific
  const [source, setSource] = useState<ProductCarouselConfig["source"]>("deals");
  const [productIds, setProductIds] = useState<string[]>([]);
  
  // Product Selection UI
  const [searchQuery, setSearchQuery] = useState("");
  const [availableProducts, setAvailableProducts] = useState<Product[]>([]);

  useEffect(() => {
    if (isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailableProducts(getAdminProducts());
      
      if (section) {
        setTitle(section.title || "");
        setSubtitle(section.subtitle || "");
        setEnabled(section.enabled);
        
        if (section.type === "product-carousel") {
          const config = section.config as ProductCarouselConfig | undefined;
          setSource(config?.source || "deals");
          setProductIds(config?.productIds || []);
        } else {
          setSource("deals");
          setProductIds([]);
        }
      }
    }
  }, [isOpen, section]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return availableProducts;
    const lower = searchQuery.toLowerCase();
    return availableProducts.filter(p => p.name.toLowerCase().includes(lower) || p.id.toLowerCase().includes(lower));
  }, [searchQuery, availableProducts]);

  if (!isOpen || !section) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (section.type === "product-carousel" && source === "manual" && productIds.length === 0) {
      alert("Manual mode requires at least one product selected.");
      return;
    }

    let updatedConfig = section.config;
    if (section.type === "product-carousel") {
      updatedConfig = {
        source,
        ...(source === "manual" ? { productIds } : {})
      } as ProductCarouselConfig;
    }

    onSave({
      ...section,
      title: title.trim() || undefined,
      subtitle: subtitle.trim() || undefined,
      enabled,
      config: updatedConfig,
    });
  };

  const toggleProduct = (id: string) => {
    setProductIds(prev => 
      prev.includes(id) ? prev.filter(pId => pId !== id) : [...prev, id]
    );
  };

  const isCarousel = section.type === "product-carousel";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-lg w-full relative my-8">
        <button 
          onClick={onClose}
          type="button"
          className="absolute top-4 right-4 text-gray-400 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-lg p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-heading font-bold text-2xl text-[#161513] mb-1">
          Edit Section
        </h3>
        <p className="text-sm font-bold text-gray-500 uppercase tracking-wide mb-6">
          {section.type.replace("-", " ")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div>
            <label className="block text-sm font-bold text-[#161513] mb-1.5">Section Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
              placeholder="e.g. New Arrivals"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#161513] mb-1.5">Subtitle (Optional)</label>
            <input
              type="text"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full h-10 px-3 rounded-xl border border-[#e5e5e5] bg-[#FAFAF8] text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
              placeholder="e.g. Discover our latest products"
            />
          </div>

          {isCarousel && (
            <div className="pt-4 border-t border-[#e5e5e5]">
              <label className="block text-sm font-bold text-[#161513] mb-3">Collection Source</label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                {[
                  { value: "deals", label: "Deals of the Day" },
                  { value: "new-arrivals", label: "New Arrivals" },
                  { value: "best-sellers", label: "Best Sellers" },
                  { value: "manual", label: "Manual Selection" },
                ].map(opt => (
                  <label 
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      source === opt.value 
                        ? "border-[#ff4b2b] bg-[#ff4b2b]/5" 
                        : "border-[#e5e5e5] bg-white hover:bg-gray-50"
                    }`}
                  >
                    <input 
                      type="radio"
                      name="carousel-source"
                      value={opt.value}
                      checked={source === opt.value}
                      onChange={() => setSource(opt.value as ProductCarouselConfig["source"])}
                      className="accent-[#ff4b2b] w-4 h-4"
                    />
                    <span className={`text-sm font-bold ${source === opt.value ? "text-[#ff4b2b]" : "text-[#161513]"}`}>
                      {opt.label}
                    </span>
                  </label>
                ))}
              </div>

              {source === "manual" && (
                <div className="bg-gray-50 p-4 rounded-xl border border-[#e5e5e5] flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-[#161513]">Select Products</h4>
                    <span className="text-xs font-bold text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                      {productIds.length} Selected
                    </span>
                  </div>
                  
                  {productIds.length === 0 && (
                    <div className="flex items-center gap-2 text-amber-600 text-xs font-bold">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Select at least one product.
                    </div>
                  )}

                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search products..."
                      className="w-full h-10 pl-9 pr-3 rounded-xl border border-[#e5e5e5] bg-white text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff4b2b]"
                    />
                  </div>

                  <div className="flex flex-col gap-2 max-h-48 overflow-y-auto custom-scrollbar p-1">
                    {filteredProducts.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">No products found.</p>
                    ) : (
                      filteredProducts.map(p => {
                        const isSelected = productIds.includes(p.id);
                        return (
                          <label 
                            key={p.id}
                            className={`flex items-center justify-between p-2 rounded-lg border cursor-pointer transition-colors ${
                              isSelected ? "border-[#ff4b2b] bg-white shadow-sm" : "border-transparent hover:bg-gray-100"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleProduct(p.id)}
                                className="accent-[#ff4b2b] rounded w-4 h-4"
                              />
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#161513] line-clamp-1">{p.name}</span>
                                <span className="text-xs text-gray-500">{p.category}</span>
                              </div>
                            </div>
                            <span className="text-xs font-bold text-gray-500">${p.price}</span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-gray-50 border border-[#e5e5e5] rounded-xl mt-6">
            <div className="flex flex-col">
              <span className="font-bold text-[#161513]">Enabled</span>
              <span className="text-xs text-gray-500 font-medium">Show this section on the customer homepage.</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-[#ff4b2b] rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff4b2b]"></div>
            </label>
          </div>

          <button
            type="submit"
            disabled={source === "manual" && productIds.length === 0}
            className="w-full h-12 flex items-center justify-center gap-2 bg-[#161513] text-white font-bold rounded-xl mt-6 hover:bg-black/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-black"
          >
            <Check className="w-5 h-5" />
            Apply Changes
          </button>
        </form>
      </div>
    </div>
  );
}
