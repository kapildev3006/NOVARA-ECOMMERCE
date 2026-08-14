import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env") });

import mongoose from "mongoose";
import { config } from "../src/config/env";
import { HomepageSection } from "../src/models/HomepageSection";
import { HomepageRevision } from "../src/models/HomepageRevision";
import { HomepageAuditLog } from "../src/models/HomepageAuditLog";
import http from "http";
import app from "../src/app";

const PORT = 5056;
const baseUrl = `http://localhost:${PORT}/api/v1`;

import { generateAccessToken } from "../src/utils/jwt";

let server: http.Server;
let adminToken = "";
let normalUserToken = "";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function setup() {
  await mongoose.connect(config.MONGODB_URI as string);
  server = http.createServer(app);
  server.listen(PORT);

  const { User } = await import("../src/models/User");
  await User.deleteMany({});
  
  const admin = await User.create({ fullName: "Admin", email: "admin2@novara.com", passwordHash: "x", role: "Admin", status: "Active" });
  adminToken = generateAccessToken({ userId: admin._id.toString(), role: "Admin" });

  const customer = await User.create({ fullName: "User", email: "user2@novara.com", passwordHash: "x", role: "Customer", status: "Active" });
  normalUserToken = generateAccessToken({ userId: customer._id.toString(), role: "Customer" });
}

async function teardown() {
  await mongoose.disconnect();
  server.close();
}

async function runTests() {
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, msg: string) => {
    if (condition) {
      console.log(`✅ ${msg}`);
      passed++;
    } else {
      console.error(`❌ ${msg}`);
      failed++;
    }
  };

  console.log("--- Testing Phase 32 (Draft, Preview & Publish) ---");

  // Setup initial draft (usually done by seed script)
  await HomepageRevision.deleteMany({});
  await HomepageSection.deleteMany({});
  
  const liveSec = await HomepageSection.create({ sectionKey: "live-hero", type: "Hero", order: 1 });
  
  await HomepageRevision.create({
    revisionId: 1,
    status: "draft",
    sections: [liveSec.toObject()]
  });

  // 1. Existing Published State (Public API should return live only)
  const publicRes = await fetch(`${baseUrl}/homepage`);
  const publicData = await publicRes.json();
  assert(publicData.data.length === 1 && publicData.data[0].sectionKey === "live-hero", "Public API returns published state only");

  // 2. Admin can edit draft
  const draftCreateRes = await fetch(`${baseUrl}/admin/homepage`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ sectionKey: "draft-banner", type: "Banner", order: 2 })
  });
  const draftCreateData = await draftCreateRes.json();
  assert(draftCreateData.success && draftCreateData.data.sectionKey === "draft-banner", "Admin can edit draft (create section)");

  // 3. Draft isolation
  const publicResAfterDraft = await fetch(`${baseUrl}/homepage`);
  const publicDataAfterDraft = await publicResAfterDraft.json();
  assert(publicDataAfterDraft.data.length === 1 && publicDataAfterDraft.data[0].sectionKey === "live-hero", "Draft state remains isolated from live homepage");

  // 4. Admin Preview is authenticated
  const unauthPreviewRes = await fetch(`${baseUrl}/admin/homepage/preview`);
  assert(unauthPreviewRes.status === 401, "Preview requires authentication");

  // 5. Admin can preview draft
  const authPreviewRes = await fetch(`${baseUrl}/admin/homepage/preview`, {
    headers: { "Authorization": `Bearer ${adminToken}` }
  });
  const authPreviewData = await authPreviewRes.json();
  assert(authPreviewData.success && authPreviewData.data.length === 2, "Admin can preview draft");

  // 6. Stale publish is rejected
  const stalePublishRes = await fetch(`${baseUrl}/admin/homepage/publish`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ revisionId: 999 })
  });
  assert(stalePublishRes.status === 409, "Stale publish is rejected");

  // 7. Publish
  await HomepageAuditLog.deleteMany({});
  const publishRes = await fetch(`${baseUrl}/admin/homepage/publish`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${adminToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ revisionId: 1 })
  });
  const publishData = await publishRes.json();
  assert(publishData.success && publishData.data.revisionId === 2, "Publish succeeds and increments revisionId");

  // 8. Public API returns new published state
  const publicResAfterPublish = await fetch(`${baseUrl}/homepage`);
  const publicDataAfterPublish = await publicResAfterPublish.json();
  assert(publicDataAfterPublish.data.length === 2 && publicDataAfterPublish.data.some((s: any) => s.sectionKey === "draft-banner"), "Publish atomically updates live homepage");

  // 9. Publish creates PUBLISH audit event
  const publishAudit = await HomepageAuditLog.findOne({ action: "PUBLISH" });
  assert(!!publishAudit, "Publish creates PUBLISH audit event");

  console.log(`Test Results: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);
}

setup().then(runTests).then(teardown).catch(err => {
  console.error("Fatal error:", err);
  process.exit(1);
});
