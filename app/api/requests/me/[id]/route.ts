import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/requests/me/[id]
 * Get a specific request by ID (must belong to current user)
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const { id } = await params;

    const request = await db.request.findFirst({
      where: {
        id,
        user_id: userPayload.sub,
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
        _count: {
          select: {
            unlocks: true,
          },
        },
      },
    });

    if (!request) {
      return ApiError.notFound("Request not found");
    }

    return ok({
      ...request,
      unlock_fee: request.unlock_fee.toNumber(),
      total_unlocks: request._count.unlocks,
      _count: undefined,
    });
  } catch (err) {
    console.error("[GET /api/requests/me/[id]]", err);
    return ApiError.internal();
  }
}

/**
 * PATCH /api/requests/me/[id]
 * Update a request
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const { id } = await params;
    const body = await req.json();

    // Verify request belongs to user
    const existing = await db.request.findFirst({
      where: {
        id,
        user_id: userPayload.sub,
      },
    });

    if (!existing) {
      return ApiError.notFound("Request not found");
    }

    const updated = await db.request.update({
      where: { id },
      data: {
        ...body,
        deadline: body.deadline ? new Date(body.deadline) : undefined,
      },
      include: {
        category: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
    });

    return ok({
      ...updated,
      unlock_fee: updated.unlock_fee.toNumber(),
    });
  } catch (err) {
    console.error("[PATCH /api/requests/me/[id]]", err);
    return ApiError.internal();
  }
}

/**
 * DELETE /api/requests/me/[id]
 * Delete a request
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const { id } = await params;

    // Verify request belongs to user
    const existing = await db.request.findFirst({
      where: {
        id,
        user_id: userPayload.sub,
      },
    });

    if (!existing) {
      return ApiError.notFound("Request not found");
    }

    await db.request.delete({
      where: { id },
    });

    return ok({ message: "Request deleted successfully" });
  } catch (err) {
    console.error("[DELETE /api/requests/me/[id]]", err);
    return ApiError.internal();
  }
}
