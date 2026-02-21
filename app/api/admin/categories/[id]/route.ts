import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>; // category_id
}

/**
 * PATCH /api/admin/categories/[id]
 * Updates properties of an existing service category.
 */
export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: category_id } = await params;

    const body = await req.json().catch(() => ({}));
    const { name, slug, description, icon, is_active } = body;

    const existingCategory = await db.category.findUnique({
      where: { id: category_id },
    });

    if (!existingCategory) {
      return ApiError.notFound("Category not found");
    }

    // Protect against duplicate slug collisions if slug is updated
    if (slug && slug !== existingCategory.slug) {
      const slugCollision = await db.category.findUnique({ where: { slug } });
      if (slugCollision) {
        return ApiError.badRequest(
          `Category with slug '${slug}' already exists.`,
        );
      }
    }

    const updatedCategory = await db.category.update({
      where: { id: category_id },
      data: {
        name: name !== undefined ? name : existingCategory.name,
        slug: slug !== undefined ? slug : existingCategory.slug,
        description:
          description !== undefined
            ? description
            : existingCategory.description,
        icon: icon !== undefined ? icon : existingCategory.icon,
        is_active:
          is_active !== undefined ? is_active : existingCategory.is_active,
      },
    });

    // We do not strictly emit an AdminLog for category metadata changes, unless requested

    return ok({
      id: updatedCategory.id,
      name: updatedCategory.name,
      slug: updatedCategory.slug,
      is_active: updatedCategory.is_active,
    });
  } catch (err) {
    console.error("[PATCH /api/admin/categories/[id]]", err);
    return ApiError.internal();
  }
}

/**
 * DELETE /api/admin/categories/[id]
 * Administrator force-deletes a category. Hard deletes are prevented by Prisma bounds, but if safe, destroys.
 */
export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const roleError = requireRole(userPayload, "admin");
    if (roleError) return roleError;

    const { id: category_id } = await params;

    const category = await db.category.findUnique({
      where: { id: category_id },
      include: {
        _count: { select: { requests: true } },
      },
    });

    if (!category) {
      return ApiError.notFound("Category not found.");
    }

    // Safety: Deny delete if active requests depend on it
    if (category._count.requests > 0) {
      return ApiError.badRequest(
        `Cannot delete category '${category.name}' because it has ${category._count.requests} active requests associated with it.`,
      );
    }

    await db.category.delete({
      where: { id: category_id },
    });

    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[DELETE /api/admin/categories/[id]]", err);
    return ApiError.internal();
  }
}
