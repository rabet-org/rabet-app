import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated, requireRole } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { Prisma } from "@prisma/client";

/**
 * GET /api/requests
 * Public/Provider endpoint to list open service requests.
 * Query: ?category_slug=web-design&min_budget=1000&max_budget=5000&page=1&limit=20
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    const category_slug = searchParams.get("category_slug");

    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(
      100,
      Math.max(1, parseInt(searchParams.get("limit") ?? "20")),
    );
    const skip = (page - 1) * limit;

    // Build the query where clause
    const where: Prisma.RequestWhereInput = {
      status: "published", // Only show requests actively looking for providers
    };

    if (category_slug) {
      where.category = {
        slug: category_slug,
      };
    }

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true, // We might truncate this on frontend
          category: {
            select: { name: true, slug: true },
          },
          budget_range: true,
          location: true,
          deadline: true,
          unlock_fee: true,
          created_at: true,
          _count: {
            select: { unlocks: true }, // Show how many providers have unlocked it (creates urgency/competition)
          },
        },
        orderBy: { created_at: "desc" },
        skip,
        take: limit,
      }),
      db.request.count({ where }),
    ]);

    return ok({
      data: requests.map((r) => ({
        ...r,
        unlock_fee: r.unlock_fee.toNumber(),
        total_unlocks: r._count.unlocks,
        _count: undefined,
      })),
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("[GET /api/requests]", err);
    return ApiError.internal();
  }
}

/**
 * POST /api/requests
 * Creates a new service request (job posting).
 */
export async function POST(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    // Only clients can post requests
    const roleError = requireRole(userPayload, "client", "admin");
    if (roleError) return roleError;

    const body = await req.json();
    const {
      category_id,
      title,
      description,
      budget_range,
      location,
      deadline,
    } = body;

    if (!category_id || !title || !description) {
      return ApiError.badRequest(
        "category_id, title, and description are required",
      );
    }

    if (title.length < 5 || description.length < 20) {
      return ApiError.badRequest(
        "Title must be at least 5 chars and description 20 chars",
      );
    }

    // Verify category exists and is active
    const category = await db.category.findUnique({
      where: { id: category_id },
    });

    if (!category || !category.is_active) {
      return ApiError.badRequest("Invalid or inactive category selected");
    }

    // Ensure the default unlock_fee logic exists if doing dynamic pricing later
    const baseUnlockFee = 50.0;

    const newRequest = await db.request.create({
      data: {
        user_id: userPayload.sub,
        category_id,
        title,
        description,
        budget_range,
        location,
        deadline: deadline ? new Date(deadline) : null,
        unlock_fee: baseUnlockFee,
        status: "published", // Requests usually start published immediately
      },
      include: {
        category: {
          select: { name: true, slug: true },
        },
      },
    });

    return ok(
      {
        id: newRequest.id,
        title: newRequest.title,
        description: newRequest.description,
        category: newRequest.category,
        budget_range: newRequest.budget_range,
        location: newRequest.location,
        status: newRequest.status,
        deadline: newRequest.deadline,
        unlock_fee: newRequest.unlock_fee.toNumber(),
        created_at: newRequest.created_at,
      },
      201,
    );
  } catch (err) {
    console.error("[POST /api/requests]", err);
    return ApiError.internal();
  }
}
