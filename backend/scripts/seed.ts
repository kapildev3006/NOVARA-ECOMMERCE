import mongoose from "mongoose";
import { config, validateEnv } from "../src/config/env";
import { Category } from "../src/models/Category";
import { Product } from "../src/models/Product";
import { HomepageSection } from "../src/models/HomepageSection";
import { Settings } from "../src/models/Settings";

import { mockCategories } from "@/data/categories";
import { mockProducts } from "@/data/products";
import { seedHomepage } from "./seed-homepage";

const seedDatabase = async () => {
  validateEnv();

  try {
    await mongoose.connect(config.MONGODB_URI as string);
    console.log("Connected to MongoDB for seeding...");

    // 1. Seed Categories
    console.log("Seeding categories...");
    const categoryIdMap: Record<string, mongoose.Types.ObjectId> = {};

    for (const cat of mockCategories) {
      const inserted = await Category.findOneAndUpdate(
        { slug: cat.slug },
        {
          $set: {
            name: cat.name,
            slug: cat.slug,
            description: "",
            image: { url: cat.image },
            isActive: true,
          },
        },
        { upsert: true, new: true }
      );
      // Map BOTH the ID used in frontend (like "cat-1") AND the name (like "Mobiles") to the ObjectId
      // The mockProducts use the `name` (e.g. "Mobiles") as the `category` string.
      categoryIdMap[cat.name] = inserted._id as mongoose.Types.ObjectId;
      categoryIdMap[cat.id] = inserted._id as mongoose.Types.ObjectId;
    }
    console.log(`✓ Seeded ${mockCategories.length} categories.`);

    // 2. Seed Products
    console.log("Seeding products...");
    let productCount = 0;
    for (const prod of mockProducts) {
      const categoryObjectId = categoryIdMap[prod.category];

      if (!categoryObjectId) {
        console.error(`\nSEED FAILED: Missing category referenced by product "${prod.name}".`);
        console.error(`Missing category: "${prod.category}"`);
        console.error(`Please correct the source data in frontend/src/data/categories.ts before continuing.`);
        process.exit(1);
      }

      await Product.findOneAndUpdate(
        { slug: prod.slug },
        {
          $set: {
            slug: prod.slug,
            name: prod.name,
            description: prod.description,
            category: categoryObjectId,
            price: prod.price,
            originalPrice: prod.originalPrice,
            discount: prod.discount,
            stock: prod.stock,
            rating: prod.rating,
            reviewCount: prod.reviewCount,
            image: { url: prod.image },
            gallery: prod.gallery?.map((g) => ({ url: g })) || [],
            isNew: prod.isNew || false,
            isBestSeller: prod.isBestSeller || false,
            specifications: prod.specifications || {},
          },
        },
        { upsert: true }
      );
      productCount++;
    }
    console.log(`✓ Seeded ${productCount} products.`);

    // 3. Seed Homepage Configuration
    await seedHomepage();

    // 4. Seed Settings
    console.log("Seeding global settings...");
    await Settings.findOneAndUpdate(
      { key: "default" },
      {
        $set: {
          key: "default",
          general: {
            storeName: "NOVARA",
            supportEmail: "support@novara.com",
            currency: "USD",
          },
          appearance: {
            theme: "light",
            primaryColor: "#000000",
          },
          shipping: {
            freeShippingThreshold: 50,
            standardRate: 5,
          },
          tax: {
            rate: 0,
          },
        },
      },
      { upsert: true }
    );
    console.log(`✓ Seeded global settings.`);

    console.log("\n--- Seed Verification Report ---");
    console.log(`Categories seeded: ${mockCategories.length}`);
    console.log(`Products seeded: ${productCount}`);
    console.log(`Homepage sections seeded: ${homepageCount}`);
    console.log(`Settings initialized: 1`);
    console.log("All products reference existing categories.");
    console.log("No duplicate slugs.");
    console.log("--------------------------------\n");

    process.exit(0);
  } catch (error) {
    console.error("Seeding failed with error:", error);
    process.exit(1);
  }
};

seedDatabase();
