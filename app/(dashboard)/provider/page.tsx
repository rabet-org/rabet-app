import { Topbar } from "@/components/layout/topbar";
import { cookies } from "next/headers";
import { ProviderDashboardClient } from "./dashboard-client";

async function getDashboardData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  if (!token) {
    throw new Error("No authentication token found");
  }

  // First check if user has an application
  const applicationRes = await fetch(`${baseUrl}/provider-applications/me`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  // If no application exists, return null to show application prompt
  if (!applicationRes.ok) {
    const errorText = await applicationRes.text().catch(() => "Unknown error");
    console.error("Application fetch failed:", applicationRes.status, errorText);
    return { hasApplication: false, application: null, profile: null, wallet: null, recentUnlocks: [] };
  }

  let application;
  try {
    application = await applicationRes.json();
  } catch (e) {
    console.error("Failed to parse application response:", e);
    return { hasApplication: false, application: null, profile: null, wallet: null, recentUnlocks: [] };
  }
  
  // Check if application data exists and is valid
  // The API returns the data directly, not wrapped in a 'data' property
  if (!application || !application.id) {
    console.error("Invalid application response structure:", application);
    return { hasApplication: false, application: null, profile: null, wallet: null, recentUnlocks: [] };
  }
  
  // If application is not approved, return application status
  if (application.application_status !== "approved") {
    return { 
      hasApplication: true, 
      application: application, 
      profile: null, 
      wallet: null, 
      recentUnlocks: [] 
    };
  }

  // Application is approved, fetch full dashboard data
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

  if (!profileRes.ok) {
    const errorText = await profileRes.text().catch(() => "Unknown error");
    console.error("Profile fetch failed:", profileRes.status, errorText);
    throw new Error("Failed to fetch profile data");
  }

  const profile = await profileRes.json();
  const wallet = walletRes.ok ? await walletRes.json() : null;
  const unlocks = unlocksRes.ok ? await unlocksRes.json() : { data: [] };

  if (!wallet) {
    const errorText = await walletRes.text().catch(() => "Unknown error");
    console.error("Wallet fetch failed:", walletRes.status, errorText);
  }

  return {
    hasApplication: true,
    application: application,
    profile: profile,
    wallet: wallet || null,
    recentUnlocks: unlocks.data || [],
  };
}

export default async function ProviderDashboardPage() {
  let data;
  try {
    data = await getDashboardData();
  } catch (error) {
    console.error("Dashboard data fetch error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Provider Overview" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Error Loading Dashboard</h2>
            <p className="text-red-500 mb-4">{errorMessage}</p>
            <p className="text-sm text-muted-foreground">
              Please check the browser console for more details or contact support if the issue persists.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Check if user has no application
  if (!data.hasApplication) {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Provider Overview" />
        <main className="flex-1 p-6 max-w-2xl mx-auto">
          <div className="rounded-lg border border-blue-500/50 bg-blue-500/10 p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Welcome to Rabet Provider Platform</h2>
            <p className="text-muted-foreground mb-6">
              You need to submit a provider application to access the provider dashboard.
              Please contact support or submit your application through the registration process.
            </p>
            <p className="text-sm text-muted-foreground">
              If you believe this is an error, please contact support.
            </p>
          </div>
        </main>
      </div>
    );
  }

  // Check application status
  if (data.application && data.application.application_status !== "approved") {
    const statusMessages = {
      pending: {
        title: "Application Under Review",
        message: "Your provider application is currently being reviewed by our team. We'll notify you once a decision has been made.",
        color: "yellow"
      },
      under_review: {
        title: "Application Under Review",
        message: "Your provider application is being carefully reviewed by our team. This process typically takes 1-3 business days.",
        color: "blue"
      },
      rejected: {
        title: "Application Not Approved",
        message: data.application.rejection_reason || "Unfortunately, your provider application was not approved. Please contact support for more information.",
        color: "red"
      }
    };

    const status = statusMessages[data.application.application_status as keyof typeof statusMessages] || statusMessages.pending;

    return (
      <div className="flex flex-col h-full">
        <Topbar title="Provider Overview" />
        <main className="flex-1 p-6 max-w-2xl mx-auto">
          <div className={`rounded-lg border border-${status.color}-500/50 bg-${status.color}-500/10 p-8 text-center`}>
            <h2 className="text-xl font-semibold mb-4">{status.title}</h2>
            <p className="text-muted-foreground mb-6">{status.message}</p>
            <div className="text-sm text-muted-foreground space-y-2">
              <p><strong>Application Status:</strong> {data.application.application_status}</p>
              <p><strong>Submitted:</strong> {new Date(data.application.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Ensure profile data exists (should exist if approved)
  if (!data.profile) {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Provider Overview" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Provider profile not found. Please contact support.
          </div>
        </main>
      </div>
    );
  }

  return <ProviderDashboardClient {...data} />;
}
