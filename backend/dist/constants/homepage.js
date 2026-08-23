"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CANONICAL_HOMEPAGE_SECTIONS = void 0;
exports.CANONICAL_HOMEPAGE_SECTIONS = [
    {
        sectionKey: "announcement",
        type: "announcement",
        enabled: true,
        order: 0,
        isProtected: true,
        config: {
            text: "Free shipping on orders over $50",
        },
    },
    {
        sectionKey: "hero",
        type: "hero",
        enabled: true,
        order: 1,
        isProtected: true,
    },
    {
        sectionKey: "service-bar",
        type: "service-bar",
        enabled: true,
        order: 2,
        isProtected: true,
    },
    {
        sectionKey: "categories",
        type: "categories",
        enabled: true,
        order: 3,
        isProtected: true,
    },
    {
        sectionKey: "carousel-deals",
        type: "product-carousel",
        title: "Deals of the Day",
        enabled: true,
        order: 4,
        isProtected: true,
        config: {
            collection: "deals",
        },
    },
    {
        sectionKey: "carousel-arrivals",
        type: "product-carousel",
        title: "New Arrivals",
        enabled: true,
        order: 5,
        isProtected: true,
        config: {
            collection: "new",
        },
    },
    {
        sectionKey: "carousel-bestsellers",
        type: "product-carousel",
        title: "Best Sellers",
        enabled: true,
        order: 6,
        isProtected: true,
        config: {
            collection: "bestsellers",
        },
    },
    {
        sectionKey: "promo-banner",
        type: "promo-banner",
        enabled: true,
        order: 7,
        isProtected: true,
    },
];
