"use client";

import React from "react";
import { X, Plus, AlertCircle } from "lucide-react";
import { HomepageSection, HomepageSectionType } from "@/types/homepage";

interface AddHomepageSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (section: HomepageSection) => void;
  currentSections: HomepageSection[];
}

const SECTION_TEMPLATES: {
  type: HomepageSectionType;
  label: string;
  description: string;
  isSingleton: boolean;
  isProtected: boolean;
}[] = [
  {
    type: "announcement",
    label: "Announcement Bar",
    description: "A narrow banner at the very top of the page for global messages.",
    isSingleton: true,
    isProtected: false,
  },
  {
    type: "hero",
    label: "Hero Section",
    description: "The main hero banner with a primary call to action.",
    isSingleton: true,
    isProtected: true,
  },
  {
    type: "service-bar",
    label: "Service Bar",
    description: "A row of trust signals like 'Free Shipping' and 'Support'.",
    isSingleton: true,
    isProtected: true,
  },
  {
    type: "categories",
    label: "Shop by Categories",
    description: "A grid displaying product categories.",
    isSingleton: true,
    isProtected: false,
  },
  {
    type: "product-carousel",
    label: "Product Carousel",
    description: "A horizontally scrolling list of products from a specific collection.",
    isSingleton: false,
    isProtected: false,
  },
  {
    type: "promo-banner",
    label: "Promotional Banner",
    description: "A large standalone image banner for promotions.",
    isSingleton: false,
    isProtected: false,
  },
  {
    type: "custom",
    label: "✨ Custom Section",
    description: "Build a completely custom section with images, text, and products.",
    isSingleton: false,
    isProtected: false,
  },
];

export function AddHomepageSectionModal({ isOpen, onClose, onAdd, currentSections }: AddHomepageSectionModalProps) {
  if (!isOpen) return null;

  const handleAdd = (template: typeof SECTION_TEMPLATES[0]) => {
    // Generate new order
    const nextOrder = currentSections.length > 0 
      ? Math.max(...currentSections.map(s => s.order)) + 1 
      : 0;
    
    const newSection: HomepageSection = {
      // eslint-disable-next-line react-hooks/purity
      id: template.isSingleton ? template.type : `${template.type}-${Date.now()}`,
      type: template.type,
      enabled: true,
      order: nextOrder,
      isProtected: template.isProtected,
      title: template.type === "product-carousel" ? "New Product Carousel" : (template.type === "custom" ? "Custom Section" : undefined),
      ...(template.type === "product-carousel" ? { config: { source: "deals", productIds: [] } } : {}),
      ...(template.type === "custom" ? { config: { layout: "image-left", title: "", subtitle: "", description: "", productIds: [], categoryIds: [] } } : {})
    };

    onAdd(newSection);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 overflow-y-auto">
      <div className="bg-white rounded-[16px] shadow-xl border border-[#e5e5e5] p-6 max-w-lg w-full relative my-8">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black rounded-lg p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="font-heading font-bold text-2xl text-[#161513] mb-6">
          Add Section
        </h3>

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {SECTION_TEMPLATES.map((template) => {
            const alreadyExists = template.isSingleton && currentSections.some(s => s.type === template.type);

            return (
              <div 
                key={template.type}
                className={`flex items-start justify-between p-4 rounded-xl border transition-colors ${
                  alreadyExists 
                    ? "border-gray-200 bg-gray-50 opacity-75"
                    : "border-[#e5e5e5] bg-white hover:border-[#161513]"
                }`}
              >
                <div className="flex flex-col pr-4">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#161513] text-base">{template.label}</span>
                    {template.isSingleton && (
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">
                        Unique
                      </span>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-1">{template.description}</p>
                  
                  {alreadyExists && (
                    <div className="flex items-center gap-1.5 mt-2 text-amber-600">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">This section already exists.</span>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => handleAdd(template)}
                  disabled={alreadyExists}
                  className={`shrink-0 w-10 h-10 flex items-center justify-center rounded-xl transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black ${
                    alreadyExists 
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                      : "bg-[#161513] text-white hover:bg-black/80"
                  }`}
                  aria-label={`Add ${template.label}`}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
