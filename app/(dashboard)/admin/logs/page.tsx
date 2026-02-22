import { db } from "@/lib/db";
import { Prisma } from "@prisma/client";
import AdminFinanceClient from "./client-page";

async function getLogs() {
  const limit = 50;
  const [logs, total] = await Promise.all([
    db.adminLog.findMany({
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            profile: { select: { full_name: true } },
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: limit,
    }),
    db.adminLog.count(),
  ]);
  return {
    data: logs.map((log) => ({
      id: log.id,
      admin_id: log.admin_id,
      admin: {
        id: log.admin.id,
        email: log.admin.email,
        full_name: log.admin.profile?.full_name ?? "Admin",
      },
      action_type: log.action_type,
      target_type: log.target_type,
      target_id: log.target_id,
      details: log.details as Prisma.JsonObject | null,
      created_at: log.created_at.toISOString(),
    })),
    total,
  };
}

export default async function AdminFinancePage() {
  let data: Awaited<ReturnType<typeof getLogs>>["data"] = [];
  let total = 0;
  let errorMsg: string | null = null;

  try {
    const result = await getLogs();
    data = result.data;
    total = result.total;
  } catch {
    errorMsg =
      "Error loading finance data. Please ensure the backend is running.";
  }

  if (errorMsg) {
    return <div className="p-8 text-center text-red-500">{errorMsg}</div>;
  }

  return <AdminFinanceClient initialData={data} initialTotal={total} />;
}
