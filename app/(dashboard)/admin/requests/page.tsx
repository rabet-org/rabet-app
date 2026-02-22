import { cookies } from "next/headers";
import RequestsClient from "./requests-client";
import { db } from "@/lib/db";

async function getRequests() {
  try {
    const requests = await db.request.findMany({
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        user: {
          select: {
            email: true,
            profile: {
              select: {
                full_name: true,
              },
            },
          },
        },
        _count: {
          select: {
            unlocks: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
      take: 100,
    });

    return requests.map((request) => ({
      id: request.id,
      title: request.title,
      description: request.description,
      category: request.category,
      client: {
        email: request.user.email,
        full_name: request.user.profile?.full_name || null,
      },
      budget_range: request.budget_range,
      location: request.location,
      status: request.status,
      deadline: request.deadline?.toISOString() || null,
      unlock_fee: request.unlock_fee.toNumber(),
      total_unlocks: request._count.unlocks,
      created_at: request.created_at.toISOString(),
    }));
  } catch (error) {
    console.error("Error fetching requests:", error);
    return [];
  }
}

export default async function AdminRequestsPage() {
  const requests = await getRequests();
  return <RequestsClient initialRequests={requests} />;
}
