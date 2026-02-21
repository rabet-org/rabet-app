import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * POST /api/notifications/mark-all-read
 * Marks all unread notifications for the current user as read.
 */
export async function POST(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const result = await db.notification.updateMany({
      where: {
        user_id: userPayload.sub,
        is_read: false,
      },
      data: {
        is_read: true,
      },
    });

    return ok({
      message: "All notifications marked as read",
      count: result.count,
    });
  } catch (err) {
    console.error("[POST /api/notifications/mark-all-read]", err);
    return ApiError.internal();
  }
}
