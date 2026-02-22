import { cookies } from "next/headers";
import AdminFinanceClient from "./client-page";

async function getLogs() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const res = await fetch(`${baseUrl}/admin/logs?limit=50`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch logs");
  }

  const json = await res.json();
  return json.data || [];
}

export default async function AdminFinancePage() {
  try {
    const logs = await getLogs();
    return <AdminFinanceClient initialData={logs} />;
  } catch (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading finance data. Please ensure the backend is running.
      </div>
    );
  }
}
