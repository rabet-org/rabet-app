import { cookies } from "next/headers";
import ReviewsClient from "./reviews-client";
import { db } from "@/lib/db";

async function getReviews() {
  try {
    // Fetch reviews directly from database
    const reviews = await db.review.findMany({
      include: {
        client: {
          select: {
            email: true,
            profile: {
              select: {
                full_name: true,
              },
            },
          },
        },
        provider: {
          select: {
            id: true,
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
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    return reviews.map((review) => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      created_at: review.created_at.toISOString(),
      client: {
        email: review.client.email,
        full_name: review.client.profile?.full_name || null,
      },
      provider: {
        id: review.provider.id,
        email: review.provider.user.email,
        full_name: review.provider.user.profile?.full_name || null,
      },
    }));
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

export default async function AdminReviewsPage() {
  const reviews = await getReviews();
  return <ReviewsClient initialReviews={reviews} />;
}
