import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/admin/providers
 * List all providers with their details
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20"))
    );
    const skip = (page - 1) * limit;

    const [providers, total] = await Promise.all([
      db.providerProfile.findMany({
        include: {
          user: {
            select: {
              email: true,
              profile: {
                select: {
                  full_name: true,
                },
              },
            },
          },
          application: {
            select: {
              provider_type: true,
              business_name: true,
            },
          },
          wallet: {
            select: {
              balance: true,
              currency: true,
            },
          },
          _count: {
            select: {
              reviews: true,
              unlocks: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.providerProfile.count(),
    ]);

    return ok({
      data: providers,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/providers]", err);
    return ApiError.internal();
  }
}
