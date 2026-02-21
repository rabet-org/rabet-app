import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/requests/[id]/unlock
 * Provider pays the unlock_fee from their wallet to reveal the client's contact info.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "provider", "admin");
    if (roleError) return roleError;

    const { id: request_id } = await params;

    // 1. Validate Provider Profile & Wallet
    const providerProfile = await db.providerProfile.findUnique({
      where: { user_id: userPayload.sub },
      include: { wallet: true },
    });

    if (!providerProfile || !providerProfile.wallet) {
      return ApiError.notFound("Provider profile or wallet not found");
    }

    // 2. Validate Request
    const targetRequest = await db.request.findUnique({
      where: { id: request_id },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { full_name: true, phone: true } },
          },
        },
      },
    });

    if (!targetRequest) {
      return ApiError.notFound("Service request not found");
    }

    if (targetRequest.status !== "published") {
      return ApiError.badRequest("You can only unlock published requests");
    }

    // 3. Check for existing unlock (Idempotence)
    const existingUnlock = await db.leadUnlock.findUnique({
      where: {
        request_id_provider_id: {
          request_id,
          provider_id: providerProfile.id,
        },
      },
    });

    if (existingUnlock && existingUnlock.status === "completed") {
      return ApiError.badRequest("You have already unlocked this request");
    }

    // 4. Ensure sufficient funds
    if (
      providerProfile.wallet.balance.toNumber() <
      targetRequest.unlock_fee.toNumber()
    ) {
      return ApiError.badRequest(
        "Insufficient wallet balance to unlock this request",
      );
    }

    // 5. Execute Atomic Unlock & Payment
    const result = await db.$transaction(async (tx) => {
      const amountDec = targetRequest.unlock_fee;
      const balanceBefore = providerProfile.wallet!.balance;
      const balanceAfter = balanceBefore.toNumber() - amountDec.toNumber();

      // Create ledger transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          wallet_id: providerProfile.wallet!.id,
          provider_id: providerProfile.id,
          type: "debit",
          amount: amountDec,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference_type: "lead_unlock",
          reference_id: targetRequest.id,
          description: `Unlocked request: ${targetRequest.title}`,
        },
      });

      // Update wallet balance
      await tx.providerWallet.update({
        where: { id: providerProfile.wallet!.id },
        data: { balance: balanceAfter },
      });

      // Create LeadUnlock record
      const unlockRecord = await tx.leadUnlock.create({
        data: {
          request_id: targetRequest.id,
          provider_id: providerProfile.id,
          wallet_transaction_id: transaction.id,
          unlock_fee: amountDec,
          status: "completed",
        },
      });

      return { transaction, unlockRecord, balanceAfter };
    });

    // 6. Return Success with the newly revealed data
    return ok(
      {
        id: result.unlockRecord.id,
        request_id: targetRequest.id,
        provider_id: providerProfile.id,
        unlock_fee: result.unlockRecord.unlock_fee.toNumber(),
        status: result.unlockRecord.status,
        unlocked_at: result.unlockRecord.unlocked_at,
        wallet_balance_after: result.balanceAfter,
        request: {
          id: targetRequest.id,
          title: targetRequest.title,
          client: {
            full_name: targetRequest.user.profile?.full_name ?? "Client",
            email: targetRequest.user.email,
            phone: targetRequest.user.profile?.phone ?? null,
          },
        },
      },
      201,
    );
  } catch (err) {
    console.error("[POST /api/requests/[id]/unlock]", err);
    return ApiError.internal();
  }
}
