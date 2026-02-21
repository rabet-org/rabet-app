import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

/**
 * GET /api/admin/analytics
 * Computes high-level platform statistics and financial aggregates.
 */
export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Request
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    // 2. Extract Date Filters
    const { searchParams } = new URL(req.url);
    const startDateRaw = searchParams.get("start_date");
    const endDateRaw = searchParams.get("end_date");

    const periodFilter: Prisma.DateTimeFilter = {};
    if (startDateRaw) periodFilter.gte = new Date(startDateRaw);
    if (endDateRaw) periodFilter.lte = new Date(endDateRaw);

    // Reusable where clause for date period
    const hasDates = !!startDateRaw || !!endDateRaw;
    const dateBound = hasDates ? periodFilter : undefined;

    // 3. Execute Parallel Aggregations
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
      // Users
      db.user.count(),
      db.user.count({ where: { role: "client" } }),
      db.user.count({ where: { role: "provider" } }),
      db.user.count({ where: { role: "admin" } }),
      db.user.count({ where: { created_at: dateBound } }),

      // Applications
      db.providerApplication.count({
        where: { application_status: "pending" },
      }),
      db.providerApplication.count({
        where: { application_status: "approved" },
      }),
      db.providerApplication.count({
        where: { application_status: "rejected" },
      }),

      // Requests
      db.request.count(),
      db.request.count({ where: { status: "published" } }),
      db.request.count({ where: { status: "in_progress" } }),
      db.request.count({ where: { status: "completed" } }),

      // Requests grouped by Category
      db.request.groupBy({
        by: ["category_id"],
        _count: { id: true },
      }),

      // Unlocks (revenue flow)
      db.leadUnlock.count({ where: { status: "completed" } }),
      db.leadUnlock.count({
        where: { status: "completed", unlocked_at: dateBound },
      }),
      db.leadUnlock.aggregate({
        _sum: { unlock_fee: true },
        where: { status: "completed" },
      }),

      // Financials (Deposits & Subscriptions) via Wallet Transaction type
      db.walletTransaction.aggregate({
        _sum: { amount: true },
        where: { type: "deposit" },
      }),
      db.walletTransaction.aggregate({
        _sum: { amount: true },
        where: {
          type: "debit",
          reference_type: "subscription_payment",
        },
      }),
    ]);

    // Format Category breakdown (Fetching raw category info manually for labels)
    let categoryMap: Record<string, string> = {};
    if (totalReqsByCategoryRaw.length > 0) {
      const catIdsQuery = totalReqsByCategoryRaw
        .filter((g) => g.category_id)
        .map((g) => g.category_id!);
      const categories = await db.category.findMany({
        where: { id: { in: catIdsQuery } },
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
      },
      unlocks: {
        total: totalUnlocks,
        this_period: unlocksThisPeriod,
        total_revenue_egp:
          totalUnlockRevenueAgg._sum?.unlock_fee?.toNumber() || 0,
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
