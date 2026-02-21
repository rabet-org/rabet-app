import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/provider-applications/[id]/approve
 * Admin approves a pending provider application.
 * Triggers atomic creation of ProviderProfile and ProviderWallet, and grants 'provider' role.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: application_id } = await params;

    const body = await req.json().catch(() => ({}));
    const notes = body.notes || "Approved by admin";

    const application = await db.providerApplication.findUnique({
      where: { id: application_id },
      include: {
        user: { select: { id: true } },
      },
    });

    if (!application) {
      return ApiError.notFound("Provider application not found");
    }

    if (application.application_status !== "pending") {
      return ApiError.badRequest(
        `Cannot approve an application that is currently '${application.application_status}'`,
      );
    }

    // Atomic transaction (ERD Section 12.2)
    const result = await db.$transaction(async (tx) => {
      // 1. Mark application as approved
      const updatedApp = await tx.providerApplication.update({
        where: { id: application_id },
        data: {
          application_status: "approved",
          rejection_reason: null,
          updated_at: new Date(),
        },
      });

      // 2. Create the live Provider Profile (pulling static info from the app)
      const providerProfile = await tx.providerProfile.create({
        data: {
          user_id: application.user_id,
          application_id: application.id,
          description: application.description,
          portfolio_url: application.portfolio_url,
          is_verified: true, // Auto-verify on initial approval based on API_DESIGN
          verified_at: new Date(),
          is_active: true,
        },
      });

      // 3. Provision the Digital Wallet (starting at 0.00 balance)
      const providerWallet = await tx.providerWallet.create({
        data: {
          provider_id: providerProfile.id,
          balance: 0.0,
        },
      });

      // 4. Upgrade user's role to 'provider'
      await tx.user.update({
        where: { id: application.user_id },
        data: { role: "provider", updated_at: new Date() },
      });

      // 5. Create an Admin Audit Log
      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "approve_provider",
          target_type: "provider",
          target_id: application.id,
          details: {
            business_name: application.business_name,
            notes,
          },
        },
      });

      // 6. Notify the user they were approved
      await tx.notification.create({
        data: {
          user_id: application.user_id,
          type: "application_approved",
          title: "Application Approved!",
          message:
            "Congratulations, your provider application was approved. Your profile is now live.",
          metadata: { application_id, notes },
        },
      });

      return { updatedApp, providerProfile, providerWallet };
    });

    return ok({
      application_id: result.updatedApp.id,
      application_status: result.updatedApp.application_status,
      provider_profile_id: result.providerProfile.id,
      provider_wallet_id: result.providerWallet.id,
      approved_at: result.updatedApp.updated_at,
      message: "Application approved. Profile and wallet created.",
    });
  } catch (err) {
    if ((err as any).code === "P2002") {
      return ApiError.badRequest(
        "This user already has an active provider profile.",
      );
    }
    console.error("[POST /api/admin/provider-applications/[id]/approve]", err);
    return ApiError.internal();
  }
}
