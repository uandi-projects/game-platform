#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import inquirer from "inquirer";
import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '../.env.local') });

// Check if the environment variable is loaded
const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
if (!convexUrl) {
  console.error("❌ Error: NEXT_PUBLIC_CONVEX_URL not found in .env.local");
  console.log("💡 Make sure .env.local exists and contains NEXT_PUBLIC_CONVEX_URL");
  process.exit(1);
}

console.log(`🔗 Using Convex deployment: ${convexUrl}`);
const client = new ConvexHttpClient(convexUrl);

async function createUser() {
  console.log("🚀 Convex User Creation CLI\n");

  try {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "email",
        message: "Enter user email:",
        validate: (input) => {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input)) {
            return "Please enter a valid email address";
          }
          return true;
        },
      },
      {
        type: "input",
        name: "name",
        message: "Enter user name (optional):",
        default: (answers) => answers.email.split("@")[0],
      },
      {
        type: "list",
        name: "role",
        message: "Select user role:",
        choices: [
          { name: "User (default)", value: "user" },
          { name: "Admin", value: "admin" },
        ],
        default: "user",
      },
      {
        type: "password",
        name: "password",
        message: "Enter password (min 8 characters):",
        mask: "*",
        validate: (input) => {
          if (input.length < 8) {
            return "Password must be at least 8 characters long";
          }
          return true;
        },
      },
      {
        type: "confirm",
        name: "confirm",
        message: (answers) =>
          `Create user with email "${answers.email}", role "${answers.role}"?`,
        default: true,
      },
    ]);

    if (!answers.confirm) {
      console.log("❌ User creation cancelled");
      return;
    }

    console.log("\n🔄 Creating user...");

    // Call the Convex mutation to create user
    const result = await client.mutation(api.users.createUserManually, {
      email: answers.email,
      name: answers.name,
      role: answers.role,
      password: answers.password,
    });

    console.log("✅ User profile created successfully!");
    console.log(`📧 Email: ${answers.email}`);
    console.log(`👤 Name: ${answers.name}`);
    console.log(`🔑 Role: ${answers.role}`);
    console.log(`🆔 User ID: ${result.userId}\n`);

    console.log("⚠️  IMPORTANT: Authentication credentials not set up yet!");
    console.log("💡 Next steps for the user:");
    console.log("   1. Go to /signin");
    console.log("   2. Click 'Forgot your password?'");
    console.log("   3. Enter their email to receive a password reset link");
    console.log("   4. Set up their password via the reset link\n");

    console.log("🔧 Alternative: Send them an invite from /admin page");
    console.log("   (This will overwrite their role with the invited role)");

  } catch (error) {
    console.error("❌ Error creating user:", error.message);

    if (error.message.includes("already exists")) {
      console.log("💡 Try with a different email address");
    }

    process.exit(1);
  }
}

// Run the CLI
createUser();