import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/notifications/[id]/read
 * Marks a specific notification as read.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const { id } = await params;

    const notification = await db.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return ApiError.notFound("Notification not found");
    }

    if (
      notification.user_id !== userPayload.sub &&
      userPayload.role !== "admin"
    ) {
      return ApiError.forbidden(
        "You do not have permission to update this notification",
      );
    }

    const updated = await db.notification.update({
      where: { id },
      data: { is_read: true },
    });

    return ok({
      id: updated.id,
      is_read: updated.is_read,
    });
  } catch (err) {
    console.error("[PATCH /api/notifications/[id]/read]", err);
    return ApiError.internal();
  }
}
