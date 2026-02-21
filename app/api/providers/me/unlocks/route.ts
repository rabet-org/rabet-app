import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/providers/me/unlocks
 * Provider fetches the list of leads they have successfully unlocked.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "provider", "admin");
    if (roleError) return roleError;

    // We must find the user's specific provider profile ID first
    const profile = await db.providerProfile.findUnique({
      where: { user_id: userPayload.sub },
    });

    if (!profile) {
      return ApiError.notFound("Provider profile not found");
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    const where = { provider_id: profile.id, status: "completed" as any };

    const [unlocks, total] = await Promise.all([
      db.leadUnlock.findMany({
        where,
        include: {
          request: {
            include: {
              category: { select: { name: true, slug: true } },
              user: {
                select: {
                  email: true,
                  profile: { select: { full_name: true, phone: true } },
                },
              },
            },
          },
        },
        orderBy: { unlocked_at: "desc" },
        skip,
        take: limit,
      }),
      db.leadUnlock.count({ where }),
    ]);

    return ok({
      data: unlocks.map((u) => ({
        id: u.id,
        unlock_fee: u.unlock_fee.toNumber(),
        status: u.status,
        unlocked_at: u.unlocked_at,
        request: {
          id: u.request.id,
          title: u.request.title,
          category: u.request.category,
          budget_range: u.request.budget_range,
          client: {
            full_name: u.request.user.profile?.full_name ?? "Client",
            email: u.request.user.email,
            phone: u.request.user.profile?.phone ?? null,
          },
        },
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/providers/me/unlocks]", err);
    return ApiError.internal();
  }
}
