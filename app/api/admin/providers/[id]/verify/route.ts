import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/providers/[id]/verify
 * Grants a verified badge to a provider.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: provider_id } = await params;

    const provider = await db.providerProfile.findUnique({
      where: { id: provider_id },
      include: { application: true },
    });

    if (!provider) {
      return ApiError.notFound("Provider profile not found");
    }

    if (provider.is_verified) {
      return ApiError.badRequest("Provider is already verified");
    }

    const result = await db.$transaction(async (tx) => {
      const updatedProvider = await tx.providerProfile.update({
        where: { id: provider_id },
        data: {
          is_verified: true,
          verified_at: new Date(),
        },
      });

      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "verify_provider",
          target_type: "provider",
          target_id: provider.id,
          details: {
            business_name: provider.application.business_name,
          },
        },
      });

      await tx.notification.create({
        data: {
          user_id: provider.user_id,
          type: "application_approved", // Best fit from current typical enums
          title: "Profile Verified",
          message:
            "Your provider profile has been verified and awarded the verified badge.",
          metadata: { provider_id },
        },
      });

      return updatedProvider;
    });

    return ok({
      provider_id: result.id,
      is_verified: result.is_verified,
      verified_at: result.verified_at,
    });
  } catch (err) {
    console.error("[POST /api/admin/providers/[id]/verify]", err);
    return ApiError.internal();
  }
}

/**
 * DELETE /api/admin/providers/[id]/verify
 * Removes the verified badge from a provider.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: provider_id } = await params;

    const body = await req.json().catch(() => ({}));
    const reason = body.reason;

    if (!reason) {
      return ApiError.badRequest(
        "You must provide a 'reason' for unverifying the provider.",
      );
    }

    const provider = await db.providerProfile.findUnique({
      where: { id: provider_id },
      include: { application: true },
    });

    if (!provider) {
      return ApiError.notFound("Provider profile not found");
    }

    if (!provider.is_verified) {
      return ApiError.badRequest("Provider is not verified");
    }

    const result = await db.$transaction(async (tx) => {
      const updatedProvider = await tx.providerProfile.update({
        where: { id: provider_id },
        data: {
          is_verified: false,
          verified_at: null,
        },
      });

      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "unverify_provider",
          target_type: "provider",
          target_id: provider.id,
          details: {
            business_name: provider.application.business_name,
            reason,
          },
        },
      });

      await tx.notification.create({
        data: {
          user_id: provider.user_id,
          type: "application_rejected", // Best fit
          title: "Verification Revoked",
          message: `Your verified badge has been removed. Reason: ${reason}`,
          metadata: { provider_id, reason },
        },
      });

      return updatedProvider;
    });

    return ok({
      provider_id: result.id,
      is_verified: result.is_verified,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/providers/[id]/verify]", err);
    return ApiError.internal();
  }
}
