"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronRight, Search } from "lucide-react";
import { mockCategories } from "@/data/categories";
import { cn } from "@/lib/utils";

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button 
        className="md:hidden p-2 -ml-2 text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
        onClick={() => setIsOpen(true)}
        aria-label="Open mobile menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <div 
        className={cn(
          "fixed top-0 left-0 bottom-0 w-4/5 max-w-sm bg-background z-50 transform transition-transform duration-300 ease-in-out md:hidden flex flex-col overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-black/5">
          <Link href="/" className="font-heading font-bold text-xl tracking-tight text-foreground" onClick={() => setIsOpen(false)}>
            NOVARA
          </Link>
          <button 
            className="p-2 -mr-2 text-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-md"
            onClick={() => setIsOpen(false)}
            aria-label="Close mobile menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-4 border-b border-black/5">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" />
            <input 
              type="text" 
              placeholder="Search products, brands and more..." 
              className="w-full bg-surface border-transparent rounded-lg h-10 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
            />
          </div>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-6">
          <div className="flex flex-col">
            <Link href="/" className="py-2 text-foreground font-medium" onClick={() => setIsOpen(false)}>Home</Link>
            
            <div className="mt-4 mb-2 text-xs font-bold text-muted uppercase tracking-wider">Shop</div>
            <Link href="#" className="py-2.5 text-foreground flex items-center justify-between" onClick={() => setIsOpen(false)}>
              All Products <ChevronRight className="w-4 h-4 text-muted" />
            </Link>
            <Link href="#" className="py-2.5 text-foreground flex items-center justify-between" onClick={() => setIsOpen(false)}>
              New Arrivals <ChevronRight className="w-4 h-4 text-muted" />
            </Link>
            <Link href="#" className="py-2.5 text-foreground flex items-center justify-between" onClick={() => setIsOpen(false)}>
              Best Sellers <ChevronRight className="w-4 h-4 text-muted" />
            </Link>
            <Link href="#" className="py-2.5 text-foreground flex items-center justify-between" onClick={() => setIsOpen(false)}>
              Deals <ChevronRight className="w-4 h-4 text-muted" />
            </Link>

            <div className="mt-6 mb-2 text-xs font-bold text-muted uppercase tracking-wider">Categories</div>
            {mockCategories.map(category => (
              <Link 
                key={category.id} 
                href={`#${category.slug}`} 
                className="py-2.5 text-foreground flex items-center justify-between"
                onClick={() => setIsOpen(false)}
              >
                {category.name} <ChevronRight className="w-4 h-4 text-muted" />
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 bg-surface/50 border-t border-black/5 flex flex-col">
          <Link href="#" className="py-2.5 text-foreground font-medium" onClick={() => setIsOpen(false)}>Account</Link>
          <Link href="#" className="py-2.5 text-foreground font-medium" onClick={() => setIsOpen(false)}>Wishlist</Link>
          <Link href="#" className="py-2.5 text-foreground font-medium" onClick={() => setIsOpen(false)}>Orders</Link>
          <Link href="#" className="py-2.5 text-foreground font-medium" onClick={() => setIsOpen(false)}>Help</Link>
        </div>
      </div>
    </>
  );
}
