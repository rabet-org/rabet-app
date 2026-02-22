import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { authenticate, isAuthenticated } from "@/lib/auth";
import { ok, ApiError } from "@/lib/api-response";
import { comparePassword, hashPassword } from "@/lib/password";

/**
 * PATCH /api/users/me/profile
 * Update the current user's profile information and/or password.
 */
export async function PATCH(req: NextRequest) {
  try {
    const userPayload = await authenticate(req);
    if (!isAuthenticated(userPayload)) return userPayload;

    const body = await req.json();
    const { full_name, phone, avatar_url, current_password, new_password } =
      body;

    // Handle password change if requested
    if (current_password && new_password) {
      const userAuth = await db.userAuth.findUnique({
        where: { user_id: userPayload.sub },
      });

      if (!userAuth || !userAuth.password_hash) {
        return ApiError.badRequest("Cannot change password for this account");
      }

      const isValid = await comparePassword(
        current_password,
        userAuth.password_hash,
      );
      if (!isValid) {
        return ApiError.unauthorized("Current password is incorrect");
      }

      if (new_password.length < 8) {
        return ApiError.badRequest(
          "New password must be at least 8 characters",
        );
      }

      const newHash = await hashPassword(new_password);
      await db.userAuth.update({
        where: { user_id: userPayload.sub },
        data: { password_hash: newHash },
      });
    }

    // We only update the profile table, not the core user table (email etc)
    const updatedProfile = await db.userProfile.upsert({
      where: { user_id: userPayload.sub },
      create: {
        user_id: userPayload.sub,
        full_name: full_name ?? "", // full_name is required in DB, so if creating we need it
        phone,
        avatar_url,
      },
      update: {
        ...(full_name !== undefined && { full_name }),
        ...(phone !== undefined && { phone }),
        ...(avatar_url !== undefined && { avatar_url }),
      },
    });

    // Fetch the updated user to return the full standardized user object
    const user = await db.user.findUnique({
      where: { id: userPayload.sub },
    });

    if (!user) {
      return ApiError.notFound("User not found");
    }

    return ok({
      id: user.id,
      email: user.email,
      role: user.role,
      email_verified: user.email_verified,
      is_active: user.is_active,
      last_login_at: user.last_login_at,
      created_at: user.created_at,
      profile: {
        full_name: updatedProfile.full_name,
        phone: updatedProfile.phone,
        avatar_url: updatedProfile.avatar_url,
      },
    });
  } catch (err) {
    console.error("[PATCH /api/users/me/profile]", err);
    return ApiError.internal();
  }
}
