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
const NUM_PENDING_APPLICANTS = 5;
const NUM_REQUESTS = 40; // Total cross-category
const PASSWORD_HASH = bcrypt.hashSync("password123", 10);

async function main() {
  console.log("🧹 Wiping the database...");
  // Ordered explicitly to handle Foreign Key constraints across tables
  await prisma.$transaction([
    prisma.adminLog.deleteMany(),
    prisma.notification.deleteMany(),
    prisma.broadcastMessage.deleteMany(),
    prisma.platformSetting.deleteMany(),
    prisma.ticketReply.deleteMany(),
    prisma.supportTicket.deleteMany(),
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
    {
      name: "Web Development",
      slug: "web-development",
      icon: "💻",
      description: "Website and web application development services",
    },
    {
      name: "Mobile Apps",
      slug: "mobile-apps",
      icon: "📱",
      description: "iOS and Android mobile application development",
    },
    {
      name: "Graphic Design",
      slug: "graphic-design",
      icon: "🎨",
      description: "Logo, branding, and visual design services",
    },
    {
      name: "Digital Marketing",
      slug: "digital-marketing",
      icon: "📈",
      description: "SEO, social media, and online marketing",
    },
    {
      name: "Content Writing",
      slug: "content-writing",
      icon: "✍️",
      description: "Blog posts, articles, and copywriting",
    },
    {
      name: "Video Production",
      slug: "video-production",
      icon: "🎬",
      description: "Video editing and production services",
    },
    {
      name: "Photography",
      slug: "photography",
      icon: "📸",
      description: "Professional photography services",
    },
    {
      name: "Translation",
      slug: "translation",
      icon: "🌐",
      description: "Document and content translation",
    },
    {
      name: "Consulting",
      slug: "consulting",
      icon: "💼",
      description: "Business and technical consulting",
    },
    {
      name: "Legal Services",
      slug: "legal-services",
      icon: "⚖️",
      description: "Legal advice and documentation",
    },
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

  // 5. CREATE PENDING/REJECTED APPLICANTS (no profile — awaiting review)
  console.log(
    `➡️ Seeding ${NUM_PENDING_APPLICANTS} pending & rejected applicants...`,
  );
  const pendingStatuses = [
    "pending",
    "pending",
    "pending",
    "rejected",
    "rejected",
  ];
  for (let i = 0; i < NUM_PENDING_APPLICANTS; i++) {
    const status = pendingStatuses[i];
    const user = await prisma.user.create({
      data: {
        email: `applicant${i}@example.com`,
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
    await prisma.providerApplication.create({
      data: {
        user_id: user.id,
        provider_type: "agency",
        business_name: faker.company.name(),
        description: faker.company.catchPhrase(),
        portfolio_url: faker.internet.url(),
        verification_docs: { license: faker.system.fileName() },
        application_status: status as any,
        ...(status === "rejected"
          ? {
              reviewed_by: admin.id,
              reviewed_at: faker.date.recent(),
              rejection_reason: "Did not meet criteria",
            }
          : {}),
      },
    });
  }

  // 6. CREATE REQUESTS
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
        project_duration: faker.helpers.arrayElement([
          "1_week",
          "2_weeks",
          "1_month",
          "2-3_months",
          "3+_months",
        ]),
        experience_level: faker.helpers.arrayElement([
          "Entry",
          "Intermediate",
          "Expert",
        ]),
        skills_required: faker.helpers.arrayElements(
          [
            "React",
            "Node.js",
            "Python",
            "Design",
            "Marketing",
            "SEO",
            "Content Writing",
            "Video Editing",
          ],
          faker.number.int({ min: 1, max: 4 }),
        ),
        preferred_language: faker.helpers.arrayElement(["arabic", "english"]),
        is_urgent: faker.datatype.boolean(0.3), // 30% chance of being urgent
      },
    });
    requests.push({ id: req.id, status: req.status, user_id: client_id });
  }

  // 7. CREATE UNLOCKS & REVIEWS (Simulate active jobs)
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

  // 8. CREATE ADMIN LOGS (Simulate admin actions)
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

  // 9. CREATE SUPPORT TICKETS
  console.log(`➡️ Seeding Support Tickets...`);
  const ticketSubjects = [
    "Cannot unlock request",
    "Payment issue",
    "Profile update problem",
    "Wallet balance not updated",
    "Email verification not working",
    "Unable to submit request",
    "Provider verification delay",
    "Refund request",
  ];

  // Get actual user IDs
  const allUsers = await prisma.user.findMany({
    where: {
      OR: [{ role: "client" }, { role: "provider" }],
    },
    select: { id: true },
  });

  for (let i = 0; i < 15; i++) {
    const user = faker.helpers.arrayElement(allUsers);
    const status = faker.helpers.arrayElement([
      "open",
      "in_progress",
      "resolved",
      "closed",
    ]);
    const priority = faker.helpers.arrayElement(["low", "medium", "high"]);

    const ticket = await prisma.supportTicket.create({
      data: {
        user_id: user.id,
        subject: faker.helpers.arrayElement(ticketSubjects),
        message: faker.lorem.paragraph(),
        status: status as any,
        priority: priority as any,
        assigned_to: status !== "open" ? admin.id : null,
        created_at: faker.date.recent({ days: 30 }),
      },
    });

    // Add some replies for non-open tickets
    if (status !== "open" && faker.datatype.boolean()) {
      await prisma.ticketReply.create({
        data: {
          ticket_id: ticket.id,
          user_id: admin.id,
          message: faker.lorem.paragraph(),
          is_admin: true,
          created_at: faker.date.recent({ days: 25 }),
        },
      });

      // User reply
      if (faker.datatype.boolean()) {
        await prisma.ticketReply.create({
          data: {
            ticket_id: ticket.id,
            user_id: user.id,
            message: faker.lorem.paragraph(),
            is_admin: false,
            created_at: faker.date.recent({ days: 20 }),
          },
        });
      }
    }
  }

  // 10. CREATE NOTIFICATIONS
  console.log(`➡️ Seeding Notifications...`);
  const notificationTypes = [
    "email_verified",
    "application_approved",
    "application_rejected",
    "request_unlocked",
    "low_wallet_balance",
    "new_review_received",
    "request_status_changed",
    "admin_message",
  ];

  // Get all user IDs for notifications
  const allUserIds = [...clients];
  // Get provider user IDs
  const providerProfiles = await prisma.providerProfile.findMany({
    select: { user_id: true },
  });
  allUserIds.push(...providerProfiles.map((p) => p.user_id));

  // Create notifications for all users
  for (const userId of allUserIds) {
    const numNotifications = faker.number.int({ min: 3, max: 10 });
    for (let i = 0; i < numNotifications; i++) {
      const type = faker.helpers.arrayElement(notificationTypes);
      const isRead = faker.datatype.boolean(0.6); // 60% chance of being read

      await prisma.notification.create({
        data: {
          user_id: userId,
          type: type as any,
          title: getNotificationTitle(type),
          message: getNotificationMessage(type),
          is_read: isRead,
          created_at: faker.date.recent({ days: 30 }),
        },
      });
    }
  }

  // 11. CREATE PLATFORM SETTINGS
  console.log(`➡️ Seeding Platform Settings...`);
  const platformSettings = [
    {
      key: "platform_fee_percentage",
      value: "10",
      description: "Platform fee percentage on transactions",
    },
    {
      key: "unlock_fee_default",
      value: "50",
      description: "Default unlock fee for requests",
    },
    {
      key: "min_wallet_balance",
      value: "100",
      description: "Minimum wallet balance required",
    },
    {
      key: "max_requests_per_day",
      value: "10",
      description: "Maximum requests a client can post per day",
    },
    {
      key: "maintenance_mode",
      value: "false",
      description: "Enable/disable maintenance mode",
    },
    {
      key: "email_notifications_enabled",
      value: "true",
      description: "Enable/disable email notifications",
    },
    {
      key: "sms_notifications_enabled",
      value: "false",
      description: "Enable/disable SMS notifications",
    },
  ];

  for (const setting of platformSettings) {
    await prisma.platformSetting.create({
      data: {
        ...setting,
        updated_by: admin.id,
      },
    });
  }

  // 12. CREATE BROADCAST MESSAGES
  console.log(`➡️ Seeding Broadcast Messages...`);
  const messageTemplates = [
    {
      title: "Platform Maintenance Notice",
      message:
        "We will be performing scheduled maintenance on Sunday from 2 AM to 4 AM. The platform will be temporarily unavailable during this time.",
      target_role: "all",
    },
    {
      title: "New Features Available",
      message:
        "Check out our new features including advanced search filters and improved messaging system!",
      target_role: "all",
    },
    {
      title: "Provider Verification Update",
      message:
        "We've updated our verification process to make it faster and more secure. Please review your profile.",
      target_role: "provider",
    },
    {
      title: "Special Offer for Clients",
      message:
        "Get 20% off on your first request unlock this month! Limited time offer.",
      target_role: "client",
    },
    {
      title: "Important Security Update",
      message:
        "We've enhanced our security measures. Please update your password if you haven't done so in the last 90 days.",
      target_role: "all",
    },
  ];

  for (const template of messageTemplates) {
    const targetUsers = await prisma.user.findMany({
      where:
        template.target_role === "all"
          ? {}
          : { role: template.target_role as any },
      select: { id: true },
    });

    await prisma.broadcastMessage.create({
      data: {
        title: template.title,
        message: template.message,
        target_role: template.target_role,
        sent_count: targetUsers.length,
        sent_by: admin.id,
        created_at: faker.date.recent({ days: 60 }),
      },
    });
  }

  console.log("\n🎉 Database Seed Complete!");
  console.log("-----------------------------------------");
  console.log("TEST ACCOUNTS (Password: password123)");
  console.log("Admin:    admin@rabet.com");
  console.log(`Client 1: client0@example.com`);
  console.log(`Provider: provider0@example.com`);
  console.log(`\nGenerated ${adminLogCount} admin logs for testing`);
  console.log(`Generated 15 support tickets with replies`);
  console.log(`Generated 5 broadcast messages`);
  console.log(`Generated notifications for all users`);
  console.log(`Generated platform settings`);
}

// Helper functions for notifications
function getNotificationTitle(type: string): string {
  const titles: Record<string, string> = {
    email_verified: "Email Verified",
    application_approved: "Application Approved",
    application_rejected: "Application Rejected",
    request_unlocked: "Request Unlocked",
    low_wallet_balance: "Low Wallet Balance",
    new_review_received: "New Review Received",
    request_status_changed: "Request Status Changed",
    admin_message: "Message from Admin",
  };
  return titles[type] || "Notification";
}

function getNotificationMessage(type: string): string {
  const messages: Record<string, string> = {
    email_verified: "Your email has been successfully verified.",
    application_approved:
      "Congratulations! Your provider application has been approved.",
    application_rejected:
      "Your provider application has been rejected. Please review the feedback.",
    request_unlocked: "A provider has unlocked your request.",
    low_wallet_balance:
      "Your wallet balance is low. Please add funds to continue.",
    new_review_received: "You have received a new review from a client.",
    request_status_changed: "The status of your request has been updated.",
    admin_message: "You have a new message from the admin team.",
  };
  return messages[type] || "You have a new notification.";
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
