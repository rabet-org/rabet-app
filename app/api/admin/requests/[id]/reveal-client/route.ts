import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>; // request_id
}

/**
 * POST /api/admin/requests/[id]/reveal-client
 * Logs that an admin revealed the client's PII for this request.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: request_id } = await params;

    const targetRequest = await db.request.findUnique({
      where: { id: request_id },
      select: { user_id: true },
    });

    if (!targetRequest) {
      return ApiError.notFound("Request not found");
    }

    // Log the action for audit trail
    await db.adminLog.create({
      data: {
        admin_id: userPayload.sub,
        action_type: "moderate_request",
        target_type: "request",
        target_id: request_id,
        details: {
          action: "view_client_pii",
          client_id: targetRequest.user_id,
          reason:
            "Admin explicitly revealed client info in request details modal",
        },
      },
    });

    return ok({ success: true });
  } catch (err) {
    console.error("[POST /api/admin/requests/[id]/reveal-client]", err);
    return ApiError.internal();
  }
}
