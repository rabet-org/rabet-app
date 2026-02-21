import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/provider-applications/me
 * Get the current user's provider application.
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!isAuthenticated(user)) return user;

    const application = await db.providerApplication.findUnique({
      where: { user_id: user.sub },
    });

    if (!application) {
      return ApiError.notFound("No application found");
    }

    return ok({
      id: application.id,
      provider_type: application.provider_type,
      business_name: application.business_name,
      description: application.description,
      portfolio_url: application.portfolio_url,
      verification_docs: application.verification_docs,
      application_status: application.application_status,
      rejection_reason: application.rejection_reason,
      created_at: application.created_at,
      updated_at: application.updated_at,
    });
  } catch (err) {
    console.error("[GET /api/provider-applications/me]", err);
    return ApiError.internal();
  }
}

/**
 * PATCH /api/provider-applications/me
 * Update a pending/rejected application. Cannot update approved/under-review apps.
 */
export async function PATCH(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!isAuthenticated(user)) return user;

    const application = await db.providerApplication.findUnique({
      where: { user_id: user.sub },
    });

    if (!application) {
      return ApiError.notFound("No application found");
    }

    // Only allow editing pending or rejected applications
    if (!["pending", "rejected"].includes(application.application_status)) {
      return ApiError.forbidden(
        `Cannot update application with status: ${application.application_status}`,
      );
    }

    const body = await req.json();
    const { description, portfolio_url, verification_docs, business_name } =
      body;

    // Validate description length if updating
    if (description !== undefined && description.length < 100) {
      return ApiError.badRequest("Description must be at least 100 characters");
    }

    const updated = await db.providerApplication.update({
      where: { user_id: user.sub },
      data: {
        ...(description !== undefined && { description }),
        ...(portfolio_url !== undefined && { portfolio_url }),
        ...(verification_docs !== undefined && { verification_docs }),
        ...(business_name !== undefined && { business_name }),
        // If re-submitting after rejection, reset to pending
        ...(application.application_status === "rejected" && {
          application_status: "pending",
          rejection_reason: null,
        }),
      },
    });

    return ok({
      id: updated.id,
      provider_type: updated.provider_type,
      business_name: updated.business_name,
      description: updated.description,
      portfolio_url: updated.portfolio_url,
      verification_docs: updated.verification_docs,
      application_status: updated.application_status,
      rejection_reason: updated.rejection_reason,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    });
  } catch (err) {
    console.error("[PATCH /api/provider-applications/me]", err);
    return ApiError.internal();
  }
}
