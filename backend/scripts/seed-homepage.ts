import mongoose from "mongoose";
import { config, validateEnv } from "../src/config/env";
import { HomepageSection } from "../src/models/HomepageSection";
import { HomepageRevision } from "../src/models/HomepageRevision";

// Independent canonical backend seed data
const predefinedHomepageSections = [
  {
    sectionKey: "announcement",
    type: "announcement",
    enabled: true,
    order: 0,
    isProtected: true, // As per prompt, all predefined/core sections must be marked isProtected: true
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

export const seedHomepage = async () => {
  console.log("Seeding homepage sections...");

  const bulkOps = predefinedHomepageSections.map((section) => ({
    updateOne: {
      filter: { sectionKey: section.sectionKey },
      update: {
        $set: {
          sectionKey: section.sectionKey,
          type: section.type,
          isProtected: section.isProtected,
        },
        $setOnInsert: {
          title: section.title,
          enabled: section.enabled,
          order: section.order,
          config: section.config || {},
        },
      },
      upsert: true,
    },
  }));

  const result = await HomepageSection.bulkWrite(bulkOps);
  
  // Notice: result.upsertedCount reflects newly inserted sections
  // Modified count or matched count reflects existing sections
  console.log(`✓ Seeded/Verified ${predefinedHomepageSections.length} predefined homepage sections.`);

  // Initialize or update the Draft Revision
  const liveSections = await HomepageSection.find().sort({ order: 1 }).lean();
  let draftRevision = await HomepageRevision.findOne({ status: "draft" });
  if (!draftRevision) {
    const lastRev = await HomepageRevision.findOne().sort({ revisionId: -1 });
    const nextRevId = lastRev ? lastRev.revisionId + 1 : 1;
    await HomepageRevision.create({
      revisionId: nextRevId,
      status: "draft",
      sections: liveSections
    });
    console.log(`✓ Initialized draft revision #${nextRevId}`);
  } else {
    // Sync the draft revision with the live seed if needed
    // The prompt says "seed script will be strictly responsible for establishing the baseline draft."
    // If a draft already exists, we overwrite its sections with the live sections to ensure baseline consistency.
    draftRevision.sections = liveSections as any;
    await draftRevision.save();
    console.log(`✓ Synced draft revision #${draftRevision.revisionId} with seed`);
  }
};

// If this script is run directly, execute it
if (require.main === module) {
  const run = async () => {
    try {
      validateEnv();
      await mongoose.connect(config.MONGODB_URI as string);
      console.log("Connected to MongoDB for homepage seeding...");
      
      await seedHomepage();
      
      console.log("Homepage seeding completed successfully.");
      process.exit(0);
    } catch (error) {
      console.error("Homepage seeding failed:", error);
      process.exit(1);
    }
  };
  run();
}
