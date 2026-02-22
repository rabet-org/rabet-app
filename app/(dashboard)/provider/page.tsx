import { Topbar } from "@/components/layout/topbar";
import { cookies } from "next/headers";
import { ProviderDashboardClient } from "./dashboard-client";

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const [profileRes, walletRes, unlocksRes] = await Promise.all([
    fetch(`${baseUrl}/providers/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${baseUrl}/providers/me/wallet`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${baseUrl}/providers/me/unlocks?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  if (!profileRes.ok) throw new Error("Failed to fetch data");

  const profile = await profileRes.json();
  const wallet = walletRes.ok ? await walletRes.json() : null;
  const unlocks = unlocksRes.ok ? await unlocksRes.json() : { data: { data: [] } };

  return {
    profile: profile.data,
    wallet: wallet?.data || null,
    recentUnlocks: unlocks.data.data || [],
  };
}

export default async function ProviderDashboardPage() {
  let data;
  try {
    data = await getDashboardData();
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Provider Overview" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading dashboard. Please ensure you have a provider profile.
          </div>
        </main>
      </div>
    );
  }

  return <ProviderDashboardClient {...data} />;
}
