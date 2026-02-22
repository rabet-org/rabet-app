import { Topbar } from "@/components/layout/topbar";
import { cookies } from "next/headers";
import { ProvidersClient } from "./providers-client";

async function getProviders() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const res = await fetch(`${baseUrl}/admin/providers?limit=100`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch providers");
  const data = await res.json();
  return data.data || [];
}

export default async function AdminProvidersPage() {
  let providers;
  try {
    providers = await getProviders();
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

  return <ProvidersClient initialProviders={providers} />;
}
