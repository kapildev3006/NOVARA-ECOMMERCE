"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { HomepageSection, CustomSectionConfig } from "@/types/homepage";
import { getAdminProducts } from "@/lib/admin-product-store";
import { getAdminCategories } from "@/lib/admin-category-store";
import { ProductCard } from "@/components/product/ProductCard";
import { CategoryCard } from "@/components/category/CategoryCard";
import { Product } from "@/types/product";
import { Category } from "@/types/category";

interface CustomHomepageSectionProps {
  section: HomepageSection;
}

export function CustomHomepageSection({ section }: CustomHomepageSectionProps) {
  const config = section.config as CustomSectionConfig | undefined;
  
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (config?.productIds && config.productIds.length > 0) {
      const allProducts = getAdminProducts();
      const resolved = config.productIds
        .map(id => allProducts.find(p => p.id === id))
        .filter((p): p is Product => p !== undefined);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProducts(resolved);
    } else {
      setProducts([]);
    }

    if (config?.categoryIds && config.categoryIds.length > 0) {
      const allCategories = getAdminCategories();
      const resolved = config.categoryIds
        .map(id => allCategories.find(c => c.id === id))
        .filter((c): c is Category => c !== undefined);
      setCategories(resolved);
    } else {
      setCategories([]);
    }
  }, [config?.productIds, config?.categoryIds]);

  if (!config) return null;

  const {
    layout = "image-left",
    title,
    subtitle,
    description,
    image,
    buttonText,
    buttonLink,
    backgroundColor = "#FAFAF8",
    textColor = "#161513",
    textAlign = "left",
  } = config;

  const hasContent = title || subtitle || description || buttonText;
  const hasProducts = products.length > 0;
  const hasCategories = categories.length > 0;
  
  const hasSelectedButMissingProducts = (config.productIds?.length || 0) > 0 && products.length === 0;
  const hasSelectedButMissingCategories = (config.categoryIds?.length || 0) > 0 && categories.length === 0;

  const renderContent = () => (
    <div className={`flex flex-col justify-center w-full max-w-xl mx-auto px-6 md:px-12 lg:px-0 py-12 ${textAlign === "center" ? "items-center text-center" : "items-start text-left"}`}>
      {subtitle && (
        <span className="text-sm md:text-base font-bold uppercase tracking-wider mb-3 opacity-80" style={{ color: textColor }}>
          {subtitle}
        </span>
      )}
      {title && (
        <h2 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-4 leading-tight" style={{ color: textColor }}>
          {title}
        </h2>
      )}
      {description && (
        <p className="text-base md:text-lg opacity-90 mb-8 max-w-lg" style={{ color: textColor }}>
          {description}
        </p>
      )}
      {buttonText && buttonLink && (
        <Link 
          href={buttonLink}
          className="inline-flex items-center justify-center px-8 py-4 text-sm font-bold uppercase tracking-wider rounded-full transition-transform hover:scale-105 active:scale-95"
          style={{ backgroundColor: textColor, color: backgroundColor }}
        >
          {buttonText}
        </Link>
      )}
    </div>
  );

  const renderImage = () => {
    if (!image?.url) {
      return (
        <div className="w-full h-full min-h-[300px] flex items-center justify-center bg-black/5">
          <span className="text-sm font-bold opacity-40">No Image Provided</span>
        </div>
      );
    }
    
    return (
      <div className="relative w-full h-full min-h-[300px] md:min-h-[400px]">
        <Image 
          src={image.url}
          alt={title || "Custom Section Image"}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
    );
  };

  const renderCollections = () => {
    if (!hasProducts && !hasCategories && !hasSelectedButMissingProducts && !hasSelectedButMissingCategories) return null;
    
    return (
      <div className="w-full bg-white py-10 md:py-16">
        <div className="mx-auto max-w-[1248px] px-4 md:px-8 lg:px-10">
          {hasCategories && (
            <div className="mb-12">
              <h3 className="font-heading font-bold text-2xl md:text-[32px] mb-6 md:mb-8 text-[#161513]">Featured Categories</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {categories.map(category => (
                  <CategoryCard key={category.id} category={category} />
                ))}
              </div>
            </div>
          )}

          {hasSelectedButMissingCategories && !hasCategories && (
            <div className="mb-12 p-8 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-sm">
              Selected categories are no longer available.
            </div>
          )}

          {hasProducts && (
            <div>
              <h3 className="font-heading font-bold text-2xl md:text-[32px] mb-6 md:mb-8 text-[#161513]">Featured Products</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-8 md:gap-x-6 md:gap-y-10">
                {products.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          )}

          {hasSelectedButMissingProducts && !hasProducts && (
            <div className="p-8 border border-dashed border-gray-200 rounded-2xl flex items-center justify-center text-gray-400 font-bold text-sm">
              Selected products are no longer available.
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="w-full flex flex-col">
      <div className="w-full" style={{ backgroundColor }}>
        {layout === "image-left" && (
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
            <div className="order-1 md:order-1 h-64 md:h-auto">
              {renderImage()}
            </div>
            <div className="order-2 md:order-2 flex items-center">
              {hasContent && renderContent()}
            </div>
          </div>
        )}

        {layout === "image-right" && (
          <div className="grid grid-cols-1 md:grid-cols-2 min-h-[400px]">
            <div className="order-2 md:order-1 flex items-center">
              {hasContent && renderContent()}
            </div>
            <div className="order-1 md:order-2 h-64 md:h-auto">
              {renderImage()}
            </div>
          </div>
        )}

        {layout === "full-width-banner" && (
          <div className="relative w-full min-h-[500px] flex items-center justify-center overflow-hidden">
            {image?.url && (
              <Image 
                src={image.url}
                alt={title || "Custom Section Banner"}
                fill
                className="object-cover absolute inset-0 z-0"
                sizes="100vw"
                priority
              />
            )}
            {/* Overlay for readability if image exists */}
            {image?.url && <div className="absolute inset-0 bg-black/30 z-10" />}
            
            <div className="relative z-20 w-full max-w-[1248px] mx-auto px-4 md:px-8 lg:px-10 py-16">
              {hasContent && renderContent()}
            </div>
          </div>
        )}
      </div>

      {renderCollections()}
    </section>
  );
}
