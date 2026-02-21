import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { ok, ApiError } from "@/lib/api-response";
import { authenticate, isAuthenticated } from "@/lib/auth";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/requests/[id]
 * Retrieves the details of a single request.
 * Completely hides the client's identity (name, avatar, contact info)
 * UNLESS the caller is the client who created it, or a provider who paid to unlock it.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Attempt authentication, but don't fail if they aren't logged in
    // because this is a public directory endpoint.
    const userPayload = await authenticate(req);
    const isLoggedIn = isAuthenticated(userPayload);
    const callerId = isLoggedIn ? userPayload.sub : null;
    const isProvider = isLoggedIn && userPayload.role === "provider";

    const requestData = await db.request.findUnique({
      where: { id },
      include: {
        category: {
          select: { name: true, slug: true },
        },
        user: {
          select: {
            profile: {
              select: { full_name: true, avatar_url: true, phone: true },
            },
            email: true,
            created_at: true,
          },
        },
        _count: {
          select: { unlocks: true },
        },
      },
    });

    if (!requestData) {
      return ApiError.notFound("Request not found");
    }

    if (["draft", "cancelled"].includes(requestData.status)) {
      return ApiError.forbidden(
        "This request is not available for public viewing",
      );
    }

    // Determine what information the caller is allowed to see
    const isOwner = callerId === requestData.user_id;
    let hasUnlocked = false;

    if (isProvider && callerId) {
      // Check if this specific provider has paid to unlock it
      const providerProfile = await db.providerProfile.findUnique({
        where: { user_id: callerId },
      });

      if (providerProfile) {
        const unlockRecord = await db.leadUnlock.findUnique({
          where: {
            request_id_provider_id: {
              request_id: id,
              provider_id: providerProfile.id,
            },
          },
        });
        hasUnlocked = !!unlockRecord && unlockRecord.status === "completed";
      }
    }

    const canSeeIdentity = isOwner || hasUnlocked;

    return ok({
      id: requestData.id,
      title: requestData.title,
      description: requestData.description,
      category: requestData.category,
      budget_range: requestData.budget_range,
      location: requestData.location,
      status: requestData.status,
      deadline: requestData.deadline,
      unlock_fee: requestData.unlock_fee.toNumber(),
      total_unlocks: requestData._count.unlocks,

      // Conditionally expose client details
      client: {
        // Always visible public stats
        member_since: requestData.user.created_at,

        // Conditionally visible identity
        name: canSeeIdentity
          ? (requestData.user.profile?.full_name ?? "Client")
          : "Hidden Client",
        avatar_url: canSeeIdentity
          ? requestData.user.profile?.avatar_url
          : null,

        // Highly secure contact info (only if unlocked or owner)
        email: canSeeIdentity ? requestData.user.email : null,
        phone: canSeeIdentity ? requestData.user.profile?.phone : null,
      },

      has_unlocked: hasUnlocked, // Tell the frontend if they need to show the "Pay to Unlock" button
      is_owner: isOwner,
      created_at: requestData.created_at,
      updated_at: requestData.updated_at,
    });
  } catch (err) {
    console.error("[GET /api/requests/[id]]", err);
    return ApiError.internal();
  }
}
