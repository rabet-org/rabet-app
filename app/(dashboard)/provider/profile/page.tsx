import { Topbar } from "@/components/layout/topbar";
import { cookies } from "next/headers";
import { ProfileClient } from "./profile-client";

async function getProfileData() {
  const cookieStore = await cookies();
  const token = cookieStore.get("access_token")?.value;
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

  const [profileRes, categoriesRes] = await Promise.all([
    fetch(`${baseUrl}/providers/me`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
    fetch(`${baseUrl}/admin/categories?is_active=true&limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    }),
  ]);

  if (!profileRes.ok) throw new Error("Failed to fetch profile");

  const profile = await profileRes.json();
  const categories = categoriesRes.ok
    ? await categoriesRes.json()
    : { data: { data: [] } };

  return { profile: profile.data, categories: categories.data.data || [] };
}

export default async function ProviderProfilePage() {
  let data;
  try {
    data = await getProfileData();
  } catch {
    return (
      <div className="flex flex-col h-full">
        <Topbar title="Provider Profile" />
        <main className="flex-1 p-6">
          <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-8 text-center text-red-500">
            Error loading profile. Please ensure you have a provider profile.
          </div>
        </main>
      </div>
    );
  }

  return <ProfileClient initialProfile={data.profile} categories={data.categories} />;
}
