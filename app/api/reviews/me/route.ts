import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/reviews/me
 * Get current user's reviews (as a client)
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

    const [reviews, total] = await Promise.all([
      db.review.findMany({
        where: {
          client_id: userPayload.sub,
          deleted_at: null,
        },
        include: {
          provider: {
            include: {
              user: {
                select: {
                  profile: {
                    select: {
                      full_name: true,
                      avatar_url: true,
                    },
                  },
                },
              },
            },
          },
          request: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          created_at: "desc",
        },
        skip,
        take: limit,
      }),
      db.review.count({
        where: {
          client_id: userPayload.sub,
          deleted_at: null,
        },
      }),
    ]);

    return ok({
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/reviews/me]", err);
    return ApiError.internal();
  }
}
