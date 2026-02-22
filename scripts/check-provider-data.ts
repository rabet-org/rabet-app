/**
 * Check Provider Data Script
 * 
 * This script checks if provider data is correctly set up
 * Run with: npx tsx scripts/check-provider-data.ts <email>
 */

import "dotenv/config";
import { db } from "../lib/db";

async function checkProviderData(email: string) {
  console.log(`🔍 Checking data for: ${email}\n`);

  // Find user
  const user = await db.user.findUnique({
    where: { email },
    include: {
      profile: true,
      provider_application: true,
      provider_profile: {
        include: {
          wallet: true,
          services: {
            include: {
              category: true
            }
          }
        }
      }
    }
  });

  if (!user) {
    console.log("❌ User not found");
    return;
  }

  console.log("✅ User found:");
  console.log(`   ID: ${user.id}`);
  console.log(`   Email: ${user.email}`);
  console.log(`   Role: ${user.role}`);
  console.log(`   Email Verified: ${user.email_verified}`);
  console.log(`   Active: ${user.is_active}`);
  console.log(`   Blocked: ${user.is_blocked}`);

  if (user.profile) {
    console.log("\n✅ User Profile:");
    console.log(`   Full Name: ${user.profile.full_name}`);
    console.log(`   Phone: ${user.profile.phone || 'N/A'}`);
  } else {
    console.log("\n❌ No user profile found");
  }

  if (user.provider_application) {
    console.log("\n✅ Provider Application:");
    console.log(`   ID: ${user.provider_application.id}`);
    console.log(`   Status: ${user.provider_application.application_status}`);
    console.log(`   Business Name: ${user.provider_application.business_name}`);
    console.log(`   Provider Type: ${user.provider_application.provider_type}`);
  } else {
    console.log("\n❌ No provider application found");
  }

  if (user.provider_profile) {
    console.log("\n✅ Provider Profile:");
    console.log(`   ID: ${user.provider_profile.id}`);
    console.log(`   Verified: ${user.provider_profile.is_verified}`);
    console.log(`   Active: ${user.provider_profile.is_active}`);
    console.log(`   Services: ${user.provider_profile.services.length}`);
    
    if (user.provider_profile.services.length > 0) {
      console.log("   Categories:");
      user.provider_profile.services.forEach(s => {
        console.log(`      - ${s.category.name}`);
      });
    }

    if (user.provider_profile.wallet) {
      console.log("\n✅ Wallet:");
      console.log(`   ID: ${user.provider_profile.wallet.id}`);
      console.log(`   Balance: ${user.provider_profile.wallet.balance} ${user.provider_profile.wallet.currency}`);
    } else {
      console.log("\n❌ No wallet found for provider profile");
    }
  } else {
    console.log("\n❌ No provider profile found");
  }
}

const email = process.argv[2];
if (!email) {
  console.log("Usage: npx tsx scripts/check-provider-data.ts <email>");
  process.exit(1);
}

checkProviderData(email)
  .catch((e) => {
    console.error("❌ Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
