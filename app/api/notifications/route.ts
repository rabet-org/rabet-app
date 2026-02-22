import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/notifications
 * Returns the current user's recent notifications + unread count.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const { searchParams } = new URL(req.url);
    const limit = Math.min(20, parseInt(searchParams.get("limit") ?? "10"));

    const [notifications, unreadCount] = await Promise.all([
      db.notification.findMany({
        where: { user_id: userPayload.sub },
        orderBy: { created_at: "desc" },
        take: limit,
      }),
      db.notification.count({
        where: { user_id: userPayload.sub, is_read: false },
      }),
    ]);

    return ok({ data: notifications, unread_count: unreadCount });
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return ApiError.internal();
  }
}
