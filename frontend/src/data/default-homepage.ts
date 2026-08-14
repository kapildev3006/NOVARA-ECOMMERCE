import { HomepageSection } from "@/types/homepage";

export const defaultHomepageSections: HomepageSection[] = [
  {
    id: "announcement",
    type: "announcement",
    enabled: true,
    order: 0,
    isProtected: false,
    config: {
      text: "Free shipping on orders over $50",
    }
  },
  {
    id: "hero",
    type: "hero",
    enabled: true,
    order: 1,
    isProtected: true, // required
  },
  {
    id: "service-bar",
    type: "service-bar",
    enabled: true,
    order: 2,
    isProtected: true, // required
  },
  {
    id: "categories",
    type: "categories",
    enabled: true,
    order: 3,
    isProtected: false,
  },
  {
    id: "carousel-deals",
    type: "product-carousel",
    title: "Deals of the Day",
    enabled: true,
    order: 4,
    isProtected: false,
    config: {
      collection: "deals"
    }
  },
  {
    id: "carousel-arrivals",
    type: "product-carousel",
    title: "New Arrivals",
    enabled: true,
    order: 5,
    isProtected: false,
    config: {
      collection: "new"
    }
  },
  {
    id: "carousel-bestsellers",
    type: "product-carousel",
    title: "Best Sellers",
    enabled: true,
    order: 6,
    isProtected: false,
    config: {
      collection: "bestsellers"
    }
  },
  {
    id: "promo-banner",
    type: "promo-banner",
    enabled: true,
    order: 7,
    isProtected: false,
  }
];
