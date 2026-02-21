import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/providers/me/wallet
 * Get the current provider's wallet balance.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "provider", "admin");
    if (roleError) return roleError;

    // First ensure the provider profile exists
    const profile = await db.providerProfile.findUnique({
      where: { user_id: userPayload.sub },
      include: { wallet: true },
    });

    if (!profile) {
      return ApiError.notFound("Provider profile not found");
    }

    if (!profile.wallet) {
      return ApiError.notFound("Wallet not found. Contact support.");
    }

    // Since we removed total_spent and total_deposited from the Prisma schema
    // to normalize the database, we calculate them on-the-fly dynamically.
    // Top-ups are "deposit"
    // Unlocks/Subscriptions are "charge"
    const stats = await db.walletTransaction.groupBy({
      by: ["type"],
      where: { wallet_id: profile.wallet.id },
      _sum: {
        amount: true,
      },
    });

    const total_deposited =
      stats.find((s) => s.type === "deposit")?._sum.amount?.toNumber() ?? 0;

    const total_spent =
      stats.find((s) => s.type === "debit")?._sum.amount?.toNumber() ?? 0;

    return ok({
      id: profile.wallet.id,
      balance: profile.wallet.balance.toNumber(),
      currency: profile.wallet.currency,
      total_deposited,
      total_spent,
      updated_at: profile.wallet.updated_at,
    });
  } catch (err) {
    console.error("[GET /api/providers/me/wallet]", err);
    return ApiError.internal();
  }
}
