import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";
import { authenticate, isAuthenticated } from "@/lib/auth";

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!isAuthenticated(auth)) return auth;
    if (auth.role !== "admin") {
      return ApiError.forbidden();
    }

    const messages = await db.broadcastMessage.findMany({
      orderBy: { created_at: "desc" },
      take: 50,
    });

    return ok({ data: messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return ApiError.internal("Failed to fetch messages");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await authenticate(req);
    if (!isAuthenticated(auth)) return auth;
    if (auth.role !== "admin") {
      return ApiError.forbidden();
    }

    const body = await req.json();
    const { title, message, target_role } = body;

    if (!title || !message || !target_role) {
      return ApiError.badRequest("Missing required fields");
    }

    // Find target users
    const whereClause =
      target_role === "all" ? {} : { role: target_role as any };

    const targetUsers = await db.user.findMany({
      where: whereClause,
      select: { id: true },
    });

    // Create broadcast message record
    const broadcastMessage = await db.broadcastMessage.create({
      data: {
        title,
        message,
        target_role,
        sent_count: targetUsers.length,
        sent_by: auth.sub,
      },
    });

    // Create notifications for all target users
    const notifications = targetUsers.map((user) => ({
      user_id: user.id,
      type: "admin_message" as const,
      title,
      message,
      metadata: {
        broadcast_id: broadcastMessage.id,
      },
    }));

    await db.notification.createMany({
      data: notifications,
    });

    return ok({ data: broadcastMessage });
  } catch (error) {
    console.error("Error sending message:", error);
    return ApiError.internal("Failed to send message");
  }
}
