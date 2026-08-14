import { generateAccessToken } from "../src/utils/jwt";
import { config, validateEnv } from "../src/config/env";
import mongoose from "mongoose";

const PORT = config.PORT || 5000;
const SERVER_URL = `http://localhost:${PORT}`;

const testPhase26 = async () => {
  validateEnv();

  console.log("--- Testing Phase 26 ---");
  
  await mongoose.connect(config.MONGODB_URI as string);
  const { User } = await import("../src/models/User");
  const { HomepageSection } = await import("../src/models/HomepageSection");
  
  const admin = await User.create({ fullName: "Phase26 Admin", email: "p26admin@test.com", passwordHash: "x", role: "Admin", status: "Active" });
  const aToken = generateAccessToken({ userId: admin.id, role: "Admin" });

  let testsPassed = 0;
  let testsFailed = 0;
  const runTest = (name: string, p: Promise<boolean>) => {
    return p
      .then((res) => {
        if (res) {
          console.log(`✅ ${name}`);
          testsPassed++;
        } else {
          console.log(`❌ ${name}`);
          testsFailed++;
        }
      })
      .catch((err) => {
        console.log(`❌ ${name} (Error: ${err.message})`);
        testsFailed++;
      });
  };

  const authHeaders = { "Authorization": `Bearer ${aToken}`, "Content-Type": "application/json" };

  // 1. Get Public Homepage
  await runTest("GET /api/v1/homepage", fetch(`${SERVER_URL}/api/v1/homepage`).then(r => r.json()).then(d => d.success && Array.isArray(d.data)));

  // 2. Get Admin Homepage (unauthenticated should fail)
  await runTest("GET /api/v1/admin/homepage (Unauth)", fetch(`${SERVER_URL}/api/v1/admin/homepage`).then(r => r.status === 401));

  // 3. Get Admin Homepage (authenticated)
  await runTest("GET /api/v1/admin/homepage (Auth)", fetch(`${SERVER_URL}/api/v1/admin/homepage`, { headers: authHeaders }).then(r => r.json()).then(d => d.success && Array.isArray(d.data)));

  // 4. Create Section
  let sectionId = "";
  const secKey = `test-sec-${Date.now()}`;
  await runTest("POST /api/v1/admin/homepage", fetch(`${SERVER_URL}/api/v1/admin/homepage`, {
    method: "POST", headers: authHeaders, body: JSON.stringify({ sectionKey: secKey, type: "banner", order: 99 })
  }).then(r => r.json()).then(d => {
    sectionId = d.data?._id;
    return d.success && !!sectionId;
  }));

  // 5. Update Section
  await runTest("PUT /api/v1/admin/homepage/:id", fetch(`${SERVER_URL}/api/v1/admin/homepage/${sectionId}`, {
    method: "PUT", headers: authHeaders, body: JSON.stringify({ title: "Updated Title" })
  }).then(r => r.json()).then(d => d.success && d.data.title === "Updated Title"));

  // 6. Delete Protected Section
  const protectedSection = await HomepageSection.findOne({ isProtected: true });
  if (protectedSection) {
    await runTest("DELETE Protected Section -> 409", fetch(`${SERVER_URL}/api/v1/admin/homepage/${protectedSection._id}`, {
      method: "DELETE", headers: authHeaders
    }).then(r => r.status === 409));
  } else {
    console.log("⚠️ No protected section found to test deletion protection");
  }

  // 7. Delete Normal Section
  await runTest("DELETE Normal Section -> 200", fetch(`${SERVER_URL}/api/v1/admin/homepage/${sectionId}`, {
    method: "DELETE", headers: authHeaders
  }).then(r => r.status === 200));

  // 8. Reorder Sections
  const sec1 = await HomepageSection.create({ sectionKey: "reorder1", type: "banner", order: 10, isProtected: false });
  const sec2 = await HomepageSection.create({ sectionKey: "reorder2", type: "banner", order: 20, isProtected: false });
  
  await runTest("PUT /api/v1/admin/homepage (Reorder)", fetch(`${SERVER_URL}/api/v1/admin/homepage`, {
    method: "PUT", headers: authHeaders, body: JSON.stringify({
      sections: [
        { id: sec1._id.toString(), order: 2 },
        { id: sec2._id.toString(), order: 1 }
      ]
    })
  }).then(r => r.status === 200));
  
  // Clean up
  await HomepageSection.deleteMany({ sectionKey: { $in: ["reorder1", "reorder2"] } });

  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);

  // Cleanup Admin user
  await User.deleteOne({ email: "p26admin@test.com" });
  await mongoose.disconnect();
  
  if (testsFailed > 0) process.exit(1);
  process.exit(0);
};

testPhase26();
