import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/support/me
 * Get current user's support tickets
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const tickets = await db.supportTicket.findMany({
      where: {
        user_id: userPayload.sub,
      },
      include: {
        replies: {
          include: {
            user: {
              select: {
                profile: {
                  select: {
                    full_name: true,
                  },
                },
              },
            },
          },
          orderBy: {
            created_at: "asc",
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return ok({ data: tickets });
  } catch (err) {
    console.error("[GET /api/support/me]", err);
    return ApiError.internal();
  }
}
