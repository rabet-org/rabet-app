import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { AdminActionType } from "@prisma/client";

/**
 * DELETE /api/admin/admins/[id]
 * Revokes admin privileges — downgrades role to "client" and writes an audit log.
 * An admin cannot remove themselves.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actorPayload = await authenticate(req);
    if (!isAuthenticated(actorPayload)) return actorPayload;

    const roleError = requireRole(actorPayload, "admin");
    if (roleError) return roleError;

    const { id } = await params;

    if (actorPayload.sub === id) {
      return ApiError.badRequest("You cannot remove your own admin privileges");
    }

    const target = await db.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        email: true,
        profile: { select: { full_name: true } },
      },
    });

    if (!target) return ApiError.notFound("User not found");
    if (target.role !== "admin") {
      return ApiError.badRequest("This user is not an admin");
    }

    await db.$transaction(async (tx) => {
      await tx.user.update({
        where: { id },
        data: { role: "client" },
      });

      await tx.adminLog.create({
        data: {
          admin_id: actorPayload.sub,
          action_type: AdminActionType.remove_admin,
          target_type: "user",
          target_id: id,
          details: {
            email: target.email,
            full_name: target.profile?.full_name,
            removed_by: actorPayload.email,
          },
        },
      });
    });

    return ok({ message: "Admin privileges revoked" });
  } catch (err) {
    console.error("[DELETE /api/admin/admins/[id]]", err);
    return ApiError.internal();
  }
}
