import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/requests/me/[id]
 * Client updates or cancels their own request.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "client", "admin");
    if (roleError) return roleError;

    const { id } = await params;
    const body = await req.json();
    const { title, description, budget_range, location, deadline, status } =
      body;

    const existingRequest = await db.request.findUnique({
      where: { id },
    });

    if (!existingRequest) {
      return ApiError.notFound("Request not found");
    }

    if (existingRequest.user_id !== userPayload.sub) {
      return ApiError.forbidden(
        "You do not have permission to edit this request",
      );
    }

    // Only allow editing if the status is draft or published.
    // Cannot edit an in_progress, completed, or cancelled request.
    if (!["draft", "published"].includes(existingRequest.status)) {
      return ApiError.badRequest(
        `Cannot edit a request with status: ${existingRequest.status}`,
      );
    }

    // Validate if status is being updated (only allow moving to cancelled manually)
    if (status && !["published", "cancelled"].includes(status)) {
      return ApiError.badRequest(
        "Clients can only update status to 'published' or 'cancelled'",
      );
    }

    const updated = await db.request.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(budget_range !== undefined && { budget_range }),
        ...(location !== undefined && { location }),
        ...(deadline !== undefined && {
          deadline: deadline ? new Date(deadline) : null,
        }),
        ...(status !== undefined && { status }),
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
        _count: {
          select: { unlocks: true },
        },
      },
    });

    return ok({
      id: updated.id,
      title: updated.title,
      description: updated.description,
      category: updated.category,
      budget_range: updated.budget_range,
      location: updated.location,
      status: updated.status,
      deadline: updated.deadline,
      unlock_fee: updated.unlock_fee.toNumber(),
      total_unlocks: updated._count.unlocks,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    });
  } catch (err) {
    console.error("[PATCH /api/requests/me/[id]]", err);
    return ApiError.internal();
  }
}
