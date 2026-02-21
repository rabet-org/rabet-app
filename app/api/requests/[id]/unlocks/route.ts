import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/requests/[id]/unlocks
 * Client fetches a list of which providers unlocked their specific request.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "client", "admin");
    if (roleError) return roleError;

    const { id } = await params;

    // Verify ownership of the request
    const requestItem = await db.request.findUnique({
      where: { id },
    });

    if (!requestItem) {
      return ApiError.notFound("Request not found");
    }

    if (requestItem.user_id !== userPayload.sub) {
      return ApiError.forbidden(
        "You do not have permission to view unlocks for this request",
      );
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    const where = { request_id: id, status: "completed" as any };

    const [unlocks, total] = await Promise.all([
      db.leadUnlock.findMany({
        where,
        include: {
          provider: {
            include: {
              application: { select: { business_name: true } },
              reviews: { select: { rating: true } },
            },
          },
        },
        orderBy: { unlocked_at: "desc" },
        skip,
        take: limit,
      }),
      db.leadUnlock.count({ where }),
    ]);

    return ok({
      data: unlocks.map((u) => {
        const total_reviews = u.provider.reviews.length;
        const average_rating =
          total_reviews > 0
            ? u.provider.reviews.reduce((sum, r) => sum + r.rating, 0) /
              total_reviews
            : 0;

        return {
          id: u.id,
          unlocked_at: u.unlocked_at,
          provider: {
            id: u.provider.id,
            business_name: u.provider.application.business_name,
            is_verified: u.provider.is_verified,
            average_rating,
            total_reviews,
          },
        };
      }),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/requests/[id]/unlocks]", err);
    return ApiError.internal();
  }
}
