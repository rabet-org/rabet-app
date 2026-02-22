import { db } from "@/lib/db";
import AdminUsersClient from "./client-page";

async function getUsers() {
  const limit = 50;
  const [users, total] = await Promise.all([
    db.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        is_blocked: true,
        is_active: true,
        email_verified: true,
        email_verified_at: true,
        created_at: true,
        profile: { select: { full_name: true, phone: true, avatar_url: true } },
        _count: { select: { requests: true } },
        provider_profile: {
          select: {
            is_verified: true,
            wallet: { select: { balance: true, currency: true } },
            subscription: { select: { plan_type: true, status: true } },
            _count: { select: { reviews: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    }),
    db.user.count(),
  ]);
  return {
    data: users.map((u) => ({
      ...u,
      created_at: u.created_at.toISOString(),
      email_verified_at: u.email_verified_at?.toISOString() ?? null,
      provider_profile: u.provider_profile
        ? {
            ...u.provider_profile,
            wallet: u.provider_profile.wallet
              ? {
                  ...u.provider_profile.wallet,
                  balance: u.provider_profile.wallet.balance.toNumber(),
                }
              : null,
          }
        : null,
    })),
    pagination: {
      page: 1,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const search = (await searchParams)?.search ?? "";
  try {
    const { data, pagination } = await getUsers();
    return (
      <AdminUsersClient
        initialData={data}
        initialTotal={pagination.total}
        initialTotalPages={pagination.total_pages}
        initialSearch={search}
      />
    );
  } catch (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading users data. Please ensure the backend is running.
      </div>
    );
  }
}
