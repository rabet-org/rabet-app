import { db } from "@/lib/db";
import RefundsClient from "./refunds-client";

async function getRefundsData() {
  const [refundableUnlocks, totalRefundable, totalCount] = await Promise.all([
    // Completed unlocks eligible for refund
    db.leadUnlock.findMany({
      where: { status: "completed" },
      include: {
        provider: {
          include: {
            user: {
              include: {
                profile: { select: { full_name: true, avatar_url: true } },
              },
            },
          },
        },
        request: {
          select: {
            id: true,
            title: true,
            category: { select: { name: true } },
          },
        },
      },
      orderBy: { unlocked_at: "desc" },
      take: 100,
    }),

    // Total refundable amount
    db.leadUnlock.aggregate({
      _sum: { unlock_fee: true },
      where: { status: "completed" },
    }),

    // Total count for cap warning
    db.leadUnlock.count({ where: { status: "completed" } }),
  ]);

  return {
    stats: {
      totalRefundable: totalRefundable._sum.unlock_fee?.toNumber() || 0,
      count: refundableUnlocks.length,
      total: totalCount,
    },
    refundableUnlocks: refundableUnlocks.map((u) => ({
      id: u.id,
      unlock_fee: u.unlock_fee.toNumber(),
      unlocked_at: u.unlocked_at.toISOString(),
      request: {
        id: u.request.id,
        title: u.request.title,
        category: { name: u.request.category.name },
      },
      provider: {
        id: u.provider_id,
        email: u.provider.user.email,
        full_name: u.provider.user.profile?.full_name || "Unknown Provider",
        avatar_url: u.provider.user.profile?.avatar_url || null,
      },
    })),
  };
}

export default async function AdminRefundsPage() {
  const data = await getRefundsData();
  return <RefundsClient initialData={data} />;
}
