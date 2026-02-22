import { Topbar } from "@/components/layout/topbar";
import { cookies } from "next/headers";
import { AnalyticsDashboard } from "./analytics-dashboard";

async function getAnalytics() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const res = await fetch(`${baseUrl}/admin/analytics`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) throw new Error("Failed to fetch analytics");
  return res.json();
}

export default async function AdminDashboardPage() {
  let analytics;
  try {
    const data = await getAnalytics();
    analytics = data;
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Admin Overview" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading analytics data. Please ensure the backend is running.
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-neutral-50/50 dark:bg-background">
      <Topbar title="Admin Overview" />
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-2 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold tracking-tight">
            Platform Analytics
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Live metrics and charts across all platform activity.
          </p>
        </div>

        <AnalyticsDashboard analytics={analytics} />
      </main>
    </div>
  );
}
