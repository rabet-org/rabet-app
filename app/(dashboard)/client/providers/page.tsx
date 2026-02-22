import { db } from "@/lib/db";
import { ProvidersClient } from "./providers-client";

export default async function ProvidersPage() {
  const [providers, categories] = await Promise.all([
    db.providerProfile.findMany({
      where: { is_active: true },
      include: {
        user: {
          select: {
            profile: {
              select: {
                full_name: true,
                avatar_url: true,
              },
            },
          },
        },
        services: {
          include: {
            category: {
              select: {
                name: true,
                slug: true,
              },
            },
          },
        },
        _count: {
          select: {
            reviews: true,
          },
        },
      },
      take: 50,
    }),
    db.category.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    }),
  ]);

  // Calculate average rating for each provider
  const providersWithRatings = await Promise.all(
    providers.map(async (provider) => {
      const reviews = await db.review.findMany({
        where: { provider_id: provider.id, deleted_at: null },
        select: { rating: true },
      });

      const avgRating =
        reviews.length > 0
          ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
          : 0;

      return {
        ...provider,
        avgRating,
      };
    })
  );

  return <ProvidersClient initialProviders={providersWithRatings} categories={categories} />;
}
