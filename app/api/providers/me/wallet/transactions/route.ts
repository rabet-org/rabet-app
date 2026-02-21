import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/providers/me/wallet/transactions
 * Retrieve paginated wallet transaction history.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "provider", "admin");
    if (roleError) return roleError;

    const profile = await db.providerProfile.findUnique({
      where: { user_id: userPayload.sub },
      include: { wallet: true },
    });

    if (!profile || !profile.wallet) {
      return ApiError.notFound("Provider wallet not found");
    }

    const { searchParams } = new URL(req.url);
    const typeParam = searchParams.get("type");

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    const where: any = { wallet_id: profile.wallet.id };

    // Validate type parameter against Prisma TransactionType enum
    if (typeParam && ["deposit", "debit", "refund"].includes(typeParam)) {
      where.type = typeParam;
    }

    const [transactions, total] = await Promise.all([
      db.walletTransaction.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.walletTransaction.count({ where }),
    ]);

    return ok({
      data: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.amount.toNumber(),
        balance_after: t.balance_after.toNumber(),
        description: t.description,
        reference_type: t.reference_type,
        reference_id: t.reference_id,
        created_at: t.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/providers/me/wallet/transactions]", err);
    return ApiError.internal();
  }
}
