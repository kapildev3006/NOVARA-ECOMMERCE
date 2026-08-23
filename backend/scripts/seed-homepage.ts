import mongoose from "mongoose";
import { config, validateEnv } from "../src/config/env";
import { HomepageSection } from "../src/models/HomepageSection";
import { HomepageRevision } from "../src/models/HomepageRevision";
import { Counter } from "../src/models/Counter";

import { CANONICAL_HOMEPAGE_SECTIONS } from "../src/constants/homepage";

const predefinedHomepageSections = CANONICAL_HOMEPAGE_SECTIONS;

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
    const maxRevisionId = lastRev ? lastRev.revisionId : 0;
    
    // Sync the counter sequence to the existing maximum (idempotent, using $max)
    await Counter.findByIdAndUpdate(
      "homepageRevision",
      { $max: { sequence: maxRevisionId } },
      { upsert: true }
    );
    
    const counter = await Counter.findByIdAndUpdate(
      "homepageRevision",
      { $inc: { sequence: 1 } },
      { new: true, upsert: true }
    );
    
    const nextRevId = counter.sequence;
    await HomepageRevision.create({
      revisionId: nextRevId,
      status: "draft",
      sections: liveSections
    });
    console.log(`✓ Initialized draft revision #${nextRevId}`);
  } else {
    // Sync the draft revision with the live seed if needed
    await HomepageRevision.updateOne(
      { _id: draftRevision._id },
      { $set: { sections: liveSections as any } }
    );
    console.log(`✓ Synced draft revision #${draftRevision.revisionId} with seed`);
    
    const lastRev = await HomepageRevision.findOne().sort({ revisionId: -1 });
    const maxRevisionId = lastRev ? lastRev.revisionId : 0;
    await Counter.findByIdAndUpdate(
      "homepageRevision",
      { $max: { sequence: maxRevisionId } },
      { upsert: true }
    );
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
