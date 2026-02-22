import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/users
 * Returns a paginated list of all users on the platform (clients, providers, admins).
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const roleParam = searchParams.get("role");
    const isBlockedParam = searchParams.get("is_blocked");
    const searchParam = searchParams.get("search");

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50")),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (roleParam && ["client", "provider", "admin"].includes(roleParam)) {
      where.role = { equals: roleParam as any };
    }

    if (isBlockedParam !== null && isBlockedParam !== "") {
      where.is_blocked = isBlockedParam === "true";
    }

    if (searchParam) {
      where.OR = [
        { id: { contains: searchParam, mode: "insensitive" } },
        { email: { contains: searchParam, mode: "insensitive" } },
        {
          profile: {
            full_name: { contains: searchParam, mode: "insensitive" },
          },
        },
      ];
    }

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          is_blocked: true,
          is_active: true,
          email_verified: true,
          email_verified_at: true,
          created_at: true,
          profile: {
            select: {
              full_name: true,
              phone: true,
              avatar_url: true,
            },
          },
          _count: {
            select: {
              requests: true,
            },
          },
          provider_profile: {
            select: {
              is_verified: true,
              wallet: {
                select: {
                  balance: true,
                  currency: true,
                },
              },
              subscription: {
                select: {
                  plan_type: true,
                  status: true,
                },
              },
              _count: {
                select: {
                  reviews: true,
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.user.count({ where }),
    ]);

    return ok({
      data: users,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/users]", err);
    return ApiError.internal();
  }
}
