import { UploadedImage } from "@/types/media";

export type HomepageSectionType = 
  | "announcement"
  | "hero"
  | "service-bar"
  | "categories"
  | "product-carousel"
  | "promo-banner"
  | "custom";

export type ProductCarouselConfig = {
  source: "deals" | "new-arrivals" | "best-sellers" | "manual";
  productIds?: string[];
};

export interface CustomSectionConfig {
  layout: "image-left" | "image-right" | "full-width-banner";
  title?: string;
  subtitle?: string;
  description?: string;
  image?: UploadedImage;
  buttonText?: string;
  buttonLink?: string;
  backgroundColor?: string;
  textColor?: string;
  textAlign?: "left" | "center";
  productIds?: string[];
  categoryIds?: string[];
}

export interface HomepageSection {
  _id?: string;
  id: string;
  type: HomepageSectionType;
  title?: string;
  subtitle?: string;
  enabled: boolean;
  order: number;
  isProtected?: boolean; // If true, cannot be removed (e.g. Hero, Service Bar)
  config?: ProductCarouselConfig | CustomSectionConfig | Record<string, unknown>;
}
