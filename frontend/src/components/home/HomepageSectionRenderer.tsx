import React, { useState, useEffect } from "react";
import { HomepageSection, ProductCarouselConfig } from "@/types/homepage";
import { HeroSection } from "@/components/home/HeroSection";
import { ServiceBar } from "@/components/home/ServiceBar";
import { ShopByCategory } from "@/components/home/ShopByCategory";
import { ProductCarousel } from "@/components/home/ProductCarousel";
import { PromotionalBanners } from "@/components/home/PromotionalBanners";
import { CustomHomepageSection } from "@/components/home/CustomHomepageSection";
import { AnnouncementBar } from "@/components/layout/AnnouncementBar";
import { mockProducts } from "@/data/products";
import { getAdminProducts } from "@/lib/admin-product-store";

interface HomepageSectionRendererProps {
  section: HomepageSection;
}

export function HomepageSectionRenderer({ section }: HomepageSectionRendererProps) {
  // Use state to fetch admin products on mount (client-safe)
  const [adminCatalog, setAdminCatalog] = useState(mockProducts);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAdminCatalog(getAdminProducts());
  }, []);

  // Data extraction logic for carousels
  const getProductsForCollection = (config?: ProductCarouselConfig) => {
    if (!config) return mockProducts.slice(0, 8); // fallback
    
    switch (config.source) {
      case "deals":
        return adminCatalog.filter(p => p.discount);
      case "new-arrivals":
        return adminCatalog.filter(p => p.badge === "New" || p.badge === "Trending");
      case "best-sellers":
        return adminCatalog.filter(p => p.rating > 4.7);
      case "manual":
        if (!config.productIds) return [];
        // Resolve IDs to actual products, filter out any missing ones
        return config.productIds
          .map(id => adminCatalog.find(p => p.id === id))
          .filter(p => p !== undefined);
      default: {
        // Handle old "collection" config key for backward compatibility
        const oldCollection = (config as Record<string, unknown>).collection as string | undefined;
        if (oldCollection === "deals") return adminCatalog.filter(p => p.discount);
        if (oldCollection === "new") return adminCatalog.filter(p => p.badge === "New" || p.badge === "Trending");
        if (oldCollection === "bestsellers") return adminCatalog.filter(p => p.rating > 4.7);
        return adminCatalog.slice(0, 8); // fallback
      }
    }
  };

  const padProducts = (list: typeof mockProducts, min: number) => {
    return list.length >= min ? list : [...list, ...mockProducts].slice(0, Math.max(min, list.length));
  };

  switch (section.type) {
    case "announcement":
      return <AnnouncementBar />;

    case "hero":
      return <HeroSection />;

    case "service-bar":
      return <ServiceBar />;

    case "categories":
      return <ShopByCategory />;

    case "product-carousel": {
      const config = section.config as ProductCarouselConfig | undefined;
      const rawProducts = getProductsForCollection(config);
      
      // If manual mode is active and we have 0 valid products, fallback gracefully
      if (config?.source === "manual" && rawProducts.length === 0) {
        return (
          <div className="py-12 border border-dashed border-[#e5e5e5] rounded-xl flex items-center justify-center m-4 lg:mx-20 text-gray-400 font-bold text-sm">
            {section.title || "Product Carousel"} (No products available)
          </div>
        );
      }

      // We only pad products if it's not a manual selection
      const products = config?.source === "manual" ? rawProducts : padProducts(rawProducts, 6);
      
      let actionHref = "/products";
      if (config?.source === "deals" || (config as Record<string, unknown> | undefined)?.collection === "deals") actionHref = "/products?sort=discount";
      if (config?.source === "new-arrivals" || (config as Record<string, unknown> | undefined)?.collection === "new") actionHref = "/products?sort=newest";
      if (config?.source === "best-sellers" || (config as Record<string, unknown> | undefined)?.collection === "bestsellers") actionHref = "/products?sort=rating";
      if (config?.source === "manual") actionHref = "/products"; // fallback link

      return (
        <ProductCarousel 
          title={section.title || "Products"}
          eyebrow={section.subtitle}
          products={products}
          actionLink={{ label: "View All", href: actionHref }}
        />
      );
    }

    case "promo-banner":
      return <PromotionalBanners />;

    case "custom":
      return <CustomHomepageSection section={section} />;

    default:
      return null;
  }
}
