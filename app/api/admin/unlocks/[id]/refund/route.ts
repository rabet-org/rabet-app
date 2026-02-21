import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>; // unlock_id
}

/**
 * POST /api/admin/unlocks/[id]/refund
 * Administrator forcefully refunds a lead unlock transaction, returning funds to the provider.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: unlock_id } = await params;

    const body = await req.json().catch(() => ({}));
    const reason = body.reason;

    if (!reason || typeof reason !== "string") {
      return ApiError.badRequest(
        "You must provide a 'reason' for processing the refund.",
      );
    }

    const unlock = await db.leadUnlock.findUnique({
      where: { id: unlock_id },
      include: {
        provider: {
          include: {
            wallet: true,
          },
        },
      },
    });

    if (!unlock) {
      return ApiError.notFound("Lead Unlock record not found");
    }

    if (unlock.status === "refunded") {
      return ApiError.badRequest("This unlock has already been refunded.");
    }

    if (!unlock.provider.wallet) {
      return ApiError.internal(
        "Provider wallet missing. Cannot process refund.",
      );
    }

    const result = await db.$transaction(async (tx) => {
      const amountDec = unlock.unlock_fee;
      const balanceBefore = unlock.provider.wallet!.balance;
      const balanceAfter = new Prisma.Decimal(
        balanceBefore.toNumber() + amountDec.toNumber(),
      );

      // 1. Create Ledger Transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          wallet_id: unlock.provider.wallet!.id,
          provider_id: unlock.provider_id,
          type: "refund",
          amount: amountDec, // Store absolute positive value of the refund
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference_type: "lead_unlock",
          reference_id: unlock.request_id,
          description: `Refund for unlocking request: Admin Reason: ${reason}`,
        },
      });

      // 2. Update actual wallet balance
      await tx.providerWallet.update({
        where: { id: unlock.provider.wallet!.id },
        data: { balance: balanceAfter },
      });

      // 3. Mark the unlock itself as refunded
      const updatedUnlock = await tx.leadUnlock.update({
        where: { id: unlock_id },
        data: { status: "refunded" },
      });

      // 4. Admin Log
      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "process_refund",
          target_type: "wallet",
          target_id: transaction.id,
          details: {
            unlock_id,
            amount_refunded: amountDec.toNumber(),
            reason,
          },
        },
      });

      // 5. Notify Provider
      await tx.notification.create({
        data: {
          user_id: unlock.provider.user_id,
          type: "refund_processed",
          title: "Unlock Refund Processed",
          message: `A lead unlock fee of ${amountDec.toNumber()} EGP has been refunded to your wallet. Reason: ${reason}`,
          metadata: { unlock_id, transaction_id: transaction.id },
        },
      });

      return { updatedUnlock, transaction, balanceAfter };
    });

    return ok({
      unlock_id: result.updatedUnlock.id,
      status: result.updatedUnlock.status,
      refunded_at: result.transaction.created_at, // Use transaction date as the refund event marker
      refund_amount: result.updatedUnlock.unlock_fee.toNumber(),
      wallet_transaction_id: result.transaction.id,
    });
  } catch (err) {
    console.error("[POST /api/admin/unlocks/[id]/refund]", err);
    return ApiError.internal();
  }
}
