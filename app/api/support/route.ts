import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/support
 * Get user's support tickets
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
    console.error("[GET /api/support]", err);
    return ApiError.internal();
  }
}

/**
 * POST /api/support
 * Create a new support ticket
 */
export async function POST(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const body = await req.json();
    const { subject, message, priority = "medium" } = body;

    if (!subject || !message) {
      return ApiError.badRequest("Subject and message are required");
    }

    const ticket = await db.supportTicket.create({
      data: {
        user_id: userPayload.sub,
        subject,
        message,
        priority,
        status: "open",
      },
      include: {
        replies: true,
      },
    });

    return ok({ data: ticket }, 201);
  } catch (err) {
    console.error("[POST /api/support]", err);
    return ApiError.internal();
  }
}
