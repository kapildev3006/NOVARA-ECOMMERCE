"use client";

import { useState, useEffect } from "react";
import { Filter, X } from "lucide-react";
import { ProductFilterControls } from "./ProductFilterControls";

export function MobileFilterDrawer() {
  const [isOpen, setIsOpen] = useState(false);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  return (
    <div className="lg:hidden">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 bg-surface border border-black/5 rounded-lg py-2 px-4 text-sm font-medium hover:bg-black/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary shadow-sm"
      >
        <Filter className="w-4 h-4" />
        Filters
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm transition-opacity"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div 
        className={`fixed inset-y-0 right-0 z-50 w-full max-w-xs bg-background shadow-2xl transform transition-transform duration-300 ease-in-out flex flex-col ${isOpen ? "translate-x-0" : "translate-x-full"}`}
      >
        <div className="flex items-center justify-between p-4 border-b border-black/5">
          <h2 className="text-xl font-heading font-bold tracking-tight">Filters</h2>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 -mr-2 rounded-lg hover:bg-black/5 text-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            aria-label="Close filters"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <ProductFilterControls />
        </div>
        
        {/* Sticky Apply Button */}
        <div className="p-4 border-t border-black/5 bg-background">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full bg-primary hover:bg-[#e04f2f] text-white font-bold py-3 px-4 rounded-xl shadow-md hover:shadow-lg transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary"
          >
            Show Results
          </button>
        </div>
      </div>
    </div>
  );
}
