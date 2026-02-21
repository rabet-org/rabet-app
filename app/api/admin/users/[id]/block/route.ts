import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>; // user_id
}

/**
 * POST /api/admin/users/[id]/block
 * Admin blocks a user from the platform.
 */
export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: user_id } = await params;

    const body = await req.json().catch(() => ({}));
    const reason = body.reason;

    if (!reason) {
      return ApiError.badRequest(
        "You must provide a 'reason' for blocking the user.",
      );
    }

    const user = await db.user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return ApiError.notFound("User not found");
    }

    if (user.is_blocked) {
      return ApiError.badRequest("User is already blocked");
    }

    if (user.id === userPayload.sub) {
      return ApiError.badRequest("You cannot block yourself");
    }

    const result = await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user_id },
        data: { is_blocked: true },
      });

      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "block_user",
          target_type: "user",
          target_id: user_id,
          details: { reason },
        },
      });

      return updatedUser;
    });

    return ok({
      user_id: result.id,
      is_blocked: result.is_blocked,
    });
  } catch (err) {
    console.error("[POST /api/admin/users/[id]/block]", err);
    return ApiError.internal();
  }
}

/**
 * DELETE /api/admin/users/[id]/block
 * Admin unblocks a user.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: user_id } = await params;

    const user = await db.user.findUnique({
      where: { id: user_id },
    });

    if (!user) {
      return ApiError.notFound("User not found");
    }

    if (!user.is_blocked) {
      return ApiError.badRequest("User is not blocked");
    }

    const result = await db.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user_id },
        data: { is_blocked: false },
      });

      await tx.adminLog.create({
        data: {
          admin_id: userPayload.sub,
          action_type: "unblock_user",
          target_type: "user",
          target_id: user_id,
          details: { reason: "Manual unblock by admin" },
        },
      });

      return updatedUser;
    });

    return ok({
      user_id: result.id,
      is_blocked: result.is_blocked,
    });
  } catch (err) {
    console.error("[DELETE /api/admin/users/[id]/block]", err);
    return ApiError.internal();
  }
}
