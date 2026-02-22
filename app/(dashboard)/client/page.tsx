import { Topbar } from "@/components/layout/topbar";
import { cookies } from "next/headers";
import { ClientDashboardClient } from "./client-dashboard";

async function getClientData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const [requestsRes, categoriesRes] = await Promise.all([
    fetch(`${baseUrl}/requests/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${baseUrl}/admin/categories?is_active=true&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  if (!requestsRes.ok) throw new Error("Failed to fetch data");

  const requests = await requestsRes.json();
  const categories = categoriesRes.ok
    ? await categoriesRes.json()
    : { data: [] };

  return {
    requests: requests.data || [],
    categories: categories.data || [],
  };
}

export default async function ClientDashboardPage() {
  let data;
  try {
    data = await getClientData();
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Client Overview" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading dashboard. Please try again later.
          </div>
        </main>
      </div>
    );
  }

  return <ClientDashboardClient initialRequests={data.requests} categories={data.categories} />;
}
