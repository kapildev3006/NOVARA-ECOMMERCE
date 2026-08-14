import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.join(__dirname, "../.env") });

import mongoose from "mongoose";
import { config } from "../src/config/env";
import { HomepageSection } from "../src/models/HomepageSection";
import { HomepageAuditLog } from "../src/models/HomepageAuditLog";
import { getSocket } from "../src/realtime/socket";
import http from "http";
import app from "../src/app";

const PORT = 5055;
const baseUrl = `http://localhost:${PORT}/api/v1`;

import { generateAccessToken } from "../src/utils/jwt";

let server: http.Server;
let adminToken = "";
let normalUserToken = "";
let adminId = "";

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function setup() {
  await mongoose.connect(config.MONGODB_URI as string);
  server = http.createServer(app);
  server.listen(PORT);

  // Clear relevant collections
  // Mock user models so auth middleware passes
  const { User } = await import("../src/models/User");
  await User.deleteMany({});
  
  const admin = await User.create({ fullName: "Admin", email: "admin@novara.com", passwordHash: "x", role: "Admin", status: "Active" });
  adminId = admin._id.toString();
  adminToken = generateAccessToken({ userId: adminId, role: "Admin" });

  const customer = await User.create({ fullName: "User", email: "user@novara.com", passwordHash: "x", role: "Customer", status: "Active" });
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

  try {
    console.log("--- Testing Phase 31 (Audit Log) ---");

    // 1. Create section -> should audit
    const createRes = await fetch(`${baseUrl}/admin/homepage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ sectionKey: "audit_test", type: "Hero", title: "Original Title", order: 1 }),
    });
    const created = await createRes.json();
    const sectionId = created.data._id;
    
    await wait(100); // let async audit log flush
    
    const audit1 = await HomepageAuditLog.findOne({ action: "CREATE", sectionId });
    assert(!!audit1, "CREATE action audited");

    // 2. Update section -> should audit
    await fetch(`${baseUrl}/admin/homepage/${sectionId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ title: "Updated Title" }),
    });

    await wait(100);
    const audit2 = await HomepageAuditLog.findOne({ action: "UPDATE", sectionId });
    assert(!!audit2, "UPDATE action audited");
    assert(audit2?.changes?.title?.to === "Updated Title", "UPDATE captured changes accurately");

    // 3. Reorder -> should audit
    await fetch(`${baseUrl}/admin/homepage`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ sections: [{ id: sectionId, order: 2 }] }),
    });

    await wait(100);
    const audit3 = await HomepageAuditLog.findOne({ action: "REORDER" });
    assert(!!audit3, "REORDER action audited");

    // 4. Delete section -> should audit
    await fetch(`${baseUrl}/admin/homepage/${sectionId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    await wait(100);
    const audit4 = await HomepageAuditLog.findOne({ action: "DELETE", sectionId });
    assert(!!audit4, "DELETE action audited");

    // 5. Failed delete -> should not audit
    // Create protected section manually
    const protSec = await HomepageSection.create({ sectionKey: "prot1", type: "Hero", order: 5, isProtected: true });
    await fetch(`${baseUrl}/admin/homepage/${protSec._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await wait(100);
    const audit5 = await HomepageAuditLog.findOne({ action: "DELETE", sectionId: protSec._id });
    assert(!audit5, "Failed DELETE (protected) does not emit audit");

    // 6. Audit API Permissions
    const apiUnauth = await fetch(`${baseUrl}/admin/homepage/audit`);
    assert(apiUnauth.status === 401, "Audit API requires auth");
    
    const apiUser = await fetch(`${baseUrl}/admin/homepage/audit`, {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    assert(apiUser.status === 403, "Audit API requires Admin role");

    // 7. Audit API functionality
    const apiAdmin = await fetch(`${baseUrl}/admin/homepage/audit?limit=2&page=1`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    assert(apiAdmin.status === 200, "Audit API accessible by Admin");
    const adminData = await apiAdmin.json();
    assert(adminData.data.items.length === 2, "Audit API pagination works");
    assert(adminData.data.pagination.total >= 4, "Audit API returns metadata");

    console.log(`Test Results: ${passed} passed, ${failed} failed\n`);
    if (failed > 0) process.exit(1);
  } catch (error) {
    console.error("Test execution failed:", error);
    process.exit(1);
  }
}

async function main() {
  await setup();
  await runTests();
  await teardown();
}

main();
