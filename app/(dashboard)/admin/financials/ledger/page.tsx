import { db } from "@/lib/db";
import LedgerClient from "./ledger-client";

async function getLedgerData() {
  const [totalRevenue, liabilities, recentTransactions, providers, txTotal] =
    await Promise.all([
      // 1. Total Unlock Revenue
      db.leadUnlock.aggregate({
        _sum: { unlock_fee: true },
        where: { status: "completed" },
      }),

      // 2. Platform Liabilities (Sum of all wallet balances)
      db.providerWallet.aggregate({
        _sum: { balance: true },
      }),

      // 3. Recent Transactions (Join with Wallet and Provider Profile)
      db.walletTransaction.findMany({
        include: {
          wallet: {
            include: {
              provider: {
                include: {
                  user: {
                    include: {
                      profile: {
                        select: { full_name: true, avatar_url: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: 50,
      }),

      // 4. Active provider list for manual adjustments
      db.providerProfile.findMany({
        select: {
          id: true,
          user: {
            select: {
              email: true,
              profile: {
                select: { full_name: true, avatar_url: true },
              },
            },
          },
          wallet: {
            select: {
              balance: true,
              currency: true,
            },
          },
        },
        where: { is_active: true },
      }),

      // 5. Total transaction count for cap warning
      db.walletTransaction.count(),
    ]);

  return {
    stats: {
      totalRevenue: totalRevenue._sum.unlock_fee?.toNumber() || 0,
      liabilities: liabilities._sum.balance?.toNumber() || 0,
      transactionCount: recentTransactions.length,
      totalTransactions: txTotal,
    },
    transactions: recentTransactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount.toNumber(),
      balance_before: t.balance_before.toNumber(),
      balance_after: t.balance_after.toNumber(),
      description: t.description,
      created_at: t.created_at.toISOString(),
      provider: {
        id: t.wallet.provider.id,
        email: t.wallet.provider.user.email,
        full_name:
          t.wallet.provider.user.profile?.full_name || "Unknown Provider",
        avatar_url: t.wallet.provider.user.profile?.avatar_url || null,
      },
    })),
    providers: providers.map((p) => ({
      id: p.id,
      email: p.user.email,
      name: p.user.profile?.full_name || "N/A",
      avatar_url: p.user.profile?.avatar_url || null,
      balance: p.wallet?.balance.toNumber() || 0,
      currency: p.wallet?.currency || "EGP",
    })),
  };
}

export default async function AdminLedgerPage() {
  const data = await getLedgerData();
  return <LedgerClient initialData={data} />;
}
