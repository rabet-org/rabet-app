import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>; // This is the request_id
}

/**
 * POST /api/requests/[id]/reviews
 * Client reviews a provider who unlocked this request.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "client", "admin");
    if (roleError) return roleError;

    const { id: request_id } = await params;

    // Ensure the client owns this request
    const targetRequest = await db.request.findUnique({
      where: { id: request_id },
    });

    if (!targetRequest) {
      return ApiError.notFound("Service request not found");
    }

    if (targetRequest.user_id !== userPayload.sub) {
      return ApiError.forbidden(
        "You can only review providers on your own requests",
      );
    }

    const body = await req.json();
    const { provider_id, rating, comment } = body;

    if (
      !provider_id ||
      typeof rating !== "number" ||
      rating < 1 ||
      rating > 5
    ) {
      return ApiError.badRequest(
        "Valid provider_id and rating (1-5) are required",
      );
    }

    // Ensure the provider actually paid to unlock this lead
    // A client cannot review a provider they never interacted with
    const unlockRecord = await db.leadUnlock.findUnique({
      where: {
        request_id_provider_id: {
          request_id,
          provider_id,
        },
      },
    });

    if (!unlockRecord || unlockRecord.status !== "completed") {
      return ApiError.forbidden(
        "You can only review providers who successfully unlocked this request",
      );
    }

    // Prevent duplicate reviews
    const existingReview = await db.review.findFirst({
      where: { request_id, provider_id },
    });

    if (existingReview) {
      return ApiError.badRequest(
        "You have already reviewed this provider for this request",
      );
    }

    const newReview = await db.review.create({
      data: {
        request_id,
        client_id: userPayload.sub,
        provider_id,
        rating,
        comment,
      },
    });

    return ok(
      {
        id: newReview.id,
        request_id: newReview.request_id,
        provider_id: newReview.provider_id,
        rating: newReview.rating,
        comment: newReview.comment,
        created_at: newReview.created_at,
        updated_at: newReview.updated_at,
      },
      201,
    );
  } catch (err) {
    console.error("[POST /api/requests/[id]/reviews]", err);
    return ApiError.internal();
  }
}
