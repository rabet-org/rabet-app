import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";

/**
 * POST /api/webhooks/mock-payment
 * Simulates Paymob/Stripe webhook confirming a successful deposit.
 * In a real app, this endpoint verifies the HMAC signature from the gateway.
 */
export async function POST(req: NextRequest) {
  try {
    // 1. In reality, you'd verify webhook signature here
    // e.g. verifyPaymobHmac(req.body, req.headers)

    const payload = await req.json();
    const { session_id, amount, wallet_id, status } = payload;

    // Validate webhook payload
    if (!session_id || !amount || !wallet_id) {
      return ApiError.badRequest("Missing required webhook payload fields");
    }

    if (status !== "success") {
      // In reality, log failed payment and exit
      return ok({ message: "Ignored non-success status" });
    }

    // 2. Process the transaction atomically
    const result = await db.$transaction(async (tx) => {
      // Find the wallet and lock it for updating (if using native raw SQL, we'd FOR UPDATE)
      // Prisma handles basic concurrency if we do a direct increment mathematically,
      // but we need to compute before/after balances for the ledger.

      const wallet = await tx.providerWallet.findUnique({
        where: { id: wallet_id },
      });

      if (!wallet) {
        throw new Error("Wallet not found");
      }

      // Check if we already processed this session (Idempotence)
      const existingTx = await tx.walletTransaction.findFirst({
        where: { reference_id: session_id },
      });

      if (existingTx) {
        return { status: "already_processed" };
      }

      const amountDecimal = Number(amount);
      const balanceBefore = wallet.balance;
      const balanceAfter = wallet.balance.toNumber() + amountDecimal;

      // Create ledger entry
      const transaction = await tx.walletTransaction.create({
        data: {
          wallet_id: wallet.id,
          provider_id: wallet.provider_id,
          type: "deposit",
          amount: amountDecimal,
          balance_before: balanceBefore,
          balance_after: balanceAfter,
          reference_type: "mock_payment_gateway",
          reference_id: session_id,
          description: "Wallet top-up",
          metadata: { gateway_payload: payload },
        },
      });

      // Update wallet balance explicitly to match transaction history exactly
      await tx.providerWallet.update({
        where: { id: wallet.id },
        data: { balance: balanceAfter },
      });

      return { status: "processed", transaction_id: transaction.id };
    });

    if (result.status === "already_processed") {
      return ok({ message: "Webhook already processed previously" });
    }

    return ok({
      message: "Payment processed",
      transaction_id: result.transaction_id,
    });
  } catch (err) {
    console.error("[POST /api/webhooks/mock-payment]", err);
    return ApiError.internal();
  }
}
