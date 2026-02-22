import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/provider-applications
 * Admin endpoint to list provider applications.
 * Query: ?status=pending&provider_type=agency&page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);

    const statusParam = searchParams.get("status");
    let applicationStatus: Prisma.EnumApplicationStatusFilter | undefined =
      undefined;
    if (["pending", "approved", "rejected"].includes(statusParam || "")) {
      applicationStatus = { equals: statusParam as any };
    }

    const providerTypeParam = searchParams.get("provider_type");
    let providerType: Prisma.EnumProviderTypeFilter | undefined = undefined;
    if (["agency"].includes(providerTypeParam || "")) {
      providerType = { equals: providerTypeParam as any };
    }

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.ProviderApplicationWhereInput = {
      ...(applicationStatus && { application_status: applicationStatus }),
      ...(providerType && { provider_type: providerType }),
    };

    const [applications, total] = await Promise.all([
      db.providerApplication.findMany({
        where,
        include: {
          user: {
            select: {
              email: true,
              profile: {
                select: {
                  full_name: true,
                  phone: true,
                },
              },
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
        provider_type: app.provider_type,
        business_name: app.business_name,
        description: app.description,
        portfolio_url: app.portfolio_url,
        application_status: app.application_status,
        rejection_reason: app.rejection_reason,
        reviewed_at: app.reviewed_at,
        created_at: app.created_at,
        applicant: {
          id: app.user_id,
          email: app.user.email,
          full_name: app.user.profile?.full_name,
          phone: app.user.profile?.phone,
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
    console.error("[GET /api/admin/provider-applications]", err);
    return ApiError.internal();
  }
}
