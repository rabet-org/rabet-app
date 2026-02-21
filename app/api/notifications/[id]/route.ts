import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * DELETE /api/notifications/[id]
 * Permanently deletes a specific notification.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
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
        "You do not have permission to delete this notification",
      );
    }

    await db.notification.delete({
      where: { id },
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/notifications/[id]]", err);
    return ApiError.internal();
  }
}
