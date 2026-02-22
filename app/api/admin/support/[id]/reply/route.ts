import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";
import { authenticate, isAuthenticated } from "@/lib/auth";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await authenticate(req);
    if (!isAuthenticated(auth)) return auth;
    if (auth.role !== "admin") {
      return ApiError.forbidden();
    }

    const { id } = await params;
    const body = await req.json();

    const reply = await db.ticketReply.create({
      data: {
        ticket_id: id,
        user_id: auth.sub,
        message: body.message,
        is_admin: true,
      },
    });

    return ok({ data: reply });
  } catch (error) {
    console.error("Error creating reply:", error);
    return ApiError.internal("Failed to create reply");
  }
}
