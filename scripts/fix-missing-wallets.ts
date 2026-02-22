/**
 * Fix Missing Wallets Script
 * 
 * This script finds all provider profiles without wallets and creates them.
 * Run with: npx tsx scripts/fix-missing-wallets.ts
 */

import "dotenv/config";
import { db } from "../lib/db";

async function fixMissingWallets() {
  console.log("🔍 Checking for provider profiles without wallets...");

  // Find all provider profiles
  const profiles = await db.providerProfile.findMany({
    include: {
      wallet: true,
      user: {
        select: {
          email: true,
          profile: {
            select: { full_name: true }
          }
        }
      }
    }
  });

  console.log(`📊 Found ${profiles.length} provider profiles`);

  const profilesWithoutWallets = profiles.filter(p => !p.wallet);
  
  if (profilesWithoutWallets.length === 0) {
    console.log("✅ All provider profiles have wallets!");
    return;
  }

  console.log(`⚠️  Found ${profilesWithoutWallets.length} profiles without wallets:`);
  
  for (const profile of profilesWithoutWallets) {
    console.log(`   - ${profile.user.profile?.full_name || 'Unknown'} (${profile.user.email})`);
  }

  console.log("\n🔧 Creating missing wallets...");

  let created = 0;
  for (const profile of profilesWithoutWallets) {
    try {
      await db.providerWallet.create({
        data: {
          provider_id: profile.id,
          balance: 0.0,
          currency: "EGP"
        }
      });
      console.log(`   ✓ Created wallet for ${profile.user.email}`);
      created++;
    } catch (error) {
      console.error(`   ✗ Failed to create wallet for ${profile.user.email}:`, error);
    }
  }

  console.log(`\n✅ Successfully created ${created} wallets`);
}

fixMissingWallets()
  .catch((e) => {
    console.error("❌ Script failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
