import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/providers/[id]/wallet/adjust
 * Administrator forcefully credits or debits a provider's wallet balance.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: provider_id } = await params;

    const body = await req.json().catch(() => ({}));
    const { amount, reason } = body;

    if (typeof amount !== "number" || amount === 0) {
      return ApiError.badRequest(
        "You must provide a non-zero 'amount' (can be positive or negative).",
      );
    }

    if (!reason || typeof reason !== "string") {
      return ApiError.badRequest(
        "You must provide a 'reason' for the adjustment.",
      );
    }

    const providerWallet = await db.providerWallet.findUnique({
      where: { provider_id },
    });

    if (!providerWallet) {
      return ApiError.notFound("Provider wallet not found");
    }

    // Determine type for ledger
    const transactionType = amount > 0 ? "deposit" : "debit"; // We use deposit/debit as base primitives if "adjustment" isn't in Enum

    const result = await db.$transaction(async (tx) => {
      const amountDec = new Prisma.Decimal(Math.abs(amount));
      const balanceBefore = providerWallet.balance;
      const balanceAfter = new Prisma.Decimal(
        balanceBefore.toNumber() + amount,
      );

      // 1. Create Ledger Transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          wallet_id: providerWallet.id,
          provider_id,
          type: transactionType as any, // Cast in case 'adjustment' is strictly needed but deposit/debit guarantees safety
          amount: amountDec, // Store absolute value
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference_type: "manual_adjustment",
          reference_id: provider_id, // We just store the provider ID as the ref since it's an abstract adjustment
          description: `Admin manual adjustment: ${reason}`,
        },
      });

      // 2. Update actual wallet balance
      await tx.providerWallet.update({
        where: { id: providerWallet.id },
        data: { balance: balanceAfter },
      });

      // 3. Admin Log
      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "adjust_wallet",
          target_type: "wallet",
          target_id: providerWallet.id,
          details: {
            amount_adjusted: amount,
            reason,
          },
        },
      });

      // 4. Notify Provider
      await tx.notification.create({
        data: {
          user_id: userPayload.sub, // Will be replaced by provider's user_id
          type: "low_wallet_balance", // Reusing best fit enum (could be an informational alert)
          title: "Wallet Balance Adjusted",
          message: `Your wallet balance was adjusted by an administrator: ${amount > 0 ? "+" : ""}${amount} EGP. Reason: ${reason}`,
          metadata: { provider_id, transaction_id: transaction.id, amount },
        },
      });

      // Update the notification with correct user ID (we need provider's user_id)
      const providerProfile = await tx.providerProfile.findUnique({
        where: { id: provider_id },
      });
      if (providerProfile) {
        await tx.notification.updateMany({
          where: {
            metadata: { path: ["transaction_id"], equals: transaction.id },
          },
          data: { user_id: providerProfile.user_id },
        });
      }

      return { transaction, balanceAfter };
    });

    return ok({
      transaction_id: result.transaction.id,
      type: "adjustment", // Mapped to the ERD external expectation
      amount: amount,
      balance_before: providerWallet.balance.toNumber(),
      balance_after: result.balanceAfter.toNumber(),
    });
  } catch (err) {
    console.error("[POST /api/admin/providers/[id]/wallet/adjust]", err);
    return ApiError.internal();
  }
}
