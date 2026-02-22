import { Topbar } from "@/components/layout/topbar";
import { cookies } from "next/headers";
import { LeadsClient } from "./leads-client";

async function getLeads() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const res = await fetch(`${baseUrl}/providers/me/unlocks?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch leads");
  const data = await res.json();
  return data.data || [];
}

export default async function ProviderLeadsPage() {
  let leads;
  try {
    leads = await getLeads();
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="My Leads" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading leads. Please ensure you have a provider profile.
          </div>
        </main>
      </div>
    );
  }

  return <LeadsClient initialLeads={leads} />;
}
