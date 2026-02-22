import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/admin/requests
 * Admin endpoint to list all service requests regardless of status.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const requests = await db.request.findMany({
      include: {
        category: {
          select: { name: true, slug: true },
        },
        user: {
          select: {
            id: true,
            email: true,
            created_at: true,
            profile: {
              select: { full_name: true, phone: true },
            },
          },
        },
        unlocks: {
          select: {
            id: true,
            unlocked_at: true,
            provider: {
              select: {
                user_id: true,
                user: { select: { email: true } },
              },
            },
          },
          orderBy: { unlocked_at: "desc" },
        },
      },
      orderBy: { created_at: "desc" },
      take: 100, // Reasonable default for admin view, could add pagination later
    });

    const formattedRequests = requests.map((request) => ({
      id: request.id,
      title: request.title,
      description: request.description,
      category: request.category,
      client: {
        id: request.user.id,
        email: request.user.email,
        full_name: request.user.profile?.full_name || null,
        phone: request.user.profile?.phone || null,
        created_at: request.user.created_at.toISOString(),
      },
      budget_range: request.budget_range,
      location: request.location,
      status: request.status,
      deadline: request.deadline?.toISOString() || null,
      unlock_fee: request.unlock_fee.toNumber(),
      total_unlocks: request.unlocks.length,
      unlocks: request.unlocks.map((u) => ({
        id: u.id,
        unlocked_at: u.unlocked_at.toISOString(),
        provider: u.provider,
      })),
      created_at: request.created_at.toISOString(),
      updated_at: request.updated_at.toISOString(),
    }));

    return ok({ data: formattedRequests });
  } catch (err) {
    console.error("[GET /api/admin/requests]", err);
    return ApiError.internal();
  }
}
