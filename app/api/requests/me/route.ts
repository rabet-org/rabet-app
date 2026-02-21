import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/requests/me
 * Client fetches their own service requests.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "client", "admin");
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    const where = { user_id: userPayload.sub };

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        include: {
          category: {
            select: { name: true, slug: true },
          },
          _count: {
            select: { unlocks: true },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.request.count({ where }),
    ]);

    return ok({
      data: requests.map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        category: r.category,
        budget_range: r.budget_range,
        location: r.location,
        status: r.status,
        deadline: r.deadline,
        unlock_fee: r.unlock_fee.toNumber(),
        total_unlocks: r._count.unlocks,
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/requests/me]", err);
    return ApiError.internal();
  }
}
