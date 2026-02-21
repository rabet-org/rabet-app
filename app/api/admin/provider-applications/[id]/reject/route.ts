import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/provider-applications/[id]/reject
 * Admin rejects a pending provider application.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: application_id } = await params;

    const body = await req.json().catch(() => ({}));
    const rejection_reason = body.rejection_reason;

    if (!rejection_reason) {
      return ApiError.badRequest("You must provide a 'rejection_reason'");
    }

    const application = await db.providerApplication.findUnique({
      where: { id: application_id },
    });

    if (!application) {
      return ApiError.notFound("Provider application not found");
    }

    if (application.application_status !== "pending") {
      return ApiError.badRequest(
        `Cannot reject an application that is currently '${application.application_status}'`,
      );
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Mark as rejected
      const updatedApp = await tx.providerApplication.update({
        where: { id: application_id },
        data: {
          application_status: "rejected",
          rejection_reason,
          updated_at: new Date(),
        },
      });

      // 2. Audit Log
      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "reject_provider",
          target_type: "provider",
          target_id: application.id,
          details: {
            business_name: application.business_name,
            rejection_reason,
          },
        },
      });

      // 3. Notify the user
      await tx.notification.create({
        data: {
          user_id: application.user_id,
          type: "application_rejected",
          title: "Application Rejected",
          message: `Your provider application was rejected. Reason: ${rejection_reason}`,
          metadata: { application_id, rejection_reason },
        },
      });

      return updatedApp;
    });

    return ok({
      application_id: result.id,
      application_status: result.application_status,
      rejection_reason: result.rejection_reason,
      rejected_at: result.updated_at,
    });
  } catch (err) {
    console.error("[POST /api/admin/provider-applications/[id]/reject]", err);
    return ApiError.internal();
  }
}
