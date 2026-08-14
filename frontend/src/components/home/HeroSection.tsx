"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const CAROUSEL_IMAGES = [
  "/images/hero/hero.png",
  "/images/products/headphones.jpg",
  "/images/products/smartphone.jpg",
  "/images/products/sneakers.jpg",
];

export function HeroSection() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % CAROUSEL_IMAGES.length);
    }, 5000); // Change image every 5 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative overflow-hidden bg-background pt-8 pb-16 md:pt-16 md:pb-24">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Left Content */}
          <div className="flex flex-col items-start z-10 max-w-2xl">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-8 h-[2px] bg-primary"></span>
              <span className="text-primary font-bold text-sm tracking-widest uppercase">
                Trending Now
              </span>
            </div>
            
            <h1 className="font-heading text-5xl sm:text-6xl lg:text-[4.5rem] font-bold text-foreground leading-[1.05] tracking-tight mb-6">
              Discover Products <br className="hidden sm:block" />
              You&apos;ll Love
            </h1>
            
            <p className="text-lg text-muted mb-10 max-w-lg leading-relaxed">
              Shop the latest products across categories, curated for modern lifestyles.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-4 mb-12 w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto gap-2 px-8 h-14 text-base">
                Shop Now <ArrowRight className="w-5 h-5" />
              </Button>
              <Button size="lg" variant="outline" className="w-full sm:w-auto px-8 h-14 text-base">
                Explore Categories
              </Button>
            </div>
          </div>

          {/* Right Visual Composition (Carousel) */}
          <div className="relative h-[400px] sm:h-[500px] lg:h-[700px] w-full flex items-center justify-center rounded-3xl sm:rounded-[3rem] overflow-hidden bg-[#F2EFEB]">
            {CAROUSEL_IMAGES.map((src, idx) => (
              <Image
                key={src}
                src={src}
                alt="Discover Products You'll Love"
                fill
                className={cn(
                  "object-cover transition-all duration-1000 ease-in-out",
                  idx === currentImageIndex 
                    ? "opacity-100 scale-100 z-10" 
                    : "opacity-0 scale-105 z-0"
                )}
                priority={idx === 0}
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
            ))}

            {/* Optional Carousel Indicators */}
            <div className="absolute bottom-6 md:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-black/10 backdrop-blur-md px-3 py-2 rounded-full">
              {CAROUSEL_IMAGES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImageIndex(idx)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    idx === currentImageIndex 
                      ? "bg-primary w-6" 
                      : "bg-white/80 hover:bg-white"
                  )}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </div>
          </div>
          
        </div>
      </div>
    </section>
  );
}
