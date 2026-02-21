import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * POST /api/provider-applications
 * Submit a provider application. Client-only.
 */
export async function POST(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!isAuthenticated(user)) return user;

    // ── Only clients can apply ───────────────────────────
    if (user.role !== "client") {
      return ApiError.conflict("You are already a provider or admin");
    }

    // ── Check for existing application ───────────────────
    const existing = await db.providerApplication.findUnique({
      where: { user_id: user.sub },
    });
    if (existing) {
      return ApiError.conflict(
        existing.application_status === "approved"
          ? "Your application has already been approved"
          : "You already have a pending application",
      );
    }

    const body = await req.json();
    const {
      provider_type,
      business_name,
      description,
      portfolio_url,
      verification_docs,
    } = body;

    // ── Validation ───────────────────────────────────────
    if (!provider_type || !business_name || !description) {
      return ApiError.badRequest(
        "provider_type, business_name, and description are required",
      );
    }
    if (description.length < 100) {
      return ApiError.badRequest("Description must be at least 100 characters");
    }

    // ── Create application ───────────────────────────────
    const application = await db.providerApplication.create({
      data: {
        user_id: user.sub,
        provider_type,
        business_name,
        description,
        portfolio_url: portfolio_url ?? null,
        verification_docs: verification_docs ?? {},
        application_status: "pending",
      },
      include: {
        user: {
          select: {
            email: true,
            profile: { select: { full_name: true } },
          },
        },
      },
    });

    return ok(
      {
        id: application.id,
        user_id: application.user_id,
        provider_type: application.provider_type,
        business_name: application.business_name,
        applicant: {
          full_name: application.user.profile?.full_name ?? null,
          email: application.user.email,
        },
        application_status: application.application_status,
        created_at: application.created_at,
        message: "Application submitted. You will be notified once reviewed.",
      },
      201,
    );
  } catch (err) {
    console.error("[POST /api/provider-applications]", err);
    return ApiError.internal();
  }
}
