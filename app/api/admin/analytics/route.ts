import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/analytics
 * Computes high-level platform statistics, financial aggregates, and time-series data.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const startDateRaw = searchParams.get("start_date");
    const endDateRaw = searchParams.get("end_date");

    const periodFilter: Prisma.DateTimeFilter = {};
    if (startDateRaw) periodFilter.gte = new Date(startDateRaw);
    if (endDateRaw) periodFilter.lte = new Date(endDateRaw);

    const hasDates = !!startDateRaw || !!endDateRaw;
    const dateBound = hasDates ? periodFilter : undefined;

    // For time-series: use the selected period or default to last 30 days
    const tsEnd = endDateRaw ? new Date(endDateRaw) : new Date();
    const tsStart = startDateRaw
      ? new Date(startDateRaw)
      : new Date(new Date().setDate(tsEnd.getDate() - 29));

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
      db.user.count({ where: { created_at: dateBound } }),

      db.providerApplication.count({
        where: { application_status: "pending" },
      }),
      db.providerApplication.count({
        where: { application_status: "approved" },
      }),
      db.providerApplication.count({
        where: { application_status: "rejected" },
      }),

      db.request.count(),
      db.request.count({ where: { status: "published" } }),
      db.request.count({ where: { status: "in_progress" } }),
      db.request.count({ where: { status: "completed" } }),

      db.request.groupBy({ by: ["category_id"], _count: { id: true } }),

      db.leadUnlock.count({ where: { status: "completed" } }),
      db.leadUnlock.count({
        where: { status: "completed", unlocked_at: dateBound },
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

    // ── Time-series: daily aggregates via raw SQL ─────────────────────────────
    type DayRow = { day: Date; count: bigint };

    const [usersTimeline, requestsTimeline, unlocksTimeline] =
      await Promise.all([
        db.$queryRaw<DayRow[]>`
        SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::bigint AS count
        FROM "public"."users"
        WHERE created_at >= ${tsStart} AND created_at <= ${tsEnd}
        GROUP BY day ORDER BY day ASC
      `,
        db.$queryRaw<DayRow[]>`
        SELECT DATE_TRUNC('day', created_at) AS day, COUNT(*)::bigint AS count
        FROM "public"."requests"
        WHERE created_at >= ${tsStart} AND created_at <= ${tsEnd}
        GROUP BY day ORDER BY day ASC
      `,
        db.$queryRaw<DayRow[]>`
        SELECT DATE_TRUNC('day', unlocked_at) AS day, COUNT(*)::bigint AS count
        FROM "public"."lead_unlocks"
        WHERE status = 'completed' AND unlocked_at >= ${tsStart} AND unlocked_at <= ${tsEnd}
        GROUP BY day ORDER BY day ASC
      `,
      ]);

    // Build a full date spine so gaps in the data show as zero
    function buildTimeline(rows: DayRow[]) {
      const map = new Map<string, number>();
      rows.forEach((r) => {
        const key = r.day.toISOString().split("T")[0];
        map.set(key, Number(r.count));
      });

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

    // Category labels
    let categoryMap: Record<string, string> = {};
    if (totalReqsByCategoryRaw.length > 0) {
      const catIds = totalReqsByCategoryRaw
        .filter((g) => g.category_id)
        .map((g) => g.category_id!);
      const categories = await db.category.findMany({
        where: { id: { in: catIds } },
        select: { id: true, slug: true },
      });
      categories.forEach((c) => (categoryMap[c.id] = c.slug));
    }

    const byCategory = totalReqsByCategoryRaw.map((group) => ({
      category: group.category_id
        ? categoryMap[group.category_id] || "unknown"
        : "none",
      count: group._count.id,
    }));

    return ok({
      period: {
        start: startDateRaw || "alltime",
        end: endDateRaw || "alltime",
      },
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
        by_category: byCategory,
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
    });
  } catch (err) {
    console.error("[GET /api/admin/analytics]", err);
    return ApiError.internal();
  }
}
