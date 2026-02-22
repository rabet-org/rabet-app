import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * POST /api/support/[id]/reply
 * Add a reply to a support ticket
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const { id } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message) {
      return ApiError.badRequest("Message is required");
    }

    // Verify ticket belongs to user
    const ticket = await db.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return ApiError.notFound("Ticket not found");
    }

    if (ticket.user_id !== userPayload.sub) {
      return ApiError.forbidden("You don't have permission to reply to this ticket");
    }

    const reply = await db.ticketReply.create({
      data: {
        ticket_id: id,
        user_id: userPayload.sub,
        message,
        is_admin: false,
      },
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
    });

    return ok({ data: reply }, 201);
  } catch (err) {
    console.error("[POST /api/support/[id]/reply]", err);
    return ApiError.internal();
  }
}
