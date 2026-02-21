import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>; // review_id
}

/**
 * DELETE /api/admin/reviews/[id]
 * Administrator force-deletes a review (Soft delete).
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: review_id } = await params;

    const body = await req.json().catch(() => ({}));
    const reason = body.reason;

    if (!reason) {
      return ApiError.badRequest(
        "You must provide a 'reason' for removing the review.",
      );
    }

    const review = await db.review.findUnique({
      where: { id: review_id },
      include: { client: true },
    });

    if (!review || review.deleted_at) {
      return ApiError.notFound("Review not found or already deleted.");
    }

    await db.$transaction(async (tx) => {
      await tx.review.update({
        where: { id: review_id },
        data: { deleted_at: new Date() },
      });

      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "remove_review",
          target_type: "review",
          target_id: review_id,
          details: {
            author_id: review.client_id,
            request_id: review.request_id,
            reason,
          },
        },
      });

      // Notify the author that their review was taken down
      await tx.notification.create({
        data: {
          user_id: review.client_id,
          type: "application_rejected", // Best fit
          title: "Review Removed",
          message: `Your review has been removed by a moderator. Reason: ${reason}`,
          metadata: { review_id, reason },
        },
      });
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/reviews/[id]]", err);
    return ApiError.internal();
  }
}
