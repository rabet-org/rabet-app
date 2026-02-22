import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";

export async function GET(req: NextRequest) {
  try {
    const categories = await db.category.findMany({
      where: { is_active: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
      },
    });

    return ok({ data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return ApiError.internal("Failed to fetch categories");
  }
}
