import { Topbar } from "@/components/layout/topbar";
import { db } from "@/lib/db";
import { ProvidersClient } from "./providers-client";

async function getProviders() {
  const [providers, total] = await Promise.all([
    db.providerProfile.findMany({
      include: {
        user: {
          select: {
            email: true,
            profile: {
              select: { full_name: true, phone: true, avatar_url: true },
            },
          },
        },
        application: { select: { provider_type: true, business_name: true } },
        services: {
          include: {
            category: { select: { id: true, name: true, icon: true } },
          },
        },
        wallet: { select: { balance: true, currency: true } },
        _count: { select: { reviews: true, unlocks: true } },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    }),
    db.providerProfile.count(),
  ]);
  return {
    providers: providers.map((p) => ({
      ...p,
      created_at: p.created_at.toISOString(),
      updated_at: p.updated_at.toISOString(),
      verified_at: p.verified_at?.toISOString() ?? null,
      wallet: p.wallet
        ? { ...p.wallet, balance: p.wallet.balance.toNumber() }
        : null,
    })),
    total,
  };
}

export default async function AdminProvidersPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const search = (await searchParams)?.search ?? "";
  let result: { providers: any[]; total: number };
  try {
    result = await getProviders();
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Providers" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading providers. Please try again later.
          </div>
        </main>
      </div>
    );
  }

  return (
    <ProvidersClient
      initialProviders={result.providers}
      initialTotal={result.total}
      initialSearch={search}
    />
  );
}
