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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const tickets = await db.supportTicket.findMany({
      where: status && status !== "all" ? { status: status as any } : {},
      include: {
        user: {
          include: {
            profile: true,
          },
        },
        replies: {
          include: {
            user: {
              include: {
                profile: true,
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

    const formattedTickets = tickets.map((ticket) => ({
      id: ticket.id,
      user_name: ticket.user.profile?.full_name || "Unknown",
      user_email: ticket.user.email,
      subject: ticket.subject,
      message: ticket.message,
      status: ticket.status,
      priority: ticket.priority,
      created_at: ticket.created_at.toISOString(),
      replies: ticket.replies.map((reply) => ({
        id: reply.id,
        message: reply.message,
        is_admin: reply.is_admin,
        user_name: reply.user.profile?.full_name || "Unknown",
        created_at: reply.created_at.toISOString(),
      })),
    }));

    return ok({ data: formattedTickets });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return ApiError.internal("Failed to fetch support tickets");
  }
}
