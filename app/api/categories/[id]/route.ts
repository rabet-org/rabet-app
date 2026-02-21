import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/categories/[id]
 * Get a single category by its ID or slug.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Use findFirst so we can match on ID OR slug simultaneously
    const category = await db.category.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        icon: true,
        is_active: true,
      },
    });

    if (!category) {
      return ApiError.notFound("Category not found");
    }

    return ok(category);
  } catch (err) {
    console.error("[GET /api/categories/[id]]", err);
    return ApiError.internal();
  }
}
