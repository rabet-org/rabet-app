import { db } from "@/lib/db";
import AdminTeamClient from "./team-client";

export const metadata = { title: "Admin Team" };

export default async function AdminTeamPage() {
  const admins = await db.user.findMany({
    where: { role: "admin" },
    select: {
      id: true,
      email: true,
      is_blocked: true,
      email_verified: true,
      created_at: true,
      profile: { select: { full_name: true, avatar_url: true, phone: true } },
    },
    orderBy: { created_at: "asc" },
  });

  return (
    <AdminTeamClient
      initialAdmins={admins.map((a) => ({
        ...a,
        created_at: a.created_at.toISOString(),
      }))}
    />
  );
}
