import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";
import { authenticate, isAuthenticated } from "@/lib/auth";

export async function PATCH(
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

    const ticket = await db.supportTicket.update({
      where: { id },
      data: {
        status: body.status,
        priority: body.priority,
        assigned_to: body.assigned_to,
      },
    });

    return ok({ data: ticket });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return ApiError.internal("Failed to update ticket");
  }
}
