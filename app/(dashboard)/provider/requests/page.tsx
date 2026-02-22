import { Topbar } from "@/components/layout/topbar";
import { cookies } from "next/headers";
import { RequestsClient } from "./requests-client";

async function getRequests() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const res = await fetch(`${baseUrl}/requests?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch requests");
  const data = await res.json();
  return data.data.data || [];
}

export default async function ProviderRequestsPage() {
  let requests;
  try {
    requests = await getRequests();
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Browse Requests" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading requests. Please try again later.
          </div>
        </main>
      </div>
    );
  }

  return <RequestsClient initialRequests={requests} />;
}
