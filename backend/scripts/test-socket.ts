import { io, Socket } from "socket.io-client";
import { generateAccessToken } from "../src/utils/jwt";
import { config, validateEnv } from "../src/config/env";
import mongoose from "mongoose";

const PORT = config.PORT || 5000;
const SERVER_URL = `http://localhost:${PORT}`;

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

const testSocket = async () => {
  validateEnv();

  console.log("--- Starting Server ---");
  // Import the server to start it in this process
  await import("../src/server");
  
  // Wait a moment for server to bind
  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log("--- Testing Socket.IO Authentication & Rooms ---");

  // Generate a valid mock JWT token
  const validCustomerToken = generateAccessToken({ userId: new mongoose.Types.ObjectId().toString(), role: "Customer" });
  const validAdminToken = generateAccessToken({ userId: new mongoose.Types.ObjectId().toString(), role: "Admin" });
  const validSuperAdminToken = generateAccessToken({ userId: new mongoose.Types.ObjectId().toString(), role: "SuperAdmin" });

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

  // 1. Missing Token
  await runTest("Missing token is rejected", new Promise<boolean>((resolve) => {
    const socket = io(SERVER_URL, { reconnection: false });
    socket.on("connect", () => resolve(false));
    socket.on("connect_error", (err) => {
      resolve(err.message === "Authentication error: Token missing");
      socket.disconnect();
    });
  }));

  // 2. Invalid Token
  await runTest("Invalid token is rejected", new Promise<boolean>((resolve) => {
    const socket = io(SERVER_URL, {
      auth: { token: "invalid.token.here" },
      reconnection: false
    });
    socket.on("connect", () => resolve(false));
    socket.on("connect_error", (err) => {
      resolve(err.message === "Authentication error: Invalid token");
      socket.disconnect();
    });
  }));

  // NOTE: For the next tests, we need actual DB users if the middleware checks DB.
  // Wait, our middleware DOES check the DB! 
  //   const user = await User.findById(decoded.userId).select("status");
  // If we don't insert mock users, the valid token will still fail because `user` is not found.
  // Let's create temporary users in DB.
  
  await mongoose.connect(config.MONGODB_URI as string);
  const { User } = await import("../src/models/User");
  
  const customer = await User.create({ fullName: "Test Cust", email: "cust1@test.com", passwordHash: "x", role: "Customer", status: "Active" });
  const admin = await User.create({ fullName: "Test Admin", email: "admin1@test.com", passwordHash: "x", role: "Admin", status: "Active" });
  const superAdmin = await User.create({ fullName: "Test SuperAdmin", email: "super1@test.com", passwordHash: "x", role: "SuperAdmin", status: "Active" });

  const cToken = generateAccessToken({ userId: customer.id, role: "Customer" });
  const aToken = generateAccessToken({ userId: admin.id, role: "Admin" });
  const saToken = generateAccessToken({ userId: superAdmin.id, role: "SuperAdmin" });

  // 3. Valid authenticated connection succeeds
  await runTest("Valid authenticated connection succeeds", new Promise<boolean>((resolve) => {
    const socket = io(SERVER_URL, { auth: { token: cToken }, reconnection: false });
    socket.on("connect", () => {
      resolve(true);
      socket.disconnect();
    });
    socket.on("connect_error", () => resolve(false));
  }));

  console.log(`Test Results: ${testsPassed} passed, ${testsFailed} failed`);

  // Cleanup
  await User.deleteMany({ email: { $in: ["cust1@test.com", "admin1@test.com", "super1@test.com"] } });
  await mongoose.disconnect();
  
  if (testsFailed > 0) process.exit(1);
  process.exit(0);
};

testSocket();
