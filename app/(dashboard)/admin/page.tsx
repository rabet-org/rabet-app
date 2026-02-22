import { Topbar } from "@/components/layout/topbar";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  UsersIcon,
  MoneyIcon,
  BriefcaseIcon,
  BuildingsIcon,
  ChartLineUpIcon,
  CheckCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cookies } from "next/headers";

// Helper function to fetch analytics securely server-side
async function getAnalytics() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;

  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const res = await fetch(`${baseUrl}/admin/analytics`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    // Prevent caching to always show live metrics on the admin dash
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch analytics");
  }

  return res.json();
}

export default async function AdminDashboardPage() {
  let analytics;
  try {
    const data = await getAnalytics();
    analytics = data; // The API returns the payload directly via ok()
  } catch (error) {
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
    <div className="flex flex-col h-full bg-neutral-50/50 dark:bg-background">
      <Topbar title="Admin Overview" />
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-8">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Platform Metrics
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            A real-time overview of Rabet's performance.
          </p>
        </div>

        {/* Top-level Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Users
              </CardTitle>
              <UsersIcon className="size-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{analytics.users.total}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Clients & Providers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Providers
              </CardTitle>
              <BuildingsIcon className="size-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.users.by_role.provider}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.provider_applications.pending} pending applications
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Requests
              </CardTitle>
              <BriefcaseIcon className="size-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {analytics.requests.total}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {analytics.requests.by_status.completed} completed globally
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Platform Revenue
              </CardTitle>
              <MoneyIcon className="size-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {Number(
                  analytics.financials.total_spent_on_unlocks,
                ).toLocaleString()}{" "}
                EGP
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From Lead Unlocks
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Secondary Metrics */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ChartLineUpIcon className="size-5 text-emerald-500" />
                Request Status Breakdown
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Published (Available)
                  </span>
                  <span className="font-medium">
                    {analytics.requests.by_status.published}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    In Progress
                  </span>
                  <span className="font-medium">
                    {analytics.requests.by_status.in_progress}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Completed
                  </span>
                  <span className="font-medium">
                    {analytics.requests.by_status.completed}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircleIcon className="size-5 text-blue-500" />
                Unlocks & Financials
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Lead Unlocks
                  </span>
                  <span className="font-medium">{analytics.unlocks.total}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Deposits (EGP)
                  </span>
                  <span className="font-medium">
                    {Number(
                      analytics.financials.total_deposits,
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Total Spent on Subscriptions
                  </span>
                  <span className="font-medium text-amber-500 flex items-center gap-1">
                    {Number(
                      analytics.financials.total_spent_on_subscriptions,
                    ).toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
