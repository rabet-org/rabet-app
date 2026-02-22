import { cookies } from "next/headers";
import AdminApplicationsClient from "./client-page";

async function getApplications() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const res = await fetch(`${baseUrl}/admin/provider-applications`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch applications");
  }

  const json = await res.json();
  return json.data || [];
}

export default async function AdminApplicationsPage() {
  try {
    const apps = await getApplications();
    return <AdminApplicationsClient initialData={apps} />;
  } catch (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading applications data. Please ensure the backend is running
        and you have admin privileges.
      </div>
    );
  }
}
