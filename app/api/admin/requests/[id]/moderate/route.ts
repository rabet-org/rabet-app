import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>; // request_id
}

/**
 * PATCH /api/admin/requests/[id]/moderate
 * Admin force-modifies a request (e.g. canceling it due to TOS violations).
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: request_id } = await params;

    const body = await req.json().catch(() => ({}));
    const { status, reason } = body;

    if (!status || !reason) {
      return ApiError.badRequest(
        "You must provide both 'status' and 'reason' for moderation.",
      );
    }

    const targetRequest = await db.request.findUnique({
      where: { id: request_id },
    });

    if (!targetRequest) {
      return ApiError.notFound("Request not found");
    }

    // Usually used to force 'cancelled'
    const result = await db.$transaction(async (tx) => {
      const updatedRequest = await tx.request.update({
        where: { id: request_id },
        data: { status },
      });

      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "moderate_request",
          target_type: "request",
          target_id: request_id,
          details: {
            previous_status: targetRequest.status,
            new_status: status,
            reason,
          },
        },
      });

      // Send generic notification to the client
      await tx.notification.create({
        data: {
          user_id: targetRequest.user_id,
          type: "request_status_changed", // Best fit
          title: "Request Moderated by Admin",
          message: `Your request '${targetRequest.title}' has been marked as ${status}. Reason: ${reason}`,
          metadata: { request_id },
        },
      });

      return updatedRequest;
    });

    return ok({
      id: result.id,
      title: result.title,
      status: result.status,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/requests/[id]/moderate]", err);
    return ApiError.internal();
  }
}
