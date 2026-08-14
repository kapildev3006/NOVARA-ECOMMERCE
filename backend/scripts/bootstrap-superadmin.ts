import mongoose from "mongoose";
import { config, validateEnv } from "../src/config/env";
import { User } from "../src/models/User";
import { hashPassword } from "../src/utils/password";
import * as readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query: string): Promise<string> => {
  return new Promise((resolve) => rl.question(query, resolve));
};

const bootstrapSuperAdmin = async () => {
  validateEnv();

  try {
    await mongoose.connect(config.MONGODB_URI as string);
    console.log("Connected to MongoDB.");

    const existingSuperAdmin = await User.findOne({ role: "SuperAdmin" });
    if (existingSuperAdmin) {
      console.log("A SuperAdmin already exists in the database. Aborting bootstrap.");
      process.exit(0);
    }

    console.log("--- SuperAdmin Bootstrap ---");
    const fullName = await question("Enter full name: ");
    const email = await question("Enter email: ");
    const password = await question("Enter password (min 8 chars): ");

    if (password.length < 8) {
      console.error("Password must be at least 8 characters.");
      process.exit(1);
    }

    const hashedPassword = await hashPassword(password);

    await User.create({
      fullName,
      email,
      passwordHash: hashedPassword,
      role: "SuperAdmin",
      status: "Active",
    });

    console.log("Successfully created SuperAdmin user.");
    process.exit(0);
  } catch (error) {
    console.error("Bootstrap failed:", error);
    process.exit(1);
  }
};

bootstrapSuperAdmin();
