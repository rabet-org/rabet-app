import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

/**
 * GET /api/users/me/notifications
 * Get a paginated list of notifications for the current user.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const { searchParams } = new URL(req.url);

    const typeFilter = searchParams.get("type");
    const isReadFilter = searchParams.get("is_read");

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      user_id: userPayload.sub,
    };

    if (typeFilter) {
      // We assume the type exactly matches the Prisma NotificationType enum
      where.type = typeFilter as Prisma.EnumNotificationTypeFilter;
    }

    if (isReadFilter !== null) {
      where.is_read = isReadFilter === "true";
    }

    const [notifications, total, unreadCount] = await Promise.all([
      db.notification.findMany({
        where,
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.notification.count({ where }),
      db.notification.count({
        where: { user_id: userPayload.sub, is_read: false },
      }),
    ]);

    return ok({
      data: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        is_read: n.is_read,
        metadata: n.metadata, // JSON payload parsed automatically by Prisma
        created_at: n.created_at,
      })),
      unread_count: unreadCount,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/users/me/notifications]", err);
    return ApiError.internal();
  }
}
