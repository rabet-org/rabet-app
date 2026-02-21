import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/provider-applications/[id]/review
 * Admin-only: approve or reject a provider application.
 * Body: { "action": "approve" | "reject", "rejection_reason"?: string }
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const user = await authenticate(req);
    if (!isAuthenticated(user)) return user;

    const roleError = requireRole(user, "admin");
    if (roleError) return roleError;

    const { id } = await params;
    const body = await req.json();
    const { action, rejection_reason } = body;

    if (!["approve", "reject"].includes(action)) {
      return ApiError.badRequest('action must be "approve" or "reject"');
    }
    if (action === "reject" && !rejection_reason) {
      return ApiError.badRequest("rejection_reason is required when rejecting");
    }

    // ── Find the application ─────────────────────────────
    const application = await db.providerApplication.findUnique({
      where: { id },
      include: { user: { select: { id: true, email: true } } },
    });

    if (!application) {
      return ApiError.notFound("Application not found");
    }
    if (application.application_status !== "pending") {
      return ApiError.conflict(
        `Application is already ${application.application_status}`,
      );
    }

    if (action === "approve") {
      // ── Atomic: update application + create profile + wallet + update user role
      const [updatedApp, profile] = await db.$transaction([
        db.providerApplication.update({
          where: { id },
          data: {
            application_status: "approved",
            reviewed_by: user.sub,
            reviewed_at: new Date(),
          },
        }),
        db.providerProfile.create({
          data: {
            user_id: application.user_id,
            application_id: application.id,
            description: application.description,
            portfolio_url: application.portfolio_url,
          },
        }),
        db.user.update({
          where: { id: application.user_id },
          data: { role: "provider" },
        }),
        // Notify the user
        db.notification.create({
          data: {
            user_id: application.user_id,
            type: "application_approved",
            title: "Application Approved!",
            message: `Your provider application for "${application.business_name}" has been approved. You can now access your provider dashboard.`,
          },
        }),
      ]);

      // Create wallet linked to the provider profile
      await db.providerWallet.create({
        data: {
          provider_id: profile.id,
        },
      });

      return ok({
        id: updatedApp.id,
        application_status: "approved",
        reviewed_at: updatedApp.reviewed_at,
        message: "Application approved. Provider profile and wallet created.",
      });
    } else {
      // ── Reject ────────────────────────────────────────
      const [updatedApp] = await db.$transaction([
        db.providerApplication.update({
          where: { id },
          data: {
            application_status: "rejected",
            rejection_reason,
            reviewed_by: user.sub,
            reviewed_at: new Date(),
          },
        }),
        db.notification.create({
          data: {
            user_id: application.user_id,
            type: "application_rejected",
            title: "Application Rejected",
            message: `Your provider application for "${application.business_name}" was not approved. Reason: ${rejection_reason}`,
          },
        }),
      ]);

      return ok({
        id: updatedApp.id,
        application_status: "rejected",
        rejection_reason,
        reviewed_at: updatedApp.reviewed_at,
        message: "Application rejected. User has been notified.",
      });
    }
  } catch (err) {
    console.error("[PATCH /api/provider-applications/[id]/review]", err);
    return ApiError.internal();
  }
}
