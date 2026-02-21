import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

/**
 * GET /api/providers
 * Public endpoint to list all active providers.
 * Query: ?category_slug=web-design&is_verified=true&min_rating=4.0&page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const category_slug = searchParams.get("category_slug");
    const isVerifiedParam = searchParams.get("is_verified");
    const minRatingParam = searchParams.get("min_rating");

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    // Build the query where clause
    const where: Prisma.ProviderProfileWhereInput = {
      is_active: true, // Only show active providers
    };

    if (isVerifiedParam === "true") {
      where.is_verified = true;
    } else if (isVerifiedParam === "false") {
      where.is_verified = false;
    }

    if (category_slug) {
      where.services = {
        some: {
          category: {
            slug: category_slug,
          },
        },
      };
    }

    // Filter by min_rating requires checking the reviews relationship average
    // Since Prisma can't easily filter by computed relation averages directly in the `where` clause
    // without executing raw SQL for complex cases, we'll fetch them all if there's a rating filter,
    // or rely on a simpler approach. Because we want an accurate average, we'll let Prisma do the
    // DB query, then filter in memory if min_rating is provided. For now, fetch standard.

    // We fetch a base set out of the database based on relational properties.
    const providers = await db.providerProfile.findMany({
      where,
      include: {
        application: {
          select: {
            provider_type: true,
            business_name: true,
          },
        },
        user: {
          select: {
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
      },
      orderBy: { created_at: "desc" },
    });

    // Compute ratings and shape the response
    let results = providers.map((p) => {
      const total_reviews = p.reviews.length;
      const average_rating =
        total_reviews > 0
          ? p.reviews.reduce((sum, r) => sum + r.rating, 0) / total_reviews
          : 0;

      return {
        id: p.id,
        provider_type: p.application.provider_type,
        business_name: p.application.business_name,
        full_name: p.user.profile?.full_name ?? null,
        services: p.services.map((s) => ({
          slug: s.category.slug,
          name: s.category.name,
        })),
        is_verified: p.is_verified,
        average_rating,
        total_reviews,
      };
    });

    // Apply memory filter for rating
    const minRating = parseFloat(minRatingParam ?? "0");
    if (minRating > 0) {
      results = results.filter((p) => p.average_rating >= minRating);
    }

    // Manual Pagination after memory filter
    const total = results.length;
    const paginatedResults = results.slice(skip, skip + limit);

    return ok({
      data: paginatedResults,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/providers]", err);
    return ApiError.internal();
  }
}
