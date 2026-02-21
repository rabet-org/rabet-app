import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/providers/me
 * Get the current user's provider profile.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "provider", "admin");
    if (roleError) return roleError;

    const profile = await db.providerProfile.findUnique({
      where: { user_id: userPayload.sub },
      include: {
        application: {
          select: {
            provider_type: true,
            business_name: true,
          },
        },
        user: {
          select: {
            email: true,
            profile: { select: { full_name: true } },
          },
        },
        services: {
          include: {
            category: {
              select: { id: true, slug: true, name: true },
            },
          },
        },
        reviews: {
          select: { rating: true },
        },
        unlocks: {
          select: { id: true },
        },
      },
    });

    if (!profile) {
      return ApiError.notFound("Provider profile not found");
    }

    // Calculate aggregates
    const total_reviews = profile.reviews.length;
    const average_rating =
      total_reviews > 0
        ? profile.reviews.reduce((sum, r) => sum + r.rating, 0) / total_reviews
        : 0;

    return ok({
      id: profile.id,
      provider_type: profile.application.provider_type,
      business_name: profile.application.business_name,
      full_name: profile.user.profile?.full_name ?? null,
      description: profile.description,
      portfolio_url: profile.portfolio_url,
      services: profile.services.map((s) => ({
        category_id: s.category.id,
        slug: s.category.slug,
        name: s.category.name,
      })),
      is_verified: profile.is_verified,
      verified_at: profile.verified_at,
      average_rating,
      total_reviews,
      total_unlocks: profile.unlocks.length,
      created_at: profile.created_at,
    });
  } catch (err) {
    console.error("[GET /api/providers/me]", err);
    return ApiError.internal();
  }
}

/**
 * PATCH /api/providers/me
 * Update the current user's provider profile.
 */
export async function PATCH(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "provider", "admin");
    if (roleError) return roleError;

    const body = await req.json();
    const { description, portfolio_url, service_category_ids } = body;

    const profile = await db.providerProfile.findUnique({
      where: { user_id: userPayload.sub },
    });

    if (!profile) {
      return ApiError.notFound("Provider profile not found");
    }

    // Atomic update of profile details and replacing services completely if provided
    const updatedProfile = await db.$transaction(async (tx) => {
      // 1. Update basic fields
      const updated = await tx.providerProfile.update({
        where: { id: profile.id },
        data: {
          ...(description !== undefined && { description }),
          ...(portfolio_url !== undefined && { portfolio_url }),
        },
        include: {
          application: {
            select: {
              provider_type: true,
              business_name: true,
            },
          },
          user: {
            select: {
              email: true,
              profile: { select: { full_name: true } },
            },
          },
          reviews: { select: { rating: true } },
          unlocks: { select: { id: true } },
        },
      });

      // 2. Synchronize services if passed
      if (Array.isArray(service_category_ids)) {
        // Find valid categories
        const categories = await tx.category.findMany({
          where: { id: { in: service_category_ids } },
          select: { id: true },
        });
        const validCategoryIds = categories.map((c) => c.id);

        // Delete existing services
        await tx.providerService.deleteMany({
          where: { provider_id: profile.id },
        });

        // Insert new services
        if (validCategoryIds.length > 0) {
          await tx.providerService.createMany({
            data: validCategoryIds.map((categoryId) => ({
              provider_id: profile.id,
              category_id: categoryId,
            })),
          });
        }
      }

      // Fetch the updated services to return
      const finalServices = await tx.providerService.findMany({
        where: { provider_id: profile.id },
        include: {
          category: { select: { id: true, slug: true, name: true } },
        },
      });

      return { updated, finalServices };
    });

    // Calculate aggregates
    const { updated, finalServices } = updatedProfile;
    const total_reviews = updated.reviews.length;
    const average_rating =
      total_reviews > 0
        ? updated.reviews.reduce((sum, r) => sum + r.rating, 0) / total_reviews
        : 0;

    return ok({
      id: updated.id,
      provider_type: updated.application.provider_type,
      business_name: updated.application.business_name,
      full_name: updated.user.profile?.full_name ?? null,
      description: updated.description,
      portfolio_url: updated.portfolio_url,
      services: finalServices.map((s) => ({
        category_id: s.category.id,
        slug: s.category.slug,
        name: s.category.name,
      })),
      is_verified: updated.is_verified,
      verified_at: updated.verified_at,
      average_rating,
      total_reviews,
      total_unlocks: updated.unlocks.length,
      created_at: updated.created_at,
    });
  } catch (err) {
    console.error("[PATCH /api/providers/me]", err);
    return ApiError.internal();
  }
}
