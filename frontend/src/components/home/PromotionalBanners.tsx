"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

const BANNERS = [
  {
    id: 1,
    tag: "Flash Sale",
    title: (
      <>
        Up To <span className="text-primary">70%</span> Off
      </>
    ),
    description: "Limited time offer on selected premium items. Don't miss out.",
    buttonText: "Shop Sale",
    buttonVariant: "primary",
    image: "/images/banners/flash.png",
    bgClass: "bg-[#FFE4DD]",
    tagClass: "text-primary",
  },
  {
    id: 2,
    tag: "New Collection",
    title: (
      <>
        Summer <br /> Essentials
      </>
    ),
    description: "Discover the latest products and trends curated for the season.",
    buttonText: "Explore Collection",
    buttonVariant: "outline",
    image: "/images/banners/collection.png",
    bgClass: "bg-[#E8EDEB]",
    tagClass: "text-[#1E5C4F]",
  },
  {
    id: 3,
    tag: "Tech Deals",
    title: (
      <>
        Upgrade <br /> Your Gear
      </>
    ),
    description: "Top-tier electronics and accessories at unbeatable prices.",
    buttonText: "Shop Tech",
    buttonVariant: "primary",
    image: "/images/banners/flash.png", // Reusing image for demo
    bgClass: "bg-[#F3F4F6]",
    tagClass: "text-gray-800",
  },
  {
    id: 4,
    tag: "Clearance",
    title: (
      <>
        Final <br /> Markdowns
      </>
    ),
    description: "Last chance to grab your favorites before they're gone forever.",
    buttonText: "View Offers",
    buttonVariant: "outline",
    image: "/images/banners/collection.png", // Reusing image for demo
    bgClass: "bg-[#FDF2F8]",
    tagClass: "text-pink-600",
  },
];

export function PromotionalBanners() {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      // If we've reached the end, scroll back to start, otherwise scroll right
      if (
        container.scrollLeft + container.clientWidth >=
        container.scrollWidth - 10
      ) {
        container.scrollTo({ left: 0, behavior: "smooth" });
      } else {
        // Scroll by the width of one item approximately
        const scrollAmount = window.innerWidth < 768 ? window.innerWidth * 0.85 : container.clientWidth / 2;
        container.scrollBy({ left: scrollAmount, behavior: "smooth" });
      }
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-background py-10 md:py-16">
      <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10">
        <div 
          ref={scrollRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0 gap-4 md:gap-8 pb-4 md:pb-0 scroll-smooth"
        >
          {BANNERS.map((banner) => (
            <div 
              key={banner.id}
              className={cn(
                "relative overflow-hidden rounded-[2rem] group focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2 shrink-0 snap-center w-[85vw] sm:w-[400px] md:w-[calc(50%-1rem)]",
                banner.bgClass
              )}
            >
              <div className={cn(
                "absolute inset-0 bg-gradient-to-r via-white/10 to-transparent z-10 w-[70%] pointer-events-none",
                `from-${banner.bgClass.replace('bg-', '')}` // Match gradient to bg
              )} style={{ background: `linear-gradient(to right, ${banner.bgClass.match(/\[(.*?)\]/)?.[1] || banner.bgClass}, transparent)` }} />
              
              <div className="relative z-20 flex flex-col items-start p-6 md:p-12 h-[280px] md:h-full justify-center max-w-sm">
                <span className={cn("font-bold text-[10px] tracking-widest uppercase mb-4 bg-white/70 px-3 py-1.5 rounded-full shadow-sm", banner.tagClass)}>
                  {banner.tag}
                </span>
                <h3 className="font-heading text-3xl md:text-[2.5rem] font-bold text-foreground leading-[1.1] mb-3">
                  {banner.title}
                </h3>
                <p className="text-foreground/70 text-sm mb-6 md:mb-8 font-medium max-w-[220px] leading-relaxed line-clamp-2">
                  {banner.description}
                </p>
                <Link href="#" className="inline-block focus:outline-none mt-auto md:mt-0">
                  <Button 
                    variant={banner.buttonVariant as "primary" | "outline"} 
                    className={cn(
                      "gap-2 px-6 h-12 rounded-xl text-sm transition-all",
                      banner.buttonVariant === "default" 
                        ? "bg-foreground text-background hover:bg-black/80 shadow-md hover:shadow-lg"
                        : "bg-white border-transparent hover:border-black/10 shadow-sm hover:shadow-md"
                    )}
                  >
                    {banner.buttonText} 
                    {banner.buttonVariant === "default" && <ArrowRight className="w-4 h-4" />}
                  </Button>
                </Link>
              </div>
              
              {/* Visual */}
              <div className="absolute right-0 bottom-0 top-0 w-[55%] md:w-[60%] group-hover:scale-105 transition-transform duration-700 ease-out flex items-center justify-center overflow-hidden">
                 <Image 
                   src={banner.image} 
                   alt={banner.tag}
                   fill
                   className="object-cover object-left"
                   sizes="(max-width: 768px) 50vw, 33vw"
                 />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
