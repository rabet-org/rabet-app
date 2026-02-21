import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

interface RouteParams {
  params: Promise<{ id: string }>; // provider_id
}

/**
 * GET /api/providers/[id]/reviews
 * Public endpoint to fetch reviews for a specific provider.
 * Excludes soft-deleted reviews.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id: provider_id } = await params;
    const { searchParams } = new URL(req.url);

    const min_rating = parseInt(searchParams.get("min_rating") ?? "0");
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    const where: Prisma.ReviewWhereInput = {
      provider_id,
      deleted_at: null, // Critical: exclude soft-deleted reviews
      ...(min_rating > 0 && { rating: { gte: min_rating } }),
    };

    // We need two queries:
    // 1. Get the paginated reviews list
    // 2. Compute the exact summary statistics for the provider overall (independent of pagination/min_rating filter)

    const summaryWhere: Prisma.ReviewWhereInput = {
      provider_id,
      deleted_at: null,
    };

    const [reviews, totalFiltered, allProviderReviews] = await Promise.all([
      db.review.findMany({
        where,
        include: {
          client: {
            select: {
              profile: { select: { full_name: true, avatar_url: true } },
            },
          },
          request: {
            select: { title: true, category: { select: { name: true } } },
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.review.count({ where }),
      db.review.findMany({
        where: summaryWhere,
        select: { rating: true },
      }),
    ]);

    // Calculate Summary manually from the raw list of all their reviews
    const totalReviews = allProviderReviews.length;
    let averageRating = 0;
    const distribution = { "5": 0, "4": 0, "3": 0, "2": 0, "1": 0 };

    if (totalReviews > 0) {
      const sum = allProviderReviews.reduce((acc, curr) => {
        // Build distribution map
        if (curr.rating >= 1 && curr.rating <= 5) {
          distribution[curr.rating.toString() as keyof typeof distribution]++;
        }
        return acc + curr.rating;
      }, 0);
      averageRating = sum / totalReviews;
    }

    return ok({
      summary: {
        average_rating: averageRating,
        total_reviews: totalReviews,
        rating_distribution: distribution,
      },
      data: reviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        client: {
          full_name: r.client.profile?.full_name ?? "Anonymous Client",
          avatar_url: r.client.profile?.avatar_url ?? null,
        },
        request: {
          title: r.request.title,
          category: r.request.category,
        },
        created_at: r.created_at,
        updated_at: r.updated_at,
      })),
      pagination: {
        page,
        limit,
        total: totalFiltered,
        total_pages: Math.ceil(totalFiltered / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/providers/[id]/reviews]", err);
    return ApiError.internal();
  }
}
