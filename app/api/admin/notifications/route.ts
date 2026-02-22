import { NextRequest } from "next/server";
import { NotificationType } from "@prisma/client";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * POST /api/admin/notifications
 * Send a targeted notification to one user, or broadcast to all users.
 *
 * Body:
 *   { user_id: string, title: string, message: string }           — targeted
 *   { broadcast: true, title: string, message: string }           — all users
 *   { role: "client"|"provider", title: string, message: string } — by role
 */
export async function POST(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const body = await req.json();
    const { title, message, user_id, broadcast, role } = body;

    if (!title?.trim() || !message?.trim()) {
      return ApiError.badRequest("title and message are required");
    }

    let targetUserIds: string[] = [];

    if (broadcast) {
      // Send to all users
      const users = await db.user.findMany({ select: { id: true } });
      targetUserIds = users.map((u) => u.id);
    } else if (role) {
      // Send to all users with a specific role
      if (!["client", "provider", "admin"].includes(role)) {
        return ApiError.badRequest("Invalid role");
      }
      const users = await db.user.findMany({
        where: { role },
        select: { id: true },
      });
      targetUserIds = users.map((u) => u.id);
    } else if (user_id) {
      // Targeted single user
      const user = await db.user.findUnique({ where: { id: user_id } });
      if (!user) return ApiError.notFound("User not found");
      targetUserIds = [user_id];
    } else {
      return ApiError.badRequest("Provide user_id, broadcast: true, or role");
    }

    if (targetUserIds.length === 0) {
      return ok({ sent: 0, message: "No matching users found" });
    }

    await db.notification.createMany({
      data: targetUserIds.map((uid) => ({
        user_id: uid,
        type: NotificationType.admin_message,
        title: title.trim(),
        message: message.trim(),
      })),
    });

    return ok({ sent: targetUserIds.length });
  } catch (err) {
    console.error("[POST /api/admin/notifications]", err);
    return ApiError.internal();
  }
}
