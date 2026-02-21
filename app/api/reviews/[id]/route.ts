import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>; // review_id
}

/**
 * Helper to check if a review is editable (within 30 days of creation)
 */
function isEditable(createdAt: Date): boolean {
  const thirtyDaysInMs = 30 * 24 * 60 * 60 * 1000;
  return new Date().getTime() - createdAt.getTime() <= thirtyDaysInMs;
}

/**
 * PATCH /api/reviews/[id]
 * Client updates their own review within the 30-day window.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "client", "admin");
    if (roleError) return roleError;

    const { id } = await params;

    const existingReview = await db.review.findUnique({
      where: { id },
    });

    if (!existingReview || existingReview.deleted_at) {
      return ApiError.notFound("Review not found");
    }

    if (
      existingReview.client_id !== userPayload.sub &&
      userPayload.role !== "admin"
    ) {
      return ApiError.forbidden(
        "You do not have permission to edit this review",
      );
    }

    if (
      !isEditable(existingReview.created_at) &&
      userPayload.role !== "admin"
    ) {
      return ApiError.forbidden(
        "Reviews can only be edited within 30 days of creation",
      );
    }

    const body = await req.json();
    const { rating, comment } = body;

    if (
      rating !== undefined &&
      (typeof rating !== "number" || rating < 1 || rating > 5)
    ) {
      return ApiError.badRequest("Rating must be a number between 1 and 5");
    }

    const updated = await db.review.update({
      where: { id },
      data: {
        ...(rating !== undefined && { rating }),
        ...(comment !== undefined && { comment }),
      },
    });

    return ok({
      id: updated.id,
      request_id: updated.request_id,
      provider_id: updated.provider_id,
      rating: updated.rating,
      comment: updated.comment,
      created_at: updated.created_at,
      updated_at: updated.updated_at,
    });
  } catch (err) {
    console.error("[PATCH /api/reviews/[id]]", err);
    return ApiError.internal();
  }
}

/**
 * DELETE /api/reviews/[id]
 * Client deletes their review (Soft delete).
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "client", "admin");
    if (roleError) return roleError;

    const { id } = await params;

    const existingReview = await db.review.findUnique({
      where: { id },
    });

    if (!existingReview || existingReview.deleted_at) {
      return ApiError.notFound("Review not found");
    }

    if (
      existingReview.client_id !== userPayload.sub &&
      userPayload.role !== "admin"
    ) {
      return ApiError.forbidden(
        "You do not have permission to delete this review",
      );
    }

    if (
      !isEditable(existingReview.created_at) &&
      userPayload.role !== "admin"
    ) {
      return ApiError.forbidden(
        "Reviews can only be deleted within 30 days of creation",
      );
    }

    await db.review.update({
      where: { id },
      data: { deleted_at: new Date() },
    });

    // Per protocol, 204 No Content for successful deletion
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/reviews/[id]]", err);
    return ApiError.internal();
  }
}
