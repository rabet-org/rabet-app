import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";

/**
 * GET /api/categories
 * List categories, optionally filtered by is_active.
 * Query: ?is_active=true&page=1&limit=50
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { searchParams } = new URL(req.url);
    const isActiveParam = searchParams.get("is_active");

    let is_active: boolean | undefined = undefined;
    if (isActiveParam === "true") is_active = true;
    else if (isActiveParam === "false") is_active = false;

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "50")),
    );
    const skip = (page - 1) * limit;

    const where = is_active !== undefined ? { is_active } : {};

    const [categories, total] = await Promise.all([
      db.category.findMany({
        where,
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          icon: true,
          is_active: true,
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
      db.category.count({ where }),
    ]);

    return ok({
      data: categories,
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/admin/categories]", err);
    return ApiError.internal();
  }
}

/**
 * POST /api/categories
 * Admin-only endpoint to create a new category.
 */
export async function POST(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    let body;
    try {
      body = await req.json();
    } catch (e) {
      return ApiError.badRequest(
        "Invalid JSON body. Fields 'slug' and 'name' are required",
      );
    }
    const { slug, name, description, icon, is_active } = body;

    // Validate essential fields
    if (!slug || !name) {
      return ApiError.badRequest("Fields 'slug' and 'name' are required");
    }

    // Check if category slug already exists
    const existing = await db.category.findUnique({
      where: { slug },
    });

    if (existing) {
      return ApiError.badRequest("A category with this slug already exists");
    }

    const newCategory = await db.category.create({
      data: {
        slug,
        name,
        description,
        icon,
        is_active: is_active !== undefined ? is_active : true,
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

    return ok(newCategory, 201);
  } catch (err) {
    console.error("[POST /api/categories]", err);
    return ApiError.internal();
  }
}
