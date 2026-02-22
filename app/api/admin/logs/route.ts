import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/logs
 * Fetches the chronological audit trail of all administrative actions.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);

    // Filters
    const adminId = searchParams.get("admin_id");
    const actionType = searchParams.get("action_type") as
      | Prisma.EnumAdminActionTypeFilter
      | undefined;

    // Valid target types derived from Prisma ENUM for target tracking (if strictly required)
    const targetType = searchParams.get("target_type");

    const startDateRaw = searchParams.get("start_date");
    const endDateRaw = searchParams.get("end_date");

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50")),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.AdminLogWhereInput = {};

    if (adminId) {
      where.admin_id = adminId;
    }

    if (actionType) {
      // Best effort enum match
      where.action_type = { equals: actionType as any };
    }

    if (targetType) {
      where.target_type = targetType;
    }

    if (startDateRaw || endDateRaw) {
      where.created_at = {};

      if (startDateRaw) {
        where.created_at.gte = new Date(startDateRaw);
      }

      if (endDateRaw) {
        where.created_at.lte = new Date(endDateRaw);
      }
    }

    const [logs, total] = await Promise.all([
      db.adminLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              profile: { select: { full_name: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.adminLog.count({ where }),
    ]);

    return ok({
      data: logs.map((log) => ({
        id: log.id,
        admin: {
          id: log.admin.id,
          email: log.admin.email,
          full_name: log.admin.profile?.full_name ?? "Admin User",
        },
        action_type: log.action_type,
        target_type: log.target_type,
        target_id: log.target_id,
        details: log.details,
        created_at: log.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/logs]", err);
    return ApiError.internal();
  }
}
