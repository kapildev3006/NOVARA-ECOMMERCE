import { config, validateEnv } from "../src/config/env";
import mongoose from "mongoose";

const PORT = config.PORT || 5000;
const SERVER_URL = `http://localhost:${PORT}`;

const testPhase27 = async () => {
  validateEnv();
  console.log("--- Testing Phase 27 ---");
  
  await mongoose.connect(config.MONGODB_URI as string);
  const { HomepageSection } = await import("../src/models/HomepageSection");
  const { seedHomepage } = await import("./seed-homepage");

  let testsPassed = 0;
  let testsFailed = 0;
  
  const runTest = (name: string, success: boolean) => {
    if (success) {
      console.log(`✅ ${name}`);
      testsPassed++;
    } else {
      console.log(`❌ ${name}`);
      testsFailed++;
    }
  };

  // Setup: Clean existing seeded sections just for testing initial seed
  await HomepageSection.deleteMany({});

  // --- Test 1: Initial Seed ---
  await seedHomepage();
  const initialSections = await HomepageSection.find();
  
  runTest("Initial Seed creates 8 sections", initialSections.length === 8);
  runTest("Predefined sections are protected", initialSections.every(s => s.isProtected === true));
  
  // --- Test 2: Idempotency ---
  await seedHomepage();
  const duplicateCheck = await HomepageSection.find();
  runTest("Idempotency: No duplicates created", duplicateCheck.length === 8);

  // --- Test 3: Custom Section Preservation ---
  await HomepageSection.create({ sectionKey: "custom-test-sale", type: "banner", order: 99, isProtected: false });
  await seedHomepage();
  const customSectionCheck = await HomepageSection.findOne({ sectionKey: "custom-test-sale" });
  runTest("Custom section preserved", !!customSectionCheck);

  // --- Test 4: Ordering (Public API Verification) ---
  try {
    const res = await fetch(`${SERVER_URL}/api/v1/homepage`).then(r => r.json());
    if (res.success && Array.isArray(res.data)) {
      const isSorted = res.data.every((val: any, i: number, arr: any[]) => !i || (val.order >= arr[i - 1].order));
      runTest("Public API returns sections in correct order", isSorted);
    } else {
      runTest("Public API returns sections in correct order", false);
    }
  } catch (err) {
    console.error("Public API Ordering test failed to fetch. Make sure backend is running.");
    runTest("Public API returns sections in correct order", false);
  }

  // --- Test 5: Protected Sections (API deletion validation) ---
  // To avoid needing auth headers in this isolated test, we can just verify the flag. 
  // Phase 26 test already verifies actual 409 deletion behavior.
  runTest("Protected Sections flag verified", duplicateCheck.every(s => ["announcement", "hero", "service-bar", "categories", "carousel-deals", "carousel-arrivals", "carousel-bestsellers", "promo-banner"].includes(s.sectionKey as string) ? s.isProtected : true));

  // --- Test 6: State Preservation (Admin operational fields) ---
  await HomepageSection.updateOne({ sectionKey: "hero" }, { $set: { enabled: false, title: "Operational Override" } });
  await seedHomepage();
  const heroCheck = await HomepageSection.findOne({ sectionKey: "hero" });
  runTest("State Preservation (Admin changes not overwritten)", heroCheck?.enabled === false && heroCheck?.title === "Operational Override");
  
  // Cleanup
  await HomepageSection.deleteOne({ sectionKey: "custom-test-sale" });
  await mongoose.disconnect();
  
  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);
  if (testsFailed > 0) process.exit(1);
  process.exit(0);
};

testPhase27();
