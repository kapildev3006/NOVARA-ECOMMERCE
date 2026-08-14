"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mockCategories } from "@/data/categories";
import { useState, useEffect, useRef } from "react";

export function CategoryNavigation() {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnimating = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (isAnimating.current) {
        lastScrollY.current = currentScrollY;
        return;
      }
      
      if (currentScrollY < 50) {
        if (!isVisible) {
          setIsVisible(true);
          isAnimating.current = true;
          setTimeout(() => { isAnimating.current = false; }, 400);
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        lastScrollY.current = currentScrollY;
        return;
      }

      // Ignore micro-scrolls to prevent blinking/jitter on trackpads
      if (Math.abs(currentScrollY - lastScrollY.current) < 10) {
        return; 
      }

      if (currentScrollY > lastScrollY.current) {
        if (isVisible) {
          setIsVisible(false);
          isAnimating.current = true;
          setTimeout(() => { isAnimating.current = false; }, 400);
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
      } else if (currentScrollY < lastScrollY.current) {
        if (!isVisible) {
          setIsVisible(true);
          isAnimating.current = true;
          setTimeout(() => { isAnimating.current = false; }, 400);
        }
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          // Only hide if we aren't at the very top
          if (window.scrollY > 50) {
            setIsVisible(false);
            isAnimating.current = true;
            setTimeout(() => { isAnimating.current = false; }, 400);
          }
        }, 2300);
      }
      
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isVisible]);
  
  return (
    <div className={cn(
      "hidden md:grid border-black/5 bg-background transition-[grid-template-rows,opacity,border-color] duration-300 ease-in-out",
      isVisible ? "grid-rows-[1fr] opacity-100 border-t" : "grid-rows-[0fr] opacity-0 border-transparent"
    )}>
      <div className="overflow-hidden">
        <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10 h-16 flex items-center overflow-x-auto scrollbar-hide">
          <div className="flex items-center gap-8 text-[15px] font-semibold">
            <Link
              href="/"
              className={cn(
                "whitespace-nowrap transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm",
                pathname === "/" ? "text-primary" : "text-foreground"
              )}
            >
              All Categories
            </Link>
            
            {mockCategories.map((category) => (
              <Link
                key={category.id}
                href={`#${category.slug}`}
                className={cn(
                  "whitespace-nowrap transition-colors hover:text-primary text-foreground/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-sm"
                )}
              >
                {category.name}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
