import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import crypto from "crypto";

/**
 * POST /api/providers/me/wallet/deposit
 * Initiates a top-up request. For now, simulates a payment provider redirect.
 */
export async function POST(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "provider", "admin");
    if (roleError) return roleError;

    const body = await req.json();
    const { amount } = body;

    // Basic validation
    if (!amount || typeof amount !== "number" || amount <= 0) {
      return ApiError.badRequest("Valid positive amount is required");
    }

    const profile = await db.providerProfile.findUnique({
      where: { user_id: userPayload.sub },
      include: { wallet: true },
    });

    if (!profile || !profile.wallet) {
      return ApiError.notFound("Provider wallet not found");
    }

    // --- MOCK PAYMENT PROVIDER LOGIC ---
    // In a real scenario, you would:
    // 1. Create an order with Paymob/Stripe
    // 2. Get back an order_id or session_id
    // 3. Save it to a pending payments table if needed
    // 4. Return the checkout URL

    // Generate a fake session ID for testing
    const mockSessionId = `mock_session_${crypto.randomBytes(8).toString("hex")}`;

    // We can store pending metadata in the user's DB, or just expect it in the webhook
    // For this mock, we will just echo it back.

    // Return the fake checkout URL
    // In production: "https://accept.paymob.com/api/acceptance/iframes/123456?payment_token=..."
    return ok({
      message: "Deposit initiated successfully",
      checkout_url: `https://rabet.local/mock-checkout?session_id=${mockSessionId}&amount=${amount}&wallet_id=${profile.wallet.id}`,
      payment_session_id: mockSessionId,
    });
  } catch (err) {
    console.error("[POST /api/providers/me/wallet/deposit]", err);
    return ApiError.internal();
  }
}
