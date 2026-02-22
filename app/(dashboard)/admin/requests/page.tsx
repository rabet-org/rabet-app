import { cookies } from "next/headers";
import RequestsClient from "./requests-client";
import { db } from "@/lib/db";

async function getRequests() {
  try {
    const [requests, total] = await Promise.all([
      db.request.findMany({
        include: {
          category: {
            select: {
              name: true,
              slug: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              created_at: true,
              profile: {
                select: {
                  full_name: true,
                  phone: true,
                },
              },
            },
          },
          unlocks: {
            select: {
              id: true,
              unlocked_at: true,
              provider: {
                select: {
                  user_id: true,
                  user: { select: { email: true } },
                },
              },
            },
            orderBy: { unlocked_at: "desc" },
          },
        },
        orderBy: { created_at: "desc" },
        take: 100,
      }),
      db.request.count(),
    ]);

    return {
      requests: requests.map((request) => ({
        id: request.id,
        title: request.title,
        description: request.description,
        category: request.category,
        client: {
          id: request.user.id,
          email: request.user.email,
          full_name: request.user.profile?.full_name || null,
          phone: request.user.profile?.phone || null,
          created_at: request.user.created_at.toISOString(),
        },
        budget_range: request.budget_range,
        location: request.location,
        status: request.status,
        deadline: request.deadline?.toISOString() || null,
        unlock_fee: request.unlock_fee.toNumber(),
        total_unlocks: request.unlocks.length,
        unlocks: request.unlocks.map((u) => ({
          id: u.id,
          unlocked_at: u.unlocked_at.toISOString(),
          provider: u.provider,
        })),
        created_at: request.created_at.toISOString(),
        updated_at: request.updated_at.toISOString(),
      })),
      total,
    };
  } catch (error) {
    console.error("Error fetching requests:", error);
    return { requests: [], total: 0 };
  }
}

export default async function AdminRequestsPage({
  searchParams,
}: {
  searchParams?: Promise<{ search?: string }>;
}) {
  const search = (await searchParams)?.search ?? "";
  const { requests, total } = await getRequests();
  return (
    <RequestsClient
      initialRequests={requests}
      initialTotal={total}
      initialSearch={search}
    />
  );
}
