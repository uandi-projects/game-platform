#!/usr/bin/env node

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { config } from "dotenv";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import inquirer from 'inquirer';

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

async function createBootstrapInvite() {
  console.log("🚀 Bootstrap Admin Invite Creator\n");

  try {
    // First check if there are any existing users
    console.log("🔍 Checking existing users...");
    const users = await client.query(api.users.getAllUsers);

    if (users && users.length > 0) {
      console.log("👥 Found existing users:");
      users.forEach(user => {
        console.log(`   - ${user.email || 'No email'} (${user.role || 'No role'}) [ID: ${user._id}]`);
      });

      const admins = users.filter(user => user.role === 'admin');
      if (admins.length > 0) {
        console.log("\n⚠️  Admin user(s) already exist. Use regular invite flow.");
        return;
      }
    } else {
      console.log("   No existing users found.");
    }

    // Collect user information via CLI prompts
    console.log("\n📝 Please provide the following information:");

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Full name for the user:',
        validate: (input) => {
          if (!input || input.trim().length < 2) {
            return 'Please enter a valid name (at least 2 characters)';
          }
          return true;
        }
      },
      {
        type: 'input',
        name: 'email',
        message: 'Email address for the admin user:',
        validate: (input) => {
          if (!input || !input.includes('@')) {
            return 'Please enter a valid email address';
          }
          return true;
        }
      },
      {
        type: 'confirm',
        name: 'confirm',
        message: (answers) => `Create bootstrap admin invite for ${answers.name} (${answers.email})?`,
        default: true
      }
    ]);

    if (!answers.confirm) {
      console.log("❌ Operation cancelled.");
      return;
    }

    const { name, email } = answers;
    const role = "admin"; // Bootstrap script only creates admin users

    // Check if user with this email already exists
    const existingUser = users?.find(user => user.email === email);
    if (existingUser) {
      console.log(`\n⚠️  User with email ${email} already exists with role "${existingUser.role}".`);
      console.log("💡 Delete the existing user first or use a different email address.");
      return;
    }

    console.log(`\n📧 Creating ${role} invite for: ${email}`);

    // Directly create an invite token without authentication checks
    const result = await client.mutation(api.invites.createBootstrapInvite, {
      email: email,
      role: role,
    });

    const inviteUrl = `${process.env.NEXT_PUBLIC_APP_DOMAIN || "http://localhost:3000"}/invite?email=${encodeURIComponent(email)}&token=${result.token}`;

    console.log("✅ Bootstrap invite created successfully!");
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Role: ${role}`);
    console.log(`🔗 Invite URL: ${inviteUrl}\n`);

    console.log("💡 Next steps:");
    console.log("1. Copy the invite URL above");
    console.log("2. Open it in your browser");
    console.log("3. Create your password");
    console.log("4. Sign in as admin and use the /admin page normally");

  } catch (error) {
    console.error("❌ Error creating bootstrap invite:", error.message);
    process.exit(1);
  }
}

// Run the script
createBootstrapInvite();