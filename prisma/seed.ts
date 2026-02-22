/**
 * --------------------------------------------------------------------------
 * Rabet Platform - Comprehensive Database Seeder
 * --------------------------------------------------------------------------
 *
 * This script wipes the database and seeds it with realistic randomized data:
 * - Categories
 * - Admin User
 * - Client Users
 * - Provider Users (Applications, Profiles, Services, Wallets)
 * - Service Requests (Draft, Published, In Progress, Completed, Cancelled)
 * - Lead Unlocks
 * - Reviews & Ratings
 * - Wallet Transactions
 *
 * Usage: npx prisma db push && npx prisma db seed (or npx tsx prisma/seed.ts)
 */

import "dotenv/config";
import { db as prisma } from "../lib/db";
import { Prisma } from "@prisma/client";
import { faker } from "@faker-js/faker";
import bcrypt from "bcrypt";

// Constants to tweak generation scale
const NUM_CATEGORIES = 10;
const NUM_CLIENTS = 15;
const NUM_PROVIDERS = 10;
const NUM_REQUESTS = 40; // Total cross-category
const PASSWORD_HASH = bcrypt.hashSync("password123", 10);

async function main() {
  console.log("🧹 Wiping the database...");
  // Ordered explicitly to handle Foreign Key constraints across tables
  await prisma.$transaction([
    prisma.adminLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.review.deleteMany(),
    prisma.leadUnlock.deleteMany(), // Delete unlocks before transactions
    prisma.walletTransaction.deleteMany(),
    prisma.request.deleteMany(),
    prisma.providerService.deleteMany(),
    prisma.providerWallet.deleteMany(),
    prisma.providerProfile.deleteMany(),
    prisma.providerApplication.deleteMany(),
    prisma.refreshToken.deleteMany(), // Add this
    prisma.userProfile.deleteMany(),
    prisma.userAuth.deleteMany(),
    prisma.user.deleteMany(),
    prisma.category.deleteMany(),
  ]);

  console.log("🌱 Database wiped. Beginning seed sequence...\n");

  // 1. CREATE CATEGORIES
  console.log("➡️ Seeding Categories...");
  const categoryData = [
    { name: "Web Development", slug: "web-development", icon: "💻", description: "Website and web application development services" },
    { name: "Mobile Apps", slug: "mobile-apps", icon: "📱", description: "iOS and Android mobile application development" },
    { name: "Graphic Design", slug: "graphic-design", icon: "🎨", description: "Logo, branding, and visual design services" },
    { name: "Digital Marketing", slug: "digital-marketing", icon: "📈", description: "SEO, social media, and online marketing" },
    { name: "Content Writing", slug: "content-writing", icon: "✍️", description: "Blog posts, articles, and copywriting" },
    { name: "Video Production", slug: "video-production", icon: "🎬", description: "Video editing and production services" },
    { name: "Photography", slug: "photography", icon: "📸", description: "Professional photography services" },
    { name: "Translation", slug: "translation", icon: "🌐", description: "Document and content translation" },
    { name: "Consulting", slug: "consulting", icon: "💼", description: "Business and technical consulting" },
    { name: "Legal Services", slug: "legal-services", icon: "⚖️", description: "Legal advice and documentation" },
  ];

  const categories: string[] = [];
  for (const catData of categoryData) {
    const cat = await prisma.category.create({
      data: {
        ...catData,
        is_active: true,
      },
    });
    categories.push(cat.id);
  }

  // 2. CREATE ADMIN
  console.log("➡️ Seeding Admin...");
  const admin = await prisma.user.create({
    data: {
      email: "admin@rabet.com",
      role: "admin",
      email_verified: true,
      auth: { create: { password_hash: PASSWORD_HASH } },
      profile: {
        create: { full_name: "Rabet Superadmin", phone: "+201000000000" },
      },
    },
  });

  // 3. CREATE CLIENTS
  console.log(`➡️ Seeding ${NUM_CLIENTS} Clients...`);
  const clients: string[] = [];
  for (let i = 0; i < NUM_CLIENTS; i++) {
    const client = await prisma.user.create({
      data: {
        email: `client${i}@example.com`,
        role: "client",
        email_verified: true,
        auth: { create: { password_hash: PASSWORD_HASH } },
        profile: {
          create: {
            full_name: faker.person.fullName(),
            phone: faker.phone.number({ style: "international" }),
            avatar_url: faker.image.avatar(),
          },
        },
      },
    });
    clients.push(client.id);
  }

  // 4. CREATE PROVIDERS (Simulating the application -> approval flow)
  console.log(`➡️ Seeding ${NUM_PROVIDERS} Providers + Wallets & Services...`);
  const providers: string[] = [];
  for (let i = 0; i < NUM_PROVIDERS; i++) {
    // Phase 1: Create Base User
    const user = await prisma.user.create({
      data: {
        email: `provider${i}@example.com`,
        role: "provider",
        email_verified: true,
        auth: { create: { password_hash: PASSWORD_HASH } },
        profile: {
          create: {
            full_name: faker.person.fullName(),
            phone: faker.phone.number({ style: "international" }),
            avatar_url: faker.image.avatar(),
          },
        },
      },
    });

    // Phase 2: Create Approved Application
    const application = await prisma.providerApplication.create({
      data: {
        user_id: user.id,
        provider_type: "agency",
        business_name: faker.company.name(),
        description: faker.company.catchPhrase(),
        portfolio_url: faker.internet.url(),
        verification_docs: { license: faker.system.fileName() },
        application_status: "approved",
        reviewed_by: admin.id,
        reviewed_at: faker.date.recent(),
      },
    });

    // Phase 3: Create Profile and Wallet
    const providerProfile = await prisma.providerProfile.create({
      data: {
        user_id: user.id,
        application_id: application.id,
        description: application.description,
        portfolio_url: application.portfolio_url,
        is_verified: true, // 100% verified for seed
        verified_at: new Date(),
        verified_by: admin.id,
      },
    });
    providers.push(providerProfile.id);

    // Link random categories (1 to 3 services)
    const numServices = faker.number.int({ min: 1, max: 3 });
    const selectedCats = faker.helpers.arrayElements(categories, numServices);
    await prisma.providerService.createMany({
      data: selectedCats.map((catId) => ({
        provider_id: providerProfile.id,
        category_id: catId,
      })),
    });

    // Provision Wallet with generous randomly deposited funds to simulate active platform
    const depositAmount = faker.number.float({
      min: 500,
      max: 3000,
      fractionDigits: 2,
    });
    const wallet = await prisma.providerWallet.create({
      data: { provider_id: providerProfile.id, balance: depositAmount },
    });

    // Log the initial mock deposit
    await prisma.walletTransaction.create({
      data: {
        wallet_id: wallet.id,
        provider_id: providerProfile.id,
        type: "deposit" as any,
        amount: depositAmount,
        balance_before: 0,
        balance_after: depositAmount,
        description: "Initial seed mock deposit",
        reference_type: "manual_adjustment",
      },
    });
  }

  // 5. CREATE REQUESTS
  console.log(`➡️ Seeding ${NUM_REQUESTS} Requests (various states)...`);
  const requests: { id: string; status: string; user_id: string }[] = [];
  const statusDist = [
    "published",
    "published",
    "published",
    "in_progress",
    "in_progress",
    "completed",
    "completed",
    "completed",
    "cancelled",
    "draft",
  ];

  for (let i = 0; i < NUM_REQUESTS; i++) {
    const status = faker.helpers.arrayElement(
      statusDist,
    ) as Prisma.EnumRequestStatusFilter;
    const client_id = faker.helpers.arrayElement(clients);

    const req = await prisma.request.create({
      data: {
        user_id: client_id,
        category_id: faker.helpers.arrayElement(categories),
        title: faker.commerce.productName() + " Required",
        description: faker.lorem.paragraphs(2),
        budget_range: `${faker.number.int({ min: 100, max: 500 })} - ${faker.number.int({ min: 600, max: 2000 })} EGP`,
        location: faker.location.city(),
        status: status as any,
        unlock_fee: 50.0,
        deadline: faker.date.future(),
      },
    });
    requests.push({ id: req.id, status: req.status, user_id: client_id });
  }

  // 6. CREATE UNLOCKS & REVIEWS (Simulate active jobs)
  console.log(`➡️ Seeding Lead Unlocks & Reviews...`);
  // Only completed/in_progress ones typically have unlocks
  const activeReqs = requests.filter(
    (r) => r.status === "in_progress" || r.status === "completed",
  );

  let adminLogCount = 0;

  for (const req of activeReqs) {
    // Pick random provider to unlock it
    const provider_profile_id = faker.helpers.arrayElement(providers);
    const wallet = await prisma.providerWallet.findUnique({
      where: { provider_id: provider_profile_id },
    });

    if (wallet && wallet.balance.toNumber() >= 50) {
      const newBal = wallet.balance.toNumber() - 50;

      // 1. Create the debit transaction
      const transaction = await prisma.walletTransaction.create({
        data: {
          wallet_id: wallet.id,
          provider_id: provider_profile_id,
          type: "debit" as any,
          amount: 50,
          balance_before: wallet.balance,
          balance_after: newBal,
          description: "Lead unlock",
          reference_type: "lead_unlock",
        },
      });

      // 2. Create the unlock referencing the transaction
      const unlock = await prisma.leadUnlock.create({
        data: {
          request_id: req.id,
          provider_id: provider_profile_id,
          wallet_transaction_id: transaction.id,
          unlock_fee: 50,
          status: "completed",
          unlocked_at: faker.date.recent(),
        },
      });

      await prisma.providerWallet.update({
        where: { id: wallet.id },
        data: { balance: newBal },
      });

      // If request is completed, generate a review!
      if (req.status === "completed") {
        // 80% chance they leave a good review, 20% bad
        const rating =
          Math.random() > 0.2
            ? faker.number.int({ min: 4, max: 5 })
            : faker.number.int({ min: 1, max: 3 });
        await prisma.review.create({
          data: {
            request_id: req.id,
            client_id: req.user_id,
            provider_id: provider_profile_id,
            rating,
            comment: faker.lorem.sentences(2),
          },
        });

        // Update provider average rating (simplified approach for seed)
        const allReviews = await prisma.review.findMany({
          where: { provider_id: provider_profile_id },
        });
        const sum = allReviews.reduce((a, b) => a + b.rating, 0);
        /* We didn't enforce average rating on the table to be kept manually in DB schema, 
                so we rely on runtime aggregation (per the design doc) */
      }
    }
  }

  // 7. CREATE ADMIN LOGS (Simulate admin actions)
  console.log(`➡️ Seeding Admin Logs...`);
  const adminActions = [
    "approve_provider",
    "verify_provider",
    "adjust_wallet",
    "block_user",
    "moderate_request",
  ];

  for (let i = 0; i < 20; i++) {
    const action = faker.helpers.arrayElement(adminActions);
    const provider_id = faker.helpers.arrayElement(providers);
    
    await prisma.adminLog.create({
      data: {
        admin_id: admin.id,
        action_type: action as any,
        target_type: "provider",
        target_id: provider_id,
        details: {
          reason: faker.lorem.sentence(),
          timestamp: faker.date.recent(),
        },
        created_at: faker.date.recent({ days: 7 }),
      },
    });
    adminLogCount++;
  }

  console.log("\n🎉 Database Seed Complete!");
  console.log("-----------------------------------------");
  console.log("TEST ACCOUNTS (Password: password123)");
  console.log("Admin:    admin@rabet.com");
  console.log(`Client 1: client0@example.com`);
  console.log(`Provider: provider0@example.com`);
  console.log(`\nGenerated ${adminLogCount} admin logs for testing`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
