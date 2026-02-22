import { Topbar } from "@/components/layout/topbar";
import { db } from "@/lib/db";
import { AnalyticsDashboard } from "./analytics-dashboard";

async function getAnalytics() {
  const tsEnd = new Date();
  const tsStart = new Date(new Date().setDate(tsEnd.getDate() - 29));

  const [
    totalUsers,
    totalClients,
    totalProviders,
    totalAdmins,
    newUsersPeriod,
    pendingApps,
    approvedApps,
    rejectedApps,
    totalReqs,
    publishedReqs,
    inProgressReqs,
    completedReqs,
    totalReqsByCategoryRaw,
    totalUnlocks,
    unlocksThisPeriod,
    totalUnlockRevenueAgg,
    totalDepositsAgg,
    totalSpentSubsAgg,
  ] = await Promise.all([
    db.user.count(),
    db.user.count({ where: { role: "client" } }),
    db.user.count({ where: { role: "provider" } }),
    db.user.count({ where: { role: "admin" } }),
    db.user.count({ where: { created_at: { gte: tsStart } } }),
    db.providerApplication.count({ where: { application_status: "pending" } }),
    db.providerApplication.count({ where: { application_status: "approved" } }),
    db.providerApplication.count({ where: { application_status: "rejected" } }),
    db.request.count(),
    db.request.count({ where: { status: "published" } }),
    db.request.count({ where: { status: "in_progress" } }),
    db.request.count({ where: { status: "completed" } }),
    db.request.groupBy({ by: ["category_id"], _count: { id: true } }),
    db.leadUnlock.count({ where: { status: "completed" } }),
    db.leadUnlock.count({
      where: { status: "completed", unlocked_at: { gte: tsStart } },
    }),
    db.leadUnlock.aggregate({
      _sum: { unlock_fee: true },
      where: { status: "completed" },
    }),
    db.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "deposit" },
    }),
    db.walletTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "debit", reference_type: "subscription_payment" },
    }),
  ]);

  type DayRow = { day: Date; count: bigint };
  const [usersTimeline, requestsTimeline, unlocksTimeline] = await Promise.all([
    db.$queryRaw<
      DayRow[]
    >`SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::bigint AS count FROM "public"."users" WHERE created_at >= ${tsStart} AND created_at <= ${tsEnd} GROUP BY day ORDER BY day ASC`,
    db.$queryRaw<
      DayRow[]
    >`SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::bigint AS count FROM "public"."requests" WHERE created_at >= ${tsStart} AND created_at <= ${tsEnd} GROUP BY day ORDER BY day ASC`,
    db.$queryRaw<
      DayRow[]
    >`SELECT DATE_TRUNC('day', unlocked_at) AS day, COUNT(*)::bigint AS count FROM "public"."lead_unlocks" WHERE status = 'completed' AND unlocked_at >= ${tsStart} AND unlocked_at <= ${tsEnd} GROUP BY day ORDER BY day ASC`,
  ]);

  function buildTimeline(rows: DayRow[]) {
    const map = new Map<string, number>();
    rows.forEach((r) =>
      map.set(r.day.toISOString().split("T")[0], Number(r.count)),
    );
    const result: { date: string; count: number }[] = [];
    const cursor = new Date(tsStart);
    cursor.setHours(0, 0, 0, 0);
    const end = new Date(tsEnd);
    end.setHours(23, 59, 59, 999);
    while (cursor <= end) {
      const key = cursor.toISOString().split("T")[0];
      result.push({ date: key, count: map.get(key) ?? 0 });
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }

  const categoryMap: Record<string, string> = {};
  if (totalReqsByCategoryRaw.length > 0) {
    const catIds = totalReqsByCategoryRaw
      .filter((g) => g.category_id)
      .map((g) => g.category_id!);
    const cats = await db.category.findMany({
      where: { id: { in: catIds } },
      select: { id: true, slug: true },
    });
    cats.forEach((c) => (categoryMap[c.id] = c.slug));
  }

  return {
    period: { start: "alltime", end: "alltime" },
    users: {
      total: totalUsers,
      by_role: {
        client: totalClients,
        provider: totalProviders,
        admin: totalAdmins,
      },
      new_this_period: newUsersPeriod,
      timeline: buildTimeline(usersTimeline),
    },
    provider_applications: {
      pending: pendingApps,
      approved: approvedApps,
      rejected: rejectedApps,
    },
    requests: {
      total: totalReqs,
      by_status: {
        published: publishedReqs,
        in_progress: inProgressReqs,
        completed: completedReqs,
      },
      by_category: totalReqsByCategoryRaw.map((g) => ({
        category: g.category_id
          ? categoryMap[g.category_id] || "unknown"
          : "none",
        count: g._count.id,
      })),
      timeline: buildTimeline(requestsTimeline),
    },
    unlocks: {
      total: totalUnlocks,
      this_period: unlocksThisPeriod,
      total_revenue_egp:
        totalUnlockRevenueAgg._sum?.unlock_fee?.toNumber() || 0,
      timeline: buildTimeline(unlocksTimeline),
    },
    financials: {
      total_deposits: totalDepositsAgg._sum?.amount?.toNumber() || 0,
      total_spent_on_unlocks:
        totalUnlockRevenueAgg._sum?.unlock_fee?.toNumber() || 0,
      total_spent_on_subscriptions:
        totalSpentSubsAgg._sum?.amount?.toNumber() || 0,
    },
  };
}

export default async function AdminDashboardPage() {
  let analytics;
  try {
    const data = await getAnalytics();
    analytics = data;
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Admin Overview" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading analytics data. Please ensure the backend is running.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Admin Overview" />
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-2 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Platform Analytics
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Live metrics and charts across all platform activity.
          </p>
        </div>

        <AnalyticsDashboard analytics={analytics} />
      </main>
    </div>
  );
}
