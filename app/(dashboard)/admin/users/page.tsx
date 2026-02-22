import { cookies } from "next/headers";
import AdminUsersClient from "./client-page";

async function getUsers() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const res = await fetch(`${baseUrl}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error("Failed to fetch users");
  }

  const json = await res.json();
  return json.data || [];
}

export default async function AdminUsersPage() {
  try {
    const users = await getUsers();
    return <AdminUsersClient initialData={users} />;
  } catch (error) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading users data. Please ensure the backend is running.
      </div>
    );
  }
}
