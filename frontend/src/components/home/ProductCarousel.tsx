"use client";

import { useRef } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { Product } from "@/types/product";

interface ProductCarouselProps {
  title: string;
  products: Product[];
  actionLink?: {
    label: string;
    href: string;
  };
  eyebrow?: string;
}

export function ProductCarousel({ title, products, actionLink, eyebrow }: ProductCarouselProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const { scrollLeft, clientWidth } = scrollContainerRef.current;
      const scrollAmount = clientWidth * 0.8; // scroll 80% of width
      scrollContainerRef.current.scrollTo({
        left: direction === "left" ? scrollLeft - scrollAmount : scrollLeft + scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section className="bg-background py-10 md:py-16 border-b border-black/5 last:border-0">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 md:mb-8 gap-4">
          <div>
            {eyebrow && (
              <div className="flex items-center gap-2 mb-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                <span className="text-primary font-bold text-[10px] tracking-widest uppercase">
                  {eyebrow}
                </span>
              </div>
            )}
            <h2 className="font-heading text-2xl md:text-[32px] font-bold text-foreground tracking-tight mb-1.5 md:mb-2">
              {title}
            </h2>
          </div>
          
          <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 md:gap-6">
            {actionLink && (
              <Link 
                href={actionLink.href}
                className="text-xs md:text-sm font-semibold text-muted hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
              >
                {actionLink.label} <span className="ml-0.5">→</span>
              </Link>
            )}
            
            {/* Desktop Navigation Arrows */}
            <div className="hidden md:flex items-center gap-2">
              <button 
                onClick={() => scroll("left")}
                className="w-10 h-10 rounded-full bg-surface border border-transparent hover:border-black/5 flex items-center justify-center text-foreground hover:text-primary hover:bg-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Scroll left"
              >
                <ArrowLeft className="w-5 h-5 stroke-[1.5]" />
              </button>
              <button 
                onClick={() => scroll("right")}
                className="w-10 h-10 rounded-full bg-surface border border-transparent hover:border-black/5 flex items-center justify-center text-foreground hover:text-primary hover:bg-white transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Scroll right"
              >
                <ArrowRight className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>
          </div>
        </div>

        {/* Carousel Container */}
        <div className="-mx-4 md:mx-0 relative">
          <div 
            ref={scrollContainerRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide px-4 md:px-0 gap-4 md:gap-6 pb-4"
          >
            {products.map((product) => (
              <div 
                key={product.id} 
                className="shrink-0 w-[240px] sm:w-[260px] lg:w-[280px] xl:w-[calc((100%-120px)/6)] snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
        
      </div>
    </section>
  );
}
