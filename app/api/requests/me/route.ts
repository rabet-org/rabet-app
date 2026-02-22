import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/requests/me
 * Get current user's requests
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50")),
    );
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where: {
          user_id: userPayload.sub,
        },
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          _count: {
            select: {
              unlocks: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      db.request.count({
        where: {
          user_id: userPayload.sub,
        },
      }),
    ]);

    return ok({
      data: requests.map((r) => ({
        ...r,
        unlock_fee: r.unlock_fee.toNumber(),
        total_unlocks: r._count.unlocks,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/requests/me]", err);
    return ApiError.internal();
  }
}
