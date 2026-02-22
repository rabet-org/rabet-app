import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";

/**
 * GET /api/users/me
 * Get current user with their profile.
 */
export async function GET(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const user = await db.user.findUnique({
      where: { id: userPayload.sub },
      include: {
        profile: true,
      },
    });

    if (!user) {
      return ApiError.notFound("User not found");
    }

    return ok({
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        email_verified: user.email_verified,
        is_active: user.is_active,
        last_login_at: user.last_login_at,
        created_at: user.created_at,
        full_name: user.profile?.full_name || "",
        phone: user.profile?.phone || null,
        avatar_url: user.profile?.avatar_url || null,
      },
    });
  } catch (err) {
    console.error("[GET /api/users/me]", err);
    return ApiError.internal();
  }
}
