import { generateAccessToken } from "../src/utils/jwt";
import { config, validateEnv } from "../src/config/env";
import mongoose from "mongoose";

const PORT = config.PORT || 5000;
const SERVER_URL = `http://localhost:${PORT}`;

const testPhase25 = async () => {
  validateEnv();

  console.log("--- Starting Server ---");
  await import("../src/server");
  
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("--- Testing Phase 25 ---");
  
  await mongoose.connect(config.MONGODB_URI as string);
  const { User } = await import("../src/models/User");
  
  const admin = await User.create({ fullName: "Phase25 Admin", email: "p25admin@test.com", passwordHash: "x", role: "Admin", status: "Active" });
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

  // 1. Get Public Categories
  await runTest("GET /api/v1/categories", fetch(`${SERVER_URL}/api/v1/categories`).then(r => r.json()).then(d => d.success && Array.isArray(d.data.items)));

  // 2. Create Category
  let categoryId = "";
  const catSlug = `test-cat-${Date.now()}`;
  await runTest("POST /api/v1/admin/categories", fetch(`${SERVER_URL}/api/v1/admin/categories`, {
    method: "POST", headers: authHeaders, body: JSON.stringify({ name: "Test Cat", slug: catSlug, image: { url: "abc" } })
  }).then(r => r.json()).then(d => {
    categoryId = d.data?._id;
    return d.success && !!categoryId;
  }));

  // 3. Duplicate Category Slug
  await runTest("Category duplicate slug -> 409", fetch(`${SERVER_URL}/api/v1/admin/categories`, {
    method: "POST", headers: authHeaders, body: JSON.stringify({ name: "Test Cat 2", slug: catSlug, image: { url: "abc" } })
  }).then(r => r.status === 409));

  // 4. Create Product
  let productId = "";
  const prodSlug = `test-prod-${Date.now()}`;
  await runTest("POST /api/v1/admin/products", fetch(`${SERVER_URL}/api/v1/admin/products`, {
    method: "POST", headers: authHeaders, body: JSON.stringify({ 
      name: "Test Prod", slug: prodSlug, description: "Desc", category: categoryId, price: 10, originalPrice: 15, image: { url: "abc" } 
    })
  }).then(async r => {
    const d = await r.json();
    if (!d.success) console.log("POST PRODUCT ERROR:", d);
    productId = d.data?._id;
    return d.success && !!productId;
  }));

  // 5. Category Deletion Protection (Since product exists)
  await runTest("DELETE Category with Product -> 409", fetch(`${SERVER_URL}/api/v1/admin/categories/${categoryId}`, {
    method: "DELETE", headers: authHeaders
  }).then(r => r.status === 409));

  // 6. Update Product Stock
  await runTest("PATCH Product Stock", fetch(`${SERVER_URL}/api/v1/admin/products/${productId}/stock`, {
    method: "PATCH", headers: authHeaders, body: JSON.stringify({ stock: 5 })
  }).then(r => r.json()).then(d => d.success && d.data.stock === 5));

  // 7. Get Public Products
  await runTest("GET /api/v1/products", fetch(`${SERVER_URL}/api/v1/products`).then(r => r.json()).then(d => d.success && Array.isArray(d.data.items)));

  // 8. Delete Product
  await runTest("DELETE Product", fetch(`${SERVER_URL}/api/v1/admin/products/${productId}`, {
    method: "DELETE", headers: authHeaders
  }).then(r => r.status === 200));

  // 9. Delete empty Category
  await runTest("DELETE Empty Category -> 200", fetch(`${SERVER_URL}/api/v1/admin/categories/${categoryId}`, {
    method: "DELETE", headers: authHeaders
  }).then(r => r.status === 200));

  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);

  // Cleanup
  await User.deleteOne({ email: "p25admin@test.com" });
  await mongoose.disconnect();
  
  if (testsFailed > 0) process.exit(1);
  process.exit(0);
};

testPhase25();
