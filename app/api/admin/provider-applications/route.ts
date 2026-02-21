import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { ApplicationStatus } from "@prisma/client";

/**
 * GET /api/admin/provider-applications
 * Admin-only: list all provider applications with filtering.
 * Query: ?status=pending&page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const user = await authenticate(req);
    if (!isAuthenticated(user)) return user;

    const roleError = requireRole(user, "admin");
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") as ApplicationStatus | null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    const where = status ? { application_status: status } : {};

    const [applications, total] = await Promise.all([
      db.providerApplication.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              profile: { select: { full_name: true, phone: true } },
            },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.providerApplication.count({ where }),
    ]);

    return ok({
      data: applications.map((app) => ({
        id: app.id,
        user_id: app.user_id,
        provider_type: app.provider_type,
        business_name: app.business_name,
        description: app.description,
        portfolio_url: app.portfolio_url,
        verification_docs: app.verification_docs,
        application_status: app.application_status,
        rejection_reason: app.rejection_reason,
        applicant: {
          full_name: app.user.profile?.full_name ?? null,
          email: app.user.email,
          phone: app.user.profile?.phone ?? null,
        },
        created_at: app.created_at,
        updated_at: app.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/provider-applications]", err);
    return ApiError.internal();
  }
}
